"""
Phase 5 — Bounce & Spam Complaint Webhook Handler

Receives delivery event callbacks from:
 - AWS SES (via SNS)
 - Mailtrap
 - Generic SMTP providers

Endpoints:
 POST /webhooks/bounce   — Hard/soft bounce from SES/Mailtrap
 POST /webhooks/spam     — Spam complaint (user clicked "Mark as Spam")
 POST /webhooks/ses      — Unified AWS SNS envelope (SES routes all events here)

Security:
 - /webhooks/ses verifies the AWS SNS message signature before processing ANY event.
   Without this, anyone who knows the URL can POST fake bounces and wipe contacts.
"""

from fastapi import APIRouter, HTTPException, Request, Header
from typing import Optional
from utils.supabase_client import db
import logging
import json
import hmac
import hashlib
import os
import base64
import re
import urllib.request
import urllib.error
from functools import lru_cache

# cryptography is a standard FastAPI-ecosystem dependency; add to requirements.txt if missing
try:
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.x509 import load_pem_x509_certificate
    from cryptography.exceptions import InvalidSignature
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    logging.getLogger("email_engine.webhooks").warning(
        "[SNS] 'cryptography' package not installed — SNS signature verification DISABLED. "
        "Run: pip install cryptography"
    )

logger = logging.getLogger("email_engine.webhooks")
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

MAILTRAP_WEBHOOK_SECRET = os.getenv("MAILTRAP_WEBHOOK_SECRET", "")

# ── SNS Signature Verification ─────────────────────────────────────────

# SNS certificates only ever come from official AWS SNS domains
_VALID_SNS_CERT_DOMAIN = re.compile(r"^sns\.[a-z0-9-]+\.amazonaws\.com$")


@lru_cache(maxsize=32)
def _fetch_sns_certificate(cert_url: str) -> bytes:
    """
    Fetch and cache the AWS SNS signing certificate by URL.
    lru_cache prevents repeated HTTP fetches for the same cert within a process lifetime.
    Raises ValueError if the URL is not from a legitimate AWS SNS domain.
    """
    if not cert_url.startswith("https://"):
        raise ValueError(f"[SNS] Certificate URL must use HTTPS: {cert_url}")
    parsed_host = cert_url.split("/")[2]
    if not _VALID_SNS_CERT_DOMAIN.match(parsed_host):
        raise ValueError(
            f"[SNS] Certificate URL host '{parsed_host}' is not a trusted AWS SNS domain."
        )
    try:
        with urllib.request.urlopen(cert_url, timeout=5) as resp:
            return resp.read()
    except urllib.error.URLError as e:
        raise ValueError(f"[SNS] Failed to fetch signing certificate: {e}")


def _build_sns_signing_string(body: dict, msg_type: str) -> bytes:
    """
    Build the canonical signing string per the AWS SNS specification.
    https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
    """
    if msg_type == "Notification":
        fields = ["Message", "MessageId", "Subject", "Timestamp", "TopicArn", "Type"]
    else:
        # SubscriptionConfirmation and UnsubscribeConfirmation
        fields = ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"]

    parts = []
    for field in fields:
        if field in body:
            parts.append(field)
            parts.append(body[field])
    return "\n".join(parts).encode("utf-8") + b"\n"


def verify_sns_signature(body: dict) -> bool:
    """
    Verify the AWS SNS message signature.

    Returns True  → signature is valid, message is authentic
    Returns False → invalid or unverifiable (caller should HTTP 403)

    In ENVIRONMENT=development, verification is skipped so local curl testing works.
    In ENVIRONMENT=production, a failed verification rejects the request completely.
    """
    env = os.getenv("ENVIRONMENT", "development").lower()
    if env == "development":
        logger.debug("[SNS] Development mode — skipping SNS signature verification")
        return True

    if not CRYPTO_AVAILABLE:
        logger.error(
            "[SNS] Cannot verify signature — 'cryptography' package not installed. "
            "Rejecting request. Run: pip install cryptography"
        )
        return False

    try:
        cert_url = body.get("SigningCertURL", "")
        signature_b64 = body.get("Signature", "")
        msg_type = body.get("Type", "")

        if not cert_url or not signature_b64:
            logger.warning("[SNS] Missing SigningCertURL or Signature — rejecting.")
            return False

        cert_pem = _fetch_sns_certificate(cert_url)
        cert = load_pem_x509_certificate(cert_pem)
        public_key = cert.public_key()

        signing_string = _build_sns_signing_string(body, msg_type)
        signature = base64.b64decode(signature_b64)

        public_key.verify(signature, signing_string, padding.PKCS1v15(), hashes.SHA1())
        logger.info("[SNS] ✅ Signature verified")
        return True

    except InvalidSignature:
        logger.error("[SNS] ❌ Signature INVALID — request rejected.")
        return False
    except ValueError as e:
        logger.error(f"[SNS] ❌ Certificate validation error: {e}")
        return False
    except Exception as e:
        logger.error(f"[SNS] ❌ Unexpected verification error: {e}")
        return False


# ── Redis bounce counter ───────────────────────────────────────────────

def _write_bounce_to_redis(tenant_id: str):
    """
    [ARCH FIX — CRITICAL] Increment the rolling bounce counter for a tenant in Redis.

    The circuit breaker that 'auto-throttles on >2% bounce' checks this key.
    Without this write, the circuit breaker is completely deaf and your AWS SES
    account can be suspended before you notice the spike.

    Key pattern: tenant:{tenant_id}:bounces:rolling
    TTL: 30 days (rolling window resets with each write)
    """
    try:
        from utils.redis_client import redis_client
        import asyncio
        key = f"tenant:{tenant_id}:bounces:rolling"

        async def _incr():
            await redis_client.incr(key)
            await redis_client.expire(key, 60 * 60 * 24 * 30)  # 30-day rolling window

        asyncio.ensure_future(_incr())
        logger.debug(f"[WEBHOOK] Bounce counter incremented for tenant {tenant_id}")
    except Exception as e:
        logger.warning(f"[WEBHOOK] Failed to write bounce counter for tenant {tenant_id}: {e}")


# ── Helpers ────────────────────────────────────────────────────────────

def _resolve_tenant_ids_for_email(email: str) -> list[str]:
    """
    Resolve which tenant(s) recently sent email to this address.
    Returns an empty list if unknown → prevents cross-tenant suppression.
    """
    try:
        contact_res = (
            db.client.table("contacts")
            .select("id, tenant_id")
            .eq("email", email)
            .execute()
        )
        if not contact_res.data:
            return []
        return list({row["tenant_id"] for row in contact_res.data if row.get("tenant_id")})
    except Exception as e:
        logger.error(f"[WEBHOOK] Failed to resolve tenant for {email}: {e}")
        return []


def _suppress_contact(
    email: str,
    reason: str,
    bounce_reason: Optional[str] = None,
    tenant_id: Optional[str] = None,
):
    """
    Mark a contact as suppressed — STRICTLY SCOPED TO ONE TENANT.

    Design principle: A bounce in Tenant A MUST NEVER suppress Tenant B's contact,
    even if both tenants have the same email address.
    """
    try:
        query = (
            db.client.table("contacts")
            .select("id, tenant_id, bounce_count")
            .eq("email", email)
        )

        if tenant_id:
            # Caller knows the exact tenant — filter directly
            query = query.eq("tenant_id", tenant_id)
        else:
            # Fallback: resolve from dispatch records — only tenants that SENT to this email
            resolved_tenants = _resolve_tenant_ids_for_email(email)
            if not resolved_tenants:
                logger.warning(
                    f"[WEBHOOK] No tenant resolved for {email} — skipping suppression "
                    "to avoid cross-tenant damage."
                )
                return
            query = query.in_("tenant_id", resolved_tenants)

        res = query.execute()
        if not res.data:
            logger.warning(f"[WEBHOOK] No contact found for {email} in resolved tenants")
            return

        for contact in res.data:
            cid = contact["id"]
            scoped_tenant = contact["tenant_id"]

            if reason == "bounce":
                new_count = (contact.get("bounce_count") or 0) + 1
                update = {
                    "status": "bounced",
                    "bounced_at": "now()",
                    "bounce_count": new_count,
                    "bounce_reason": bounce_reason,
                }
            else:  # spam complaint
                update = {
                    "status": "unsubscribed",
                    "unsubscribed_at": "now()",
                }

            # BELT-AND-SUSPENDERS: scope update to BOTH id AND tenant_id
            (
                db.client.table("contacts")
                .update(update)
                .eq("id", cid)
                .eq("tenant_id", scoped_tenant)
                .execute()
            )
            logger.info(
                f"[WEBHOOK] Contact {cid} ({email}) tenant={scoped_tenant} → {reason}"
            )
    except Exception as e:
        logger.error(f"[WEBHOOK] Failed to suppress {email}: {e}")


# ── Generic Bounce Endpoint ────────────────────────────────────────────

@router.post("/bounce")
async def handle_bounce(request: Request):
    """
    Generic bounce webhook. Accepts JSON body with at least { "email": "..." }.
    Mailtrap, SparkPost, and others can be configured to POST here.
    """
    body = await request.json()
    email = body.get("email") or body.get("recipient")
    if not email:
        raise HTTPException(status_code=422, detail="Missing 'email' field in body.")
    bounce_type = body.get("type", "hard").lower()
    if "soft" in bounce_type or "temporary" in bounce_type:
        logger.info(f"[WEBHOOK] Soft bounce for {email} — skipping suppression.")
        return {"status": "ignored", "reason": "soft_bounce"}
    bounce_reason_detail = body.get("reason", bounce_type)
    _suppress_contact(email, "bounce", bounce_reason_detail)
    return {"status": "ok", "action": "contact_marked_bounced", "email": email}


# ── Generic Spam Complaint Endpoint ───────────────────────────────────

@router.post("/spam")
async def handle_spam_complaint(request: Request):
    """
    Generic spam complaint webhook.
    Called when a recipient marks an email as spam in Gmail / Outlook / Yahoo.
    """
    body = await request.json()
    email = body.get("email") or body.get("recipient")
    if not email:
        raise HTTPException(status_code=422, detail="Missing 'email' field in body.")
    _suppress_contact(email, "spam")
    return {"status": "ok", "action": "contact_unsubscribed_via_spam", "email": email}


# ── AWS SES unified SNS endpoint ───────────────────────────────────────

@router.post("/ses")
async def handle_ses_webhook(
    request: Request,
    x_amz_sns_message_type: str = Header(default=""),
):
    """
    Unified AWS SNS envelope for SES events (Bounce, Complaint, Delivery).
    Pipeline: SES → SNS Topic → HTTP POST → this endpoint.

    SECURITY: Every request is verified against the AWS SNS RSA signing certificate
    before any data is read or mutated. Unauthenticated requests return HTTP 403.
    """
    body_bytes = await request.body()
    try:
        body = json.loads(body_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    # ── Step 0: Verify AWS SNS Signature (MUST be first) ──────────────
    if not verify_sns_signature(body):
        logger.warning(
            f"[SES] SNS signature verification FAILED from {request.client.host} — rejecting."
        )
        raise HTTPException(status_code=403, detail="SNS signature verification failed.")

    # ── Step 1: Auto-confirm SNS subscription ─────────────────────────
    if x_amz_sns_message_type == "SubscriptionConfirmation":
        subscribe_url = body.get("SubscribeURL", "")
        logger.info("[SES] SNS SubscriptionConfirmation received — auto-confirming.")
        if subscribe_url:
            try:
                with urllib.request.urlopen(subscribe_url, timeout=5):
                    logger.info("[SES] SNS subscription confirmed ✅")
            except Exception as e:
                logger.error(f"[SES] Failed to auto-confirm SNS subscription: {e}")
        return {"status": "subscription_confirmed"}

    # ── Step 2: Process Notification ──────────────────────────────────
    if x_amz_sns_message_type == "Notification":
        try:
            message = json.loads(body.get("Message", "{}"))
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid SNS Message JSON.")

        event_type = message.get("eventType") or message.get("notificationType", "")

        # Extract tenant_id from SES message tags (set this in your SES config)
        mail = message.get("mail", {})
        raw_tags = mail.get("tags", [])
        tags = (
            {t.get("name"): t.get("value") for t in raw_tags}
            if isinstance(raw_tags, list)
            else {}
        )
        tenant_id: Optional[str] = tags.get("tenant_id") or None

        if event_type == "Bounce":
            bounce = message.get("bounce", {})
            bounce_type = bounce.get("bounceType", "").lower()       # permanent | transient | undetermined
            bounce_sub = bounce.get("bounceSubType", "")             # General | NoEmail | MailboxFull | etc.
            recipients = bounce.get("bouncedRecipients", [])

            for r in recipients:
                email = r.get("emailAddress")
                if not email:
                    continue
                diag_code = r.get("diagnosticCode", "")
                b_reason = f"{bounce_sub} - {diag_code}" if diag_code else bounce_sub

                if bounce_type == "permanent":
                    # Permanent: NoEmail, MailboxDoesNotExist, etc. → immediate suppress
                    _suppress_contact(email, "bounce", bounce_reason=b_reason, tenant_id=tenant_id)
                    if tenant_id:
                        _write_bounce_to_redis(tenant_id)  # feed the circuit breaker
                    logger.info(f"[SES] Hard bounce suppressed: {email} [{bounce_sub}]")

                elif bounce_type == "transient":
                    # Transient: MailboxFull, MessageTooLarge, etc. → worker retry handles it
                    logger.info(
                        f"[SES] Transient bounce for {email} [{bounce_sub}] — no suppression (retry eligible)"
                    )

                else:
                    # Undetermined → log, do not suppress
                    logger.warning(
                        f"[SES] Undetermined bounce type for {email} [{bounce_sub}] — logging only"
                    )

        elif event_type == "Complaint":
            complaint = message.get("complaint", {})
            recipients = complaint.get("complainedRecipients", [])
            for r in recipients:
                email = r.get("emailAddress")
                if email:
                    _suppress_contact(email, "spam", tenant_id=tenant_id)
                    logger.info(f"[SES] Spam complaint: {email}")

        elif event_type == "Delivery":
            logger.debug("[SES] Delivery confirmation event received")

        else:
            logger.info(f"[SES] Unhandled SNS event type: '{event_type}'")

    return {"status": "ok"}
