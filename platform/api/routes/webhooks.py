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
"""

from fastapi import APIRouter, HTTPException, Request, Header
from utils.supabase_client import db
import logging
import json
import hmac
import hashlib
import os

logger = logging.getLogger("email_engine.webhooks")
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

MAILTRAP_WEBHOOK_SECRET = os.getenv("MAILTRAP_WEBHOOK_SECRET", "")


# ── Helpers ────────────────────────────────────────────────────────────

def _suppress_contact(email: str, reason: str):
    """Mark a contact as suppressed. Finds by email across all tenants."""
    try:
        res = db.client.table("contacts").select("id, bounce_count").eq("email", email).execute()
        if not res.data:
            logger.warning(f"[WEBHOOK] No contact found for email {email}")
            return
        for contact in res.data:
            cid = contact["id"]
            if reason == "bounce":
                new_count = (contact.get("bounce_count") or 0) + 1
                update = {
                    "status": "bounced",
                    "bounced_at": "now()",
                    "bounce_count": new_count,
                }
            else:  # spam complaint
                update = {
                    "status": "unsubscribed",
                    "unsubscribed_at": "now()",
                }
            db.client.table("contacts").update(update).eq("id", cid).execute()
            logger.info(f"[WEBHOOK] Contact {cid} ({email}) → {reason}. Updated status.")
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
    # Only hard bounces (permanent failures) suppress the contact
    if "soft" in bounce_type or "temporary" in bounce_type:
        logger.info(f"[WEBHOOK] Soft bounce for {email} — skipping suppression.")
        return {"status": "ignored", "reason": "soft_bounce"}
    _suppress_contact(email, "bounce")
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
async def handle_ses_webhook(request: Request, x_amz_sns_message_type: str = Header(default="")):
    """
    Unified AWS SNS envelope for SES events (Bounce, Complaint, Delivery).
    SES → SNS → this endpoint.
    """
    body_bytes = await request.body()
    body = json.loads(body_bytes)

    # Step 1: SNS subscription confirmation handshake
    if x_amz_sns_message_type == "SubscriptionConfirmation":
        subscribe_url = body.get("SubscribeURL")
        logger.info(f"[SES] SNS subscription confirmation URL: {subscribe_url}")
        # In production: HTTP GET to subscribe_url to confirm subscription
        return {"status": "subscription_received"}

    # Step 2: Process notification
    if x_amz_sns_message_type == "Notification":
        message = json.loads(body.get("Message", "{}"))
        event_type = message.get("eventType") or message.get("notificationType", "")

        if event_type == "Bounce":
            bounce = message.get("bounce", {})
            bounce_type = bounce.get("bounceType", "").lower()
            recipients = bounce.get("bouncedRecipients", [])
            for r in recipients:
                email = r.get("emailAddress")
                if email and bounce_type == "permanent":
                    _suppress_contact(email, "bounce")
                    logger.info(f"[SES] Hard bounce: {email}")

        elif event_type == "Complaint":
            complaint = message.get("complaint", {})
            recipients = complaint.get("complainedRecipients", [])
            for r in recipients:
                email = r.get("emailAddress")
                if email:
                    _suppress_contact(email, "spam")
                    logger.info(f"[SES] Spam complaint: {email}")

        elif event_type == "Delivery":
            logger.info(f"[SES] Delivery event received")

    return {"status": "ok"}
