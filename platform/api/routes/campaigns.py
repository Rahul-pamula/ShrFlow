"""
PHASE 3: CAMPAIGN ORCHESTRATION
Ultimate Email Platform

Features:
- Campaign CRUD (Create, Read, Update, Delete)
- Snapshotting (Freezing content before send)
- Orchestration (Queueing for background worker)
- **Tenant Isolation**: JWT-based authentication
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
import uuid
import re
import random
import asyncio

# Rate limiting
from utils.rate_limiter import limiter

# Import Validation Models
from models.campaign import (
    CampaignCreate, 
    CampaignUpdate, 
    CampaignResponse, 
    CampaignSnapshotCreate,
    SendRequest
)
from utils.redis_client import redis_client
from utils.rabbitmq_client import mq_client

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

# === JWT Middleware ===
from utils.jwt_middleware import require_active_tenant

# === Utilities ===
def process_spintax(text: str) -> str:
    """Process Spintax: {Hello|Hi|Hey} -> randomly picks one"""
    if not text: return ""
    pattern = r'\{([^{}]+)\}'
    def replace_spintax(match):
        options = match.group(1).split('|')
        return random.choice(options)
    while re.search(pattern, text):
        text = re.sub(pattern, replace_spintax, text)
    return text

def process_merge_tags(text: str, contact: dict) -> str:
    """Process merge tags: {{first_name}} -> actual value"""
    if not text: return ""
    pattern = r'\{\{(\w+)(?:\|([^}]+))?\}\}'
    def replace_tag(match):
        field = match.group(1)
        fallback = match.group(2) or ""
        return str(contact.get(field, fallback) or fallback)
    return re.sub(pattern, replace_tag, text)


# === Campaign Routes ===

@router.post("/", response_model=dict)
async def create_campaign(campaign: CampaignCreate, tenant_id: str = Depends(require_active_tenant)):
    """
    Create a new email campaign (Tenant Scoped).
    """
    from utils.supabase_client import db
    
    # 1. Verify Tenant Status
    tenant_result = db.client.table("tenants").select("status").eq("id", tenant_id).execute()
    if not tenant_result.data or tenant_result.data[0]["status"] != "active":
        raise HTTPException(status_code=403, detail="Tenant must be active to create campaigns.")
    
    campaign_id = str(uuid.uuid4())
    
    # 2. Insert Campaign
    data = {
        "id": campaign_id,
        "tenant_id": tenant_id,
        "name": campaign.name,
        "subject": campaign.subject,
        "body_html": campaign.body_html,
        "status": campaign.status,
        "scheduled_at": campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
        "created_at": datetime.now().isoformat()
    }
    
    db.client.table("campaigns").insert(data).execute()
    
    return {
        "status": "created",
        "id": campaign_id,
        "message": f"Campaign '{campaign.name}' created."
    }

@router.get("/")
async def list_campaigns(status: Optional[str] = None, limit: int = 50, tenant_id: str = Depends(require_active_tenant)):
    """List all campaigns for the specific Tenant (excluding archived)"""
    from utils.supabase_client import db
    
    query = db.client.table("campaigns").select("id, name, subject, status, created_at, scheduled_at, stats:email_tasks(count)").eq("tenant_id", tenant_id).is_("is_archived", "false")
    
    if status:
        query = query.eq("status", status)
    
    result = query.order("created_at", desc=True).limit(limit).execute()
    return {"campaigns": result.data}

@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant)):
    """Get a single campaign by ID"""
    from utils.supabase_client import db
    
    result = db.client.table("campaigns").select("*").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return result.data[0]

@router.get("/{campaign_id}/dispatch")
async def get_campaign_dispatch(campaign_id: str, tenant_id: str = Depends(require_active_tenant)):
    """Get dispatch records for a campaign (for analytics)"""
    from utils.supabase_client import db
    camp = db.client.table("campaigns").select("id").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not camp.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    result = db.client.table("campaign_dispatch")\
        .select("id, subscriber_id, status, error_log, created_at, updated_at")\
        .eq("campaign_id", campaign_id)\
        .order("created_at", desc=True)\
        .execute()
    return {"data": result.data or []}


@router.patch("/{campaign_id}")
async def update_campaign(campaign_id: str, campaign: CampaignUpdate, tenant_id: str = Depends(require_active_tenant)):
    """Update an existing campaign"""
    from utils.supabase_client import db
    
    update_data = {k: v for k, v in campaign.model_dump().items() if v is not None}
    if "scheduled_at" in update_data and update_data["scheduled_at"]:
        update_data["scheduled_at"] = update_data["scheduled_at"].isoformat()
    
    result = db.client.table("campaigns").update(update_data).eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {"status": "updated", "campaign": result.data[0]}

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant)):
    """Delete a draft campaign, or archive a sent campaign"""
    from utils.supabase_client import db
    
    # Check current status
    result = db.client.table("campaigns").select("status").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    status = result.data[0]["status"]
    
    if status == "draft":
        # Safe to delete completely
        db.client.table("campaigns").delete().eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
        return {"status": "deleted", "id": campaign_id, "message": "Draft campaign deleted permanently."}
    else:
        # Prevent deletion of analytics, hide it instead
        db.client.table("campaigns").update({"is_archived": True}).eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
        return {"status": "archived", "id": campaign_id, "message": "Campaign has been archived."}

class ScheduleRequest(BaseModel):
    scheduled_at: str          # ISO-8601 string e.g. "2025-03-10T09:00:00Z"
    target_list_id: Optional[str] = "all"

@router.post("/{campaign_id}/schedule")
async def schedule_campaign(campaign_id: str, request: ScheduleRequest, tenant_id: str = Depends(require_active_tenant)):
    """Schedule a draft campaign to be sent at a future date/time."""
    from utils.supabase_client import db
    from datetime import timezone

    # 1. Verify ownership and that it's a draft
    result = db.client.table("campaigns").select("status").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if result.data[0]["status"] not in ["draft", "scheduled"]:
        raise HTTPException(status_code=400, detail=f"Only draft campaigns can be scheduled. Current status: {result.data[0]['status']}")

    # 2. Validate: scheduled_at must be in the future
    try:
        scheduled_dt = datetime.fromisoformat(request.scheduled_at.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date format. Use ISO-8601 e.g. 2025-03-10T09:00:00Z")

    if scheduled_dt <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future.")

    # 3. Persist schedule info
    db.client.table("campaigns").update({
        "status": "scheduled",
        "scheduled_at": scheduled_dt.isoformat(),
        "audience_target": request.target_list_id or "all",
        "updated_at": datetime.now().isoformat(),
    }).eq("id", campaign_id).execute()

    return {
        "status": "scheduled",
        "message": f"Campaign scheduled for {scheduled_dt.strftime('%B %d, %Y at %H:%M UTC')}.",
        "scheduled_at": scheduled_dt.isoformat(),
    }

@router.post("/{campaign_id}/send")
@limiter.limit("2/minute")
async def send_campaign(request_obj: Request, campaign_id: str, request: SendRequest, tenant_id: str = Depends(require_active_tenant)):
    """
    ORCHESTRATION TRIGGER:
    1. Validates campaign status (must be draft).
    2. Snapshots HTML & Subject.
    3. Updates status to 'processing'.
    4. Worker (Commander) will pick this up to generate tasks.
    """
    from utils.supabase_client import db
    
    # 1. Fetch Campaign
    campaign_res = db.client.table("campaigns").select("*").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not campaign_res.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaign_res.data[0]
    
    if campaign["status"] not in ["draft", "paused"]:
        raise HTTPException(status_code=400, detail=f"Campaign is in '{campaign['status']}' state. Only draft/paused campaigns can be sent.")
    
    # ── TENANT PLAN QUOTA ENFORCEMENT ──────────────────────────────────
    # We need to calculate audience size *before* we claim intent, 
    # to reject the API call if they don't have enough quota.
    from utils.billing import check_can_send_campaign
    
    target = request.target_list_id or "all"
    contacts_query = db.client.table("contacts")\
        .select("id, email, first_name, last_name")\
        .eq("tenant_id", tenant_id)\
        .not_.in_("status", ["bounced", "unsubscribed"])
        
    if target.startswith("batch:"):
        batch_id = target.split("batch:", 1)[1]
        contacts_query = contacts_query.eq("import_batch_id", batch_id)
        audience_label = f"Batch: {batch_id[:8]}..."
    else:
        audience_label = "All Contacts"
        
    contacts_res = contacts_query.execute()
    contacts = contacts_res.data
    
    if not contacts:
        raise HTTPException(status_code=400, detail=f"No contacts found for audience: {audience_label}")
        
    # Throws 403 Forbidden if quota is exceeded
    check_can_send_campaign(tenant_id=tenant_id, audience_size=len(contacts))
    # ──────────────────────────────────────────────────────────────────

    # ── DAILY SEND LIMIT ENFORCEMENT ──────────────────────────────────
    from datetime import date, timezone as tz
    tenant_res = db.client.table("tenants").select(
        "daily_send_limit, daily_sent_count, daily_count_reset_at"
    ).eq("id", tenant_id).execute()

    if tenant_res.data:
        t = tenant_res.data[0]
        limit = t.get("daily_send_limit") or 1000
        today = date.today().isoformat()
        reset_at = t.get("daily_count_reset_at") or today

        if reset_at != today:
            # New day — reset the counter
            db.client.table("tenants").update({
                "daily_sent_count": 0,
                "daily_count_reset_at": today,
            }).eq("id", tenant_id).execute()
            daily_sent = 0
        else:
            daily_sent = t.get("daily_sent_count") or 0

        if daily_sent >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Daily send limit reached ({limit:,} emails). Limit resets at midnight."
            )
    # ──────────────────────────────────────────────────────────────────

    # 2. Snapshot Content (The Freeze)
    snapshot_id = str(uuid.uuid4())
    snapshot_data = {
        "id": snapshot_id,
        "campaign_id": campaign_id,
        "body_snapshot": campaign["body_html"],
        "subject_snapshot": campaign["subject"],
        "created_at": datetime.now().isoformat()
    }
    
    db.client.table("campaign_snapshots").insert(snapshot_data).execute()
    
    # 3. Update Status in DB & Redis
    update_payload = {
        "status": "sending",
        "scheduled_at": datetime.now().isoformat()
    }
    db.client.table("campaigns").update(update_payload).eq("id", campaign_id).execute()
    
    # Set to SENDING in Redis so workers will process
    await redis_client.set_campaign_status(campaign_id, "SENDING")
    
    # 4. Intent Claims: Insert PENDING rows into campaign_dispatch
    dispatch_records = []
    tasks = []
    
    for contact in contacts:
        dispatch_id = str(uuid.uuid4())
        dispatch_records.append({
            "id": dispatch_id,
            "campaign_id": campaign_id,
            "subscriber_id": contact["id"],
            "status": "PENDING",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        })
        
        # Payload for RabbitMQ
        html_content = process_spintax(campaign["body_html"])
        html_content = process_merge_tags(html_content, contact)
        
        subject = process_spintax(campaign["subject"])
        subject = process_merge_tags(subject, contact)
        
        tasks.append({
            "dispatch_id": dispatch_id,
            "campaign_id": campaign_id,
            "tenant_id": tenant_id,
            "recipient_email": contact["email"],
            "recipient_id": contact["id"],
            "subject": subject,
            "body_html": html_content,
            # Additional config could be added here (e.g. sender email)
        })
        
    # Bulk insert into DB (chunk for Supabase's 1000-row limit)
    CHUNK = 1000
    for i in range(0, len(dispatch_records), CHUNK):
        db.client.table("campaign_dispatch").insert(dispatch_records[i:i+CHUNK]).execute()
    
    # 5. RabbitMQ Producer Call
    await mq_client.publish_tasks(tasks)
    
    # 6. Increment daily send count & monthly cycle count for the tenant
    try:
        db.client.rpc("increment_daily_sent", {"tenant_id_arg": tenant_id, "n": len(tasks)}).execute()
    except Exception:
        # Fallback: direct update
        current_daily = daily_sent if 'daily_sent' in dir() else 0
        
        # We need to fetch current emails_sent_this_cycle to update it manually without RPC
        cycle_res = db.client.table("tenants").select("emails_sent_this_cycle").eq("id", tenant_id).execute()
        current_cycle = 0
        if cycle_res.data and cycle_res.data[0].get("emails_sent_this_cycle"):
            current_cycle = cycle_res.data[0]["emails_sent_this_cycle"]
            
        db.client.table("tenants").update({
            "daily_sent_count": current_daily + len(tasks),
            "emails_sent_this_cycle": current_cycle + len(tasks)
        }).eq("id", tenant_id).execute()
    
    # ── Phase 7: Check if tenant crossed 80% quota → send warning email ──
    try:
        usage_res = db.client.table("tenants").select(
            "email, emails_sent_this_cycle, plans(name, max_monthly_emails)"
        ).eq("id", tenant_id).execute()
        if usage_res.data:
            t = usage_res.data[0]
            plan = t.get("plans") or {}
            limit = plan.get("max_monthly_emails", 1000)
            used = t.get("emails_sent_this_cycle", 0)
            if limit > 0 and used >= limit * 0.8 and t.get("email"):
                # Only send once per cycle (use Redis flag)
                from utils.redis_client import redis_client as rc
                flag_key = f"tenant:{tenant_id}:quota_warning_sent"
                already_sent = await rc.get(flag_key)
                if not already_sent:
                    from services.notification_service import notify_quota_warning
                    await notify_quota_warning(t["email"], used, limit, plan.get("name", "Free"))
                    await rc.set(flag_key, "1", ex=30*24*3600)  # Expires after 30 days
    except Exception as qe:
        logger.warning(f"Quota warning check failed: {qe}")
    
    return {
        "status": "queued",
        "message": f"Campaign queued successfully. {len(tasks)} emails are being dispatched.",
        "dispatched": len(tasks),
        "snapshot_id": snapshot_id
    }

@router.post("/{campaign_id}/pause")
async def pause_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant)):
    """Pause an active campaign using Redis"""
    from utils.supabase_client import db
    
    # Verify ownership
    result = db.client.table("campaigns").select("status").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not result.data: raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Set state in Redis instantly for workers
    await redis_client.set_campaign_status(campaign_id, "PAUSED")
    
    # Also update DB eventually
    db.client.table("campaigns").update({"status": "paused"}).eq("id", campaign_id).execute()
    
    return {"status": "paused", "message": "Campaign paused. Workers will park remaining tasks."}

@router.post("/{campaign_id}/resume")
async def resume_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant)):
    """Resume a paused campaign"""
    from utils.supabase_client import db
    
    # Verify ownership
    result = db.client.table("campaigns").select("status").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not result.data: raise HTTPException(status_code=404, detail="Campaign not found")
    
    if result.data[0]["status"] != "paused":
        raise HTTPException(status_code=400, detail="Campaign must be paused to resume.")

    # Set state in Redis instantly
    await redis_client.set_campaign_status(campaign_id, "SENDING")
    
    # Update DB
    db.client.table("campaigns").update({"status": "sending"}).eq("id", campaign_id).execute()
    
    return {"status": "resumed", "message": "Campaign resumed. Workers will pick up parked tasks."}

@router.post("/{campaign_id}/cancel")
async def cancel_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant)):
    """Permanently cancel a campaign"""
    from utils.supabase_client import db
    
    # Verify ownership
    result = db.client.table("campaigns").select("status").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not result.data: raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Check if all emails already went out — if so, mark as 'sent' not 'cancelled'
    dispatch_res = db.client.table("campaign_dispatch")\
        .select("status")\
        .eq("campaign_id", campaign_id)\
        .execute()
    dispatch_rows = dispatch_res.data or []
    
    if dispatch_rows:
        all_done = all(r["status"] in ("DISPATCHED", "FAILED", "CANCELLED") for r in dispatch_rows)
        any_dispatched = any(r["status"] == "DISPATCHED" for r in dispatch_rows)
        pending_count = sum(1 for r in dispatch_rows if r["status"] in ("PENDING", "PROCESSING"))
        
        if all_done and any_dispatched and pending_count == 0:
            # All emails already went out — this is effectively a successful send
            db.client.table("campaigns").update({"status": "sent"}).eq("id", campaign_id).execute()
            return {
                "status": "sent",
                "message": f"All {len(dispatch_rows)} emails were already sent. Campaign marked as Sent."
            }
    
    # Normal cancel: stop remaining pending tasks
    await redis_client.set_campaign_status(campaign_id, "CANCELLED")
    db.client.table("campaigns").update({"status": "cancelled"}).eq("id", campaign_id).execute()
    db.client.table("campaign_dispatch").update({"status": "CANCELLED"}).eq("campaign_id", campaign_id).eq("status", "PENDING").execute()
    
    pending_stopped = sum(1 for r in dispatch_rows if r["status"] == "PENDING") if dispatch_rows else 0
    return {"status": "cancelled", "message": f"Campaign cancelled. {pending_stopped} pending emails discarded."}

@router.post("/{campaign_id}/preview")
async def preview_campaign(campaign_id: str, sample_contact: Optional[dict] = None, tenant_id: str = Depends(require_active_tenant)):
    """Preview a campaign with sample data"""
    from utils.supabase_client import db
    
    campaign = db.client.table("campaigns").select("*").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not campaign.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign_data = campaign.data[0]
    
    contact = sample_contact or {
        "email": "preview@example.com",
        "first_name": "John",
        "last_name": "Doe"
    }
    
    html_content = process_spintax(campaign_data["body_html"])
    html_content = process_merge_tags(html_content, contact)
    
    subject = process_spintax(campaign_data["subject"])
    subject = process_merge_tags(subject, contact)
    
    return {
        "subject": subject,
        "html": html_content
    }


class TestEmailRequest(BaseModel):
    recipient_email: str

@router.post("/{campaign_id}/test")
async def send_test_email(campaign_id: str, request: TestEmailRequest, tenant_id: str = Depends(require_active_tenant)):
    """Send a test email for this campaign to a specified address."""
    from utils.supabase_client import db
    
    campaign = db.client.table("campaigns").select("*").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not campaign.data:
        raise HTTPException(status_code=404, detail="Campaign not found")

    camp = campaign.data[0]
    sample_contact = {"email": request.recipient_email, "first_name": "Test", "last_name": "User"}

    html_content = process_merge_tags(process_spintax(camp["body_html"]), sample_contact)
    subject = process_merge_tags(process_spintax(camp["subject"]), sample_contact)

    # TODO: Replace with real SMTP send when email sending is connected
    # For now we just log and return success
    import logging
    logging.getLogger("email_engine").info(
        f"[TEST_EMAIL] Campaign='{camp['name']}' → {request.recipient_email} | Subject: {subject}"
    )

    return {
        "status": "sent",
        "message": f"Test email sent to {request.recipient_email}",
        "subject": subject
    }


