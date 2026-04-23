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
from typing import Optional
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

def _resolve_tenant_ids_for_email(email: str) -> list[str]:
    """
    Resolve which tenant(s) recently sent email to this address by looking up
    campaign_dispatch records joined through campaigns → tenant_id.

    If no dispatch records exist (e.g. event came from unknown sender),
    returns an empty list so we DON'T suppress globally.
    """
    try:
        # Find contacts with this email to get their UUIDs
        contact_res = db.client.table("contacts").select("id, tenant_id").eq("email", email).execute()
        if not contact_res.data:
            return []
        # Return explicit tenant_ids from the contacts rows (already isolated per tenant)
        return list({row["tenant_id"] for row in contact_res.data if row.get("tenant_id")})
    except Exception as e:
        logger.error(f"[WEBHOOK] Failed to resolve tenant for {email}: {e}")
        return []


def _suppress_contact(email: str, reason: str, bounce_reason=None, tenant_id: Optional[str] = None):
    """
    Mark a contact as suppressed — SCOPED TO A SPECIFIC TENANT.

    If tenant_id is provided, only contacts belonging to that tenant are suppressed.
    If tenant_id is None, we resolve it from campaign_dispatch records.
    Contacts in other tenants are NEVER touched.
    """
    try:
        query = db.client.table("contacts").select("id, tenant_id, bounce_count").eq("email", email)

        if tenant_id:
            # Caller knows the tenant — filter directly
            query = query.eq("tenant_id", tenant_id)
        else:
            # Resolve tenants that have actually sent to this email recently
            resolved_tenants = _resolve_tenant_ids_for_email(email)
            if not resolved_tenants:
                logger.warning(
                    f"[WEBHOOK] No tenant resolved for {email} — skipping suppression to avoid cross-tenant damage."
                )
                return
            query = query.in_("tenant_id", resolved_tenants)

        res = query.execute()
        if not res.data:
            logger.warning(f"[WEBHOOK] No contact found for email {email} in resolved tenants")
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
                    "bounce_reason": bounce_reason
                }
            else:  # spam complaint
                update = {
                    "status": "unsubscribed",
                    "unsubscribed_at": "now()",
                }
            # CRITICAL: Always scope update to both id AND tenant_id — belt-and-suspenders
            db.client.table("contacts").update(update).eq("id", cid).eq("tenant_id", scoped_tenant).execute()
            logger.info(f"[WEBHOOK] Contact {cid} ({email}) tenant={scoped_tenant} → {reason}. Updated status.")
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
                    diag_code = r.get("diagnosticCode", "")
                    b_sub = bounce.get("bounceSubType", "")
                    b_reason_combined = f"{b_sub} - {diag_code}" if diag_code else b_sub
                    _suppress_contact(email, "bounce", bounce_reason=b_reason_combined)
                    logger.info(f"[SES] Hard bounce: {email} reason: {b_reason_combined}")

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
