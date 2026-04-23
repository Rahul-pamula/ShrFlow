"""
Phase 6 — Email Open & Click Tracking

Endpoints:
  GET /track/open/{dispatch_id}   → 1x1 transparent pixel, records open event
  GET /track/click                → records click, redirects to destination URL
"""
import base64
import hashlib
import hmac
import os
from fastapi import APIRouter, Request, Query, HTTPException
from fastapi.responses import Response, RedirectResponse
from utils.supabase_client import db
from typing import Optional
import logging

# Rate limiting
from utils.rate_limiter import limiter

logger = logging.getLogger("email_engine.tracking")
router = APIRouter(prefix="/track", tags=["Tracking"])

# 1×1 transparent GIF (35 bytes)
PIXEL_GIF = base64.b64decode(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
)

# ── Bot Detection ──────────────────────────────────────────────────────────────
BOT_UA_FRAGMENTS = [
    # Search engine bots
    "googlebot", "bingbot", "yahoobot", "slurp", "duckduckbot", "baiduspider",
    "yandexbot", "sogou", "exabot", "semrushbot",
    "ahrefs", "mj12bot", "dotbot", "rogerbot", "screaming frog",
    # Email client image proxies (these pre-load pixels, causing false opens)
    "googleimageproxy",   # Gmail Image Proxy (via ggpht.com)
    "ggpht.com",          # Gmail Image Proxy alternate identifier
    "yahoo link preview", # Yahoo Mail proxy
    "yahooproxy",         # Yahoo proxy
    "applebot",           # Apple bot / MPP fetcher
    # Generic automation / dev tools
    "preview", "scanner", "curl", "python-requests", "go-http-client",
    "postmanruntime", "axios", "okhttp", "facebookexternalhit",
]

# IP prefixes used by major email clients for image proxying
PROXY_IP_PREFIXES_GMAIL = [
    "66.249.84.", "66.249.85.", "66.249.89.", "66.249.91.",
    "72.14.199.", "74.125.", "104.28.", "108.177.",
]
PROXY_IP_PREFIXES_YAHOO = [
    "216.39.62.", "66.218.66.",
]
PROXY_IP_PREFIXES_APPLE = [
    "17.",  # Apple IP space (broad)
]
PROXY_IP_PREFIXES_OUTLOOK = [
    "40.", "52.", "13.107.", "204.79.", "207.46.", "20.",  # MS / Outlook / Defender ranges (broad)
]

TRACKING_SECRET = os.getenv("TRACKING_SECRET", "dev-tracking-secret")
TEST_BYPASS = os.getenv("TRACKING_TEST_BYPASS", "0") == "1"

def _classify_source(user_agent: str, ip: str, honeypot: bool, rapid_click: bool) -> tuple[str, bool]:
    ua = (user_agent or "").lower()
    ip = ip or ""

    if honeypot:
        return "honeypot", True

    if rapid_click:
        return "scanner", True

    # Gmail proxy
    if any(ip.startswith(p) for p in PROXY_IP_PREFIXES_GMAIL) or "googleimageproxy" in ua or "ggpht.com" in ua:
        return "gmail_proxy", True

    # Apple Mail Privacy Protection
    if any(ip.startswith(p) for p in PROXY_IP_PREFIXES_APPLE) or "applebot" in ua:
        return "apple_mpp", True

    # Outlook/Defender
    if any(ip.startswith(p) for p in PROXY_IP_PREFIXES_OUTLOOK) or "safelinks" in ua or "microsoft" in ua:
        return "outlook_proxy", True

    # Yahoo proxy
    if any(ip.startswith(p) for p in PROXY_IP_PREFIXES_YAHOO) or "yahooproxy" in ua:
        return "yahoo_proxy", True

    # Generic bot UA
    if any(frag in ua for frag in BOT_UA_FRAGMENTS):
        return "scanner", True

    return "human", False



def _record_event(
    dispatch_id: str,
    event_type: str,
    url: Optional[str],
    ip: str,
    user_agent: str,
    source: str,
    is_bot: bool,
) -> None:
    """Fire-and-forget: record tracking event in email_events table."""
    try:
        # Get dispatch info
        disp = db.client.table("campaign_dispatch")\
            .select("campaign_id, subscriber_id")\
            .eq("id", dispatch_id)\
            .execute()

        if not disp.data:
            logger.warning(f"[TRACK] dispatch_id {dispatch_id} not found")
            return

        d = disp.data[0]
        campaign_id = d["campaign_id"]
        contact_id  = d["subscriber_id"]

        # Get tenant_id from campaigns table separately
        camp = db.client.table("campaigns")\
            .select("tenant_id")\
            .eq("id", campaign_id)\
            .execute()

        if not camp.data:
            logger.warning(f"[TRACK] campaign {campaign_id} not found")
            return

        tenant_id = camp.data[0]["tenant_id"]
        # Bot detection for click: check if there was a recent open
        # If no open exists yet for this dispatch, it may be a scanner prefetch
        if event_type == "click":
            recent_open = db.client.table("email_events")\
                .select("id, created_at")\
                .eq("dispatch_id", dispatch_id)\
                .eq("event_type", "open")\
                .order("created_at", desc=True)\
                .limit(1)\
                .execute()
            if recent_open.data:
                import datetime
                open_ts = recent_open.data[0]["created_at"]
                # Parse open time and check if click happened < 2 seconds after open
                try:
                    from datetime import timezone
                    open_dt = datetime.datetime.fromisoformat(
                        open_ts.replace("Z", "+00:00")
                    )
                    now_dt = datetime.datetime.now(timezone.utc)
                    delta = (now_dt - open_dt).total_seconds()
                    if delta < 2:
                        source, is_bot = "scanner", True  # Too fast → scanner
                except Exception:
                    pass

        db.client.table("email_events").insert({
            "tenant_id":   tenant_id,
            "campaign_id": campaign_id,
            "dispatch_id": dispatch_id,
            "contact_id":  contact_id,
            "event_type":  event_type,
            "url":         url,
            "ip_address":  ip,
            "user_agent":  user_agent,
            "is_bot":      is_bot,
            "source":      source,
        }).execute()

        logger.info(f"[TRACK] {event_type} | dispatch={dispatch_id} | bot={is_bot}")

    except Exception as e:
        logger.error(f"[TRACK] Failed to record {event_type} event: {e}")


# ── Open Tracking ──────────────────────────────────────────────────────────────

def _verify_signature(dispatch_id: str, payload: Optional[str], signature: Optional[str]) -> None:
    if not signature:
        raise HTTPException(status_code=400, detail="missing signature")
    base = dispatch_id if payload is None else f"{dispatch_id}:{payload}"
    expected = hmac.new(TRACKING_SECRET.encode(), base.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=400, detail="invalid signature")


@router.get("/open/{dispatch_id}")
@limiter.limit("5000/minute")
async def track_open(dispatch_id: str, request: Request, s: Optional[str] = Query(None)):
    """
    Email open tracking pixel.
    Returns a 1×1 transparent GIF. Browser loads this image on email open.
    Records the open event in email_events (bot-filtered).
    """
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    _verify_signature(dispatch_id, None, s)

    # Testing bypass for local QA
    if TEST_BYPASS and (ip.startswith("127.") or ip == "localhost"):
        source, is_bot = "human", False
    else:
        source, is_bot = _classify_source(user_agent, ip, honeypot=False, rapid_click=False)

    _record_event(dispatch_id, "open", None, ip, user_agent, source, is_bot)

    return Response(
        content=PIXEL_GIF,
        media_type="image/gif",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
        }
    )


# ── Click Tracking ─────────────────────────────────────────────────────────────

@router.get("/click")
@limiter.limit("5000/minute")
async def track_click(
    request: Request,
    u: str = Query(..., description="Destination URL (base64url encoded)"),
    d: str = Query(..., description="dispatch_id"),
    s: Optional[str] = Query(None, description="HMAC signature"),
    hp: Optional[int] = Query(None, description="Honeypot flag"),
):
    """
    Link click tracker.
    Called when a recipient clicks a link in the email.
    Records the click then immediately 302 redirects to the real destination.
    """
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    # Decode the destination URL
    padding = '=' * (-len(u) % 4)
    encoded = f"{u}{padding}"
    try:
        destination = base64.urlsafe_b64decode(encoded.encode()).decode()
    except Exception:
        destination = u  # Fallback: use as-is if decode fails

    _verify_signature(d, u, s)

    rapid_click = False
    # rapid_click is checked inside _record_event via recent open; but we also mark honeypot here
    if TEST_BYPASS and (ip.startswith("127.") or ip == "localhost"):
        source, is_bot = "human", False
    else:
        source, is_bot = _classify_source(user_agent, ip, honeypot=bool(hp), rapid_click=rapid_click)

    _record_event(d, "click", destination, ip, user_agent, source, is_bot)

    return RedirectResponse(url=destination, status_code=302)
