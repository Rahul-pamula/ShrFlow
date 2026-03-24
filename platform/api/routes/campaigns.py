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
import logging

logger = logging.getLogger(__name__)

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
from services.campaign_dispatch_service import (
    fetch_contacts_for_target,
    process_merge_tags,
    process_spintax,
    queue_campaign_dispatch,
)

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

# === JWT Middleware ===
from utils.jwt_middleware import require_active_tenant, verify_jwt_token, JWTPayload, require_admin_or_owner, apply_data_isolation

# === Campaign Routes ===

@router.post("/", response_model=dict)
async def create_campaign(campaign: CampaignCreate, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(verify_jwt_token)):
    """
    Create a new email campaign (Tenant Scoped).
    """
    from utils.supabase_client import db
    
    # 1. Verify Tenant Status
    tenant_result = db.client.table("tenants").select("status").eq("id", tenant_id).execute()
    if not tenant_result.data or tenant_result.data[0]["status"] != "active":
        raise HTTPException(status_code=403, detail="Tenant must be active to create campaigns.")
    
    # 1.5 Verify Domain
    domain_result = db.client.table("domains").select("status, domain_name").eq("id", str(campaign.domain_id)).eq("tenant_id", tenant_id).execute()
    if not domain_result.data:
        raise HTTPException(status_code=400, detail="Domain not found or does not belong to your workspace.")
    if domain_result.data[0]["status"] != "verified":
        raise HTTPException(status_code=400, detail="Selected domain must be verified before it can be used for sending.")
        
    campaign_id = str(uuid.uuid4())
    
    # 2. Insert Campaign
    data = {
        "id": campaign_id,
        "tenant_id": tenant_id,
        "name": campaign.name,
        "subject": campaign.subject,
        "body_html": campaign.body_html,
        "from_name": campaign.from_name,
        "from_prefix": campaign.from_prefix,
        "domain_id": str(campaign.domain_id) if campaign.domain_id else None,
        "status": campaign.status,
        "scheduled_at": campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
        "created_at": datetime.now().isoformat(),
        "created_by_user_id": jwt_payload.user_id
    }
    
    db.client.table("campaigns").insert(data).execute()
    
    return {
        "status": "created",
        "id": campaign_id,
        "message": f"Campaign '{campaign.name}' created."
    }

@router.get("/")
async def list_campaigns(
    status: Optional[str] = None, 
    page: int = 1,
    limit: int = 20,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(verify_jwt_token)
):
    """List all campaigns for the specific Tenant (excluding archived) with O(1) Pagination"""
    from utils.supabase_client import db
    
    # Base query for data
    query = db.client.table("campaigns").select("id, name, subject, status, created_at, scheduled_at").eq("tenant_id", tenant_id).is_("is_archived", "false")
    
    # Base query for total count (O(1) metadata)
    count_query = db.client.table("campaigns").select("id", count="exact").eq("tenant_id", tenant_id).is_("is_archived", "false")
    
    if status:
        query = query.eq("status", status)
        count_query = count_query.eq("status", status)
        
    query = apply_data_isolation(query, jwt_payload)
    count_query = apply_data_isolation(count_query, jwt_payload)
    
    # Execute Count
    count_res = count_query.execute()
    total = count_res.count if count_res.count is not None else 0
    total_pages = (total + limit - 1) // limit if limit > 0 else 0

    # Execute Paginated Data
    offset = (page - 1) * limit
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    return {
        "campaigns": result.data,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }

@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(verify_jwt_token)):
    """Get a single campaign by ID"""
    from utils.supabase_client import db
    
    query = db.client.table("campaigns").select("*").eq("id", campaign_id).eq("tenant_id", tenant_id)
    query = apply_data_isolation(query, jwt_payload)
    result = query.execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return result.data[0]

@router.get("/{campaign_id}/dispatch")
async def get_campaign_dispatch(campaign_id: str, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(verify_jwt_token)):
    """Get dispatch records for a campaign (for analytics)"""
    from utils.supabase_client import db
    query = db.client.table("campaigns").select("id").eq("id", campaign_id).eq("tenant_id", tenant_id)
    query = apply_data_isolation(query, jwt_payload)
    camp = query.execute()
    
    if not camp.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    result = db.client.table("campaign_dispatch")\
        .select("id, subscriber_id, status, error_log, created_at, updated_at")\
        .eq("campaign_id", campaign_id)\
        .order("created_at", desc=True)\
        .execute()
    return {"data": result.data or []}


@router.patch("/{campaign_id}")
async def update_campaign_patch(campaign_id: str, campaign: CampaignUpdate, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(verify_jwt_token)):
    """Update an existing campaign"""
    from utils.supabase_client import db
    
    # Verify ownership
    record = db.client.table("campaigns").select("created_by_user_id").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not record.data: raise HTTPException(status_code=404, detail="Campaign not found")
    if jwt_payload.role == "member" and record.data[0].get("created_by_user_id") != jwt_payload.user_id:
        raise HTTPException(status_code=403, detail="You can only edit campaigns that you created.")
    
    update_data = {k: v for k, v in campaign.model_dump().items() if v is not None}
    
    # Verify domain if it's being updated
    if "domain_id" in update_data:
        domain_result = db.client.table("domains").select("status").eq("id", str(update_data["domain_id"])).eq("tenant_id", tenant_id).execute()
        if not domain_result.data or domain_result.data[0]["status"] != "verified":
            raise HTTPException(status_code=400, detail="Domain not found or is not verified.")
        update_data["domain_id"] = str(update_data["domain_id"])
        
    if "scheduled_at" in update_data and update_data["scheduled_at"]:
        update_data["scheduled_at"] = update_data["scheduled_at"].isoformat()
    
    result = db.client.table("campaigns").update(update_data).eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {"status": "updated", "campaign": result.data[0]}

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(verify_jwt_token)):
    """Delete a draft campaign, or archive a sent campaign"""
    from utils.supabase_client import db
    
    # Check current status and ownership
    result = db.client.table("campaigns").select("status, created_by_user_id").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if jwt_payload.role == "member" and result.data[0].get("created_by_user_id") != jwt_payload.user_id:
        raise HTTPException(status_code=403, detail="You can only delete campaigns that you created.")    
        
    status = result.data[0]["status"]
    
    if status == "draft":
        # Safe to delete completely
        db.client.table("campaigns").delete().eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
        return {"status": "deleted", "id": campaign_id, "message": "Draft campaign deleted permanently."}
    else:
        # Prevent deletion of analytics, hide it instead
        db.client.table("campaigns").update({"is_archived": True}).eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
        return {"status": "archived", "id": campaign_id, "message": "Campaign has been archived."}

@router.put("/{campaign_id}")
async def update_campaign_put(campaign_id: str, body: dict, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(verify_jwt_token)):
    """Update an existing draft or paused campaign."""
    from utils.supabase_client import db

    # Verify ownership and status
    result = db.client.table("campaigns").select("status, created_by_user_id").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if jwt_payload.role == "member" and result.data[0].get("created_by_user_id") != jwt_payload.user_id:
        raise HTTPException(status_code=403, detail="You can only edit campaigns that you created.")

    status = result.data[0]["status"]
    if status not in ["draft", "paused"]:
        raise HTTPException(status_code=400, detail=f"Cannot edit a '{status}' campaign. Only draft or paused campaigns can be edited.")

    update_fields = {}
    if "name" in body: update_fields["name"] = body["name"]
    if "subject" in body: update_fields["subject"] = body["subject"]
    if "body_html" in body: update_fields["body_html"] = body["body_html"]
    if "from_name" in body: update_fields["from_name"] = body["from_name"]
    if "from_prefix" in body: update_fields["from_prefix"] = body["from_prefix"]
    if "domain_id" in body: 
        domain_result = db.client.table("domains").select("status").eq("id", str(body["domain_id"])).eq("tenant_id", tenant_id).execute()
        if not domain_result.data or domain_result.data[0]["status"] != "verified":
            raise HTTPException(status_code=400, detail="Domain not found or is not verified.")
        update_fields["domain_id"] = str(body["domain_id"])

    if not update_fields:
        raise HTTPException(status_code=400, detail="Nothing to update.")

    db.client.table("campaigns").update(update_fields).eq("id", campaign_id).eq("tenant_id", tenant_id).execute()

    return {"status": "updated", "id": campaign_id, "message": "Campaign updated successfully."}

class ScheduleRequest(BaseModel):
    scheduled_at: str          # ISO-8601 string e.g. "2025-03-10T09:00:00Z"
    target_list_id: Optional[str] = "all"

@router.post("/{campaign_id}/schedule")
async def schedule_campaign(campaign_id: str, request: ScheduleRequest, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_admin_or_owner)):
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
    }).eq("id", campaign_id).execute()

    return {
        "status": "scheduled",
        "message": f"Campaign scheduled for {scheduled_dt.strftime('%B %d, %Y at %H:%M UTC')}.",
        "scheduled_at": scheduled_dt.isoformat(),
    }

@router.post("/{campaign_id}/send")
@limiter.limit("2/minute")
async def send_campaign(request: Request, campaign_id: str, send_request: SendRequest, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_admin_or_owner)):
    """
    ORCHESTRATION TRIGGER:
    1. Validates campaign status (must be draft).
    2. Snapshots HTML & Subject.
    3. Updates status to 'processing'.
    4. Worker (Commander) will pick this up to generate tasks.
    """
    from utils.supabase_client import db
    
    # 1. Fetch Campaign with Domain info
    campaign_res = db.client.table("campaigns").select("*, domains(domain_name)").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not campaign_res.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaign_res.data[0]
    
    if campaign["status"] not in ["draft", "paused"]:
        raise HTTPException(status_code=400, detail=f"Campaign is in '{campaign['status']}' state. Only draft/paused campaigns can be sent.")
    
    # ── TENANT PLAN QUOTA ENFORCEMENT ──────────────────────────────────
    # We need to calculate audience size *before* we claim intent, 
    # to reject the API call if they don't have enough quota.
    from utils.billing import check_can_send_campaign
    
    target = send_request.target_list_id or "all"
    contacts, audience_label = fetch_contacts_for_target(
        supabase=db.client,
        tenant_id=tenant_id,
        target=target,
        exclude_suppressed=True,
    )
    
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

    try:
        dispatch_result = await queue_campaign_dispatch(
            supabase=db.client,
            mq_client=mq_client,
            campaign=campaign,
            tenant_id=tenant_id,
            contacts=contacts,
            redis_client=redis_client,
            mark_campaign_sending=True,
            touch_scheduled_at=True,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    
    # 6. Increment daily send count & monthly cycle count for the tenant
    try:
        db.client.rpc("increment_daily_sent", {"tenant_id_arg": tenant_id, "n": len(contacts)}).execute()
    except Exception:
        # Fallback: direct update
        current_daily = daily_sent if 'daily_sent' in dir() else 0
        
        # We need to fetch current emails_sent_this_cycle to update it manually without RPC
        cycle_res = db.client.table("tenants").select("emails_sent_this_cycle").eq("id", tenant_id).execute()
        current_cycle = 0
        if cycle_res.data and cycle_res.data[0].get("emails_sent_this_cycle"):
            current_cycle = cycle_res.data[0]["emails_sent_this_cycle"]
            
        db.client.table("tenants").update({
            "daily_sent_count": current_daily + len(contacts),
            "emails_sent_this_cycle": current_cycle + len(contacts)
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
        "message": f"Campaign queued successfully. {dispatch_result['dispatched']} emails are being dispatched.",
        "dispatched": dispatch_result["dispatched"],
        "snapshot_id": dispatch_result["snapshot_id"]
    }

@router.post("/{campaign_id}/pause")
async def pause_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_admin_or_owner)):
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
async def resume_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_admin_or_owner)):
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
async def cancel_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_admin_or_owner)):
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
async def preview_campaign(campaign_id: str, sample_contact: Optional[dict] = None, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(verify_jwt_token)):
    """Preview a campaign with sample data"""
    from utils.supabase_client import db
    
    query = db.client.table("campaigns").select("*").eq("id", campaign_id).eq("tenant_id", tenant_id)
    query = apply_data_isolation(query, jwt_payload)
    campaign = query.execute()
    
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
async def send_test_email(campaign_id: str, request: TestEmailRequest, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(verify_jwt_token)):
    """Send a test email for this campaign to a specified address."""
    from utils.supabase_client import db
    
    query = db.client.table("campaigns").select("*").eq("id", campaign_id).eq("tenant_id", tenant_id)
    query = apply_data_isolation(query, jwt_payload)
    campaign = query.execute()
    
    if not campaign.data:
        raise HTTPException(status_code=404, detail="Campaign not found")

    camp = campaign.data[0]
    sample_contact = {"email": request.recipient_email, "first_name": "Test", "last_name": "User"}

    html_content = process_merge_tags(process_spintax(camp["body_html"]), sample_contact)
    subject = process_merge_tags(process_spintax(camp["subject"]), sample_contact)

    from services.email_service import send_raw_html
    
    success = await send_raw_html(
        to_email=request.recipient_email, 
        subject=f"[TEST] {subject}", 
        html_content=html_content
    )
    
    if not success:
        import logging
        logging.getLogger("email_engine").error(f"[TEST_EMAIL] Failed to queue email for {request.recipient_email}")
        raise HTTPException(status_code=500, detail="Failed to enqueue test email to RabbitMQ.")

    import logging
    logging.getLogger("email_engine").info(f"[TEST_EMAIL_QUEUED] Success: {request.recipient_email}")

    return {
        "status": "queued",
        "message": f"Test email successfully queued in RabbitMQ to {request.recipient_email}",
        "subject": subject
    }
