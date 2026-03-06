"""
Phase 6 — Email Open & Click Tracking

Endpoints:
  GET /track/open/{dispatch_id}   → 1x1 transparent pixel, records open event
  GET /track/click                → records click, redirects to destination URL
"""
import base64
import time
from fastapi import APIRouter, Request, Query
from fastapi.responses import Response, RedirectResponse
from utils.supabase_client import db
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
    "googlebot", "bingbot", "yahoobot", "slurp", "duckduckbot", "baiduspider",
    "yandexbot", "sogou", "exabot", "facebookexternalhit", "semrushbot",
    "ahrefs", "mj12bot", "dotbot", "rogerbot", "screaming frog",
    "preview", "scanner", "curl", "python-requests", "go-http-client",
    "postmanruntime", "axios", "okhttp",
]

def _is_bot(user_agent: str) -> bool:
    ua = (user_agent or "").lower()
    return any(frag in ua for frag in BOT_UA_FRAGMENTS)



def _record_event(dispatch_id: str, event_type: str, url: str | None,
                  ip: str, user_agent: str) -> None:
    """Fire-and-forget: record tracking event in email_events table."""
    try:
        # Get campaign + contact from dispatch record (simple query, no join)
        disp = db.client.table("campaign_dispatch")\
            .select("campaign_id, subscriber_id")\
            .eq("id", dispatch_id)\
            .single()\
            .execute()

        if not disp.data:
            logger.warning(f"[TRACK] dispatch_id {dispatch_id} not found")
            return

        d = disp.data
        campaign_id = d["campaign_id"]
        contact_id  = d["subscriber_id"]

        # Get tenant_id from campaigns table separately
        camp = db.client.table("campaigns")\
            .select("tenant_id")\
            .eq("id", campaign_id)\
            .single()\
            .execute()

        if not camp.data:
            logger.warning(f"[TRACK] campaign {campaign_id} not found")
            return

        tenant_id = camp.data["tenant_id"]
        is_bot    = _is_bot(user_agent)

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
                        is_bot = True  # Too fast → scanner
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
        }).execute()

        logger.info(f"[TRACK] {event_type} | dispatch={dispatch_id} | bot={is_bot}")

    except Exception as e:
        logger.error(f"[TRACK] Failed to record {event_type} event: {e}")


# ── Open Tracking ──────────────────────────────────────────────────────────────

@router.get("/open/{dispatch_id}")
@limiter.limit("5000/minute")
async def track_open(dispatch_id: str, request: Request):
    """
    Email open tracking pixel.
    Returns a 1×1 transparent GIF. Browser loads this image on email open.
    Records the open event in email_events (bot-filtered).
    """
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    _record_event(dispatch_id, "open", None, ip, user_agent)

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
    url: str = Query(..., description="Destination URL (base64url encoded)"),
    d: str   = Query(..., description="dispatch_id"),
):
    """
    Link click tracker.
    Called when a recipient clicks a link in the email.
    Records the click then immediately 302 redirects to the real destination.
    """
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    # Decode the destination URL
    try:
        destination = base64.urlsafe_b64decode(url.encode() + b"==").decode()
    except Exception:
        destination = url  # Fallback: use as-is if not base64

    _record_event(d, "click", destination, ip, user_agent)

    return RedirectResponse(url=destination, status_code=302)
