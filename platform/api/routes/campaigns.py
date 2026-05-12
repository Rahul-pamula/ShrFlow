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
from typing import Optional, List, Dict, Any, cast
from postgrest.types import CountMethod
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
from fastapi import Request
from utils.jwt_middleware import require_active_tenant, apply_data_isolation
from utils.permissions import require_permission, verify_jwt_token, JWTPayload
from utils.state_machine import validate_campaign_transition
from utils.notification_rules import emit_notification, notify_admins
from services.audit_service import write_log

# === Campaign Routes ===

@router.post("/", response_model=dict)
@limiter.limit("20/hour")
async def create_campaign(request: Request, campaign: CampaignCreate, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(require_permission("campaign:create"))):
    """
    Create a new email campaign (Tenant Scoped).
    """
    from utils.supabase_client import db
    
    # 1. Verify Tenant Status
    tenant_result = db.client.table("tenants").select("status").eq("id", tenant_id).execute()
    tenant_res_data = cast(List[Dict[str, Any]], tenant_result.data or [])
    if not tenant_res_data:
        raise HTTPException(status_code=403, detail="Access denied.")
    
    tenant_data = tenant_res_data[0]
    if tenant_data.get("status") != "active":
        raise HTTPException(status_code=403, detail="Access denied.")
    
    # 1.5 Verify Domain
    domain_result = db.client.table("domains").select("status, domain_name").eq("id", str(campaign.domain_id)).eq("tenant_id", tenant_id).execute()
    domain_res_data = cast(List[Dict[str, Any]], domain_result.data or [])
    if not domain_res_data:
        raise HTTPException(status_code=400, detail="Domain not found or does not belong to your workspace.")
    
    domain_data = domain_res_data[0]
    if domain_data.get("status") != "verified":
        raise HTTPException(status_code=400, detail="Access denied.")
        
    campaign_id = str(uuid.uuid4())
    
    # 2. Insert Campaign — status is ALWAYS "draft" regardless of payload
    data = {
        "id": campaign_id,
        "tenant_id": tenant_id,
        "name": campaign.name,
        "subject": campaign.subject,
        "body_html": campaign.body_html,
        "from_name": campaign.from_name,
        "from_prefix": campaign.from_prefix,
        "domain_id": str(campaign.domain_id) if campaign.domain_id else None,
        "status": "draft",
        "scheduled_at": campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
        "created_at": datetime.now().isoformat(),
        "created_by_user_id": jwt_payload.user_id
    }
    
    db.client.table("campaigns").insert(data).execute()
    
    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="campaign_created",
        resource_type="campaign",
        resource_id=campaign_id,
        metadata={"name": campaign.name, "status": campaign.status},
    )
    
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
    jwt_payload: JWTPayload = Depends(require_permission("campaign:view"))
):
    """List tenant campaigns with O(1) pagination, including archived when requested."""
    from utils.supabase_client import db

    query = db.client.table("campaigns").select("id, name, subject, status, created_at, scheduled_at, is_archived").eq("tenant_id", tenant_id)
    count_query = db.client.table("campaigns").select("id", count=CountMethod.exact).eq("tenant_id", tenant_id)

    if status == "archived":
        query = query.is_("is_archived", "true")
        count_query = count_query.is_("is_archived", "true")
    else:
        query = query.is_("is_archived", "false")
        count_query = count_query.is_("is_archived", "false")
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
    campaigns = result.data or []

    if status == "archived":
        for campaign in campaigns:
            campaign["status"] = "archived"
    
    return {
        "campaigns": campaigns,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }

@router.post("/{campaign_id}/archive")
async def archive_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(require_permission("campaign:edit"))):
    """Archive a non-draft campaign without deleting analytics."""
    from utils.supabase_client import db

    result = db.client.table("campaigns").select("status, created_by_user_id, is_archived").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    res_data = cast(List[Dict[str, Any]], result.data or [])
    if not res_data:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign = res_data[0]
        
    if jwt_payload.role == "creator" and campaign.get("created_by_user_id") != jwt_payload.user_id:
        raise HTTPException(status_code=403, detail="You can only archive campaigns that you created.")
    if campaign.get("is_archived"):
        return {"status": "archived", "id": campaign_id, "message": "Campaign is already archived."}
    if campaign.get("status") == "draft":
        raise HTTPException(status_code=400, detail="Draft campaigns should be deleted instead of archived.")

    db.client.table("campaigns").update({"is_archived": True}).eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    return {"status": "archived", "id": campaign_id, "message": "Campaign has been archived."}

@router.post("/{campaign_id}/unarchive")
async def unarchive_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(require_permission("campaign:edit"))):
    """Restore an archived campaign to the active workflow."""
    from utils.supabase_client import db

    result = db.client.table("campaigns").select("status, created_by_user_id, is_archived").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    res_data = cast(List[Dict[str, Any]], result.data or [])
    if not res_data:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign = res_data[0]
    if jwt_payload.role == "creator" and campaign.get("created_by_user_id") != jwt_payload.user_id:
        raise HTTPException(status_code=403, detail="You can only restore campaigns that you created.")
    if not campaign.get("is_archived"):
        return {"status": str(campaign.get("status", "unknown")), "id": campaign_id, "message": "Campaign is already active."}

    db.client.table("campaigns").update({"is_archived": False}).eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    return {"status": "restored", "id": campaign_id, "message": "Campaign restored to the active workflow."}

@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(require_permission("campaign:view"))):
    """Get a single campaign by ID"""
    from utils.supabase_client import db
    
    query = db.client.table("campaigns").select("*").eq("id", campaign_id).eq("tenant_id", tenant_id)
    query = apply_data_isolation(query, jwt_payload)
    result = query.execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    res_data = cast(List[Dict[str, Any]], result.data or [])
    return res_data[0]

@router.get("/{campaign_id}/dispatch")
async def get_campaign_dispatch(campaign_id: str, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(require_permission("campaign:manage"))):
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
async def update_campaign_patch(campaign_id: str, campaign: CampaignUpdate, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(require_permission("campaign:manage"))):
    """Update an existing campaign"""
    from utils.supabase_client import db
    
    # 1. Verify ownership and state
    record = db.client.table("campaigns").select("created_by_user_id, status").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    record_res_data = cast(List[Dict[str, Any]], record.data or [])
    if not record_res_data: raise HTTPException(status_code=404, detail="Campaign not found")
    
    record_data = record_res_data[0]
    current_status = record_data.get("status", "draft")

    # 2. Prevent Editing of Non-Draft Campaigns (Fix 4)
    # Once a campaign is approved or sending, content must be immutable to ensure audit integrity.
    if current_status != "draft":
        raise HTTPException(status_code=400, detail=f"Campaign is in '{current_status}' state and cannot be modified. Only 'draft' campaigns are editable.")

    if jwt_payload.role == "creator" and record_data.get("created_by_user_id") != jwt_payload.user_id:
        raise HTTPException(status_code=403, detail="You can only edit campaigns that you created.")
    
    update_data = {k: v for k, v in campaign.model_dump().items() if v is not None}
    
    update_data["updated_at"] = datetime.now().isoformat()
    
    # Verify domain if it's being updated
    if "domain_id" in update_data:
        domain_result = db.client.table("domains").select("status").eq("id", str(update_data["domain_id"])).eq("tenant_id", tenant_id).execute()
        domain_res_data = cast(List[Dict[str, Any]], domain_result.data or [])
        if not domain_res_data or domain_res_data[0].get("status") != "verified":
            raise HTTPException(status_code=400, detail="Domain not found or is not verified.")
        update_data["domain_id"] = str(update_data["domain_id"])
        
    if "scheduled_at" in update_data and update_data["scheduled_at"]:
        update_data["scheduled_at"] = update_data["scheduled_at"].isoformat()
    
    result = db.client.table("campaigns").update(update_data).eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    res_data = cast(List[Dict[str, Any]], result.data or [])
    
    if not res_data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {"status": "updated", "campaign": res_data[0]}

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(require_permission("campaign:manage"))):
    """Delete a draft campaign, or archive a sent campaign"""
    from utils.supabase_client import db
    
    # Check current status and ownership
    result = db.client.table("campaigns").select("status, created_by_user_id").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    res_data = cast(List[Dict[str, Any]], result.data or [])
    if not res_data:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign_data = res_data[0]
    if jwt_payload.role == "creator" and campaign_data.get("created_by_user_id") != jwt_payload.user_id:
        raise HTTPException(status_code=403, detail="You can only delete campaigns that you created.")    
        
    status = campaign_data.get("status", "draft")
    
    from services.audit_service import write_log
    
    if status == "draft":
        # Safe to delete (hard delete)
        db.client.table("campaigns").delete().eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
        
        await write_log(
            tenant_id=tenant_id,
            user_id=jwt_payload.user_id,
            action="campaign.delete",
            resource_type="campaign",
            resource_id=campaign_id,
            metadata={"status": "draft", "outcome": "hard_delete"}
        )
        return {"status": "deleted", "id": campaign_id, "message": "Draft campaign deleted successfully."}
    else:
        # Prevent deletion of analytics, hide it instead
        db.client.table("campaigns").update({"is_archived": True}).eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
        
        await write_log(
            tenant_id=tenant_id,
            user_id=jwt_payload.user_id,
            action="campaign.delete",
            resource_type="campaign",
            resource_id=campaign_id,
            metadata={"status": status, "outcome": "archived"}
        )
        return {"status": "archived", "id": campaign_id, "message": "Campaign has been removed."}

@router.put("/{campaign_id}")
async def update_campaign_put(campaign_id: str, body: dict, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(require_permission("campaign:edit"))):
    """Update an existing draft or paused campaign."""
    from utils.supabase_client import db

    # Verify ownership and status
    result = db.client.table("campaigns").select("status, created_by_user_id").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    res_data = cast(List[Dict[str, Any]], result.data or [])
    if not res_data:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign_data = res_data[0]
    if jwt_payload.role == "creator" and campaign_data.get("created_by_user_id") != jwt_payload.user_id:
        raise HTTPException(status_code=403, detail="You can only edit campaigns that you created.")

    status = str(campaign_data.get("status", "draft"))
    if status not in ["draft", "paused", "awaiting_review"]:
        raise HTTPException(status_code=400, detail=f"Cannot edit a '{status}' campaign. Only draft, paused, or pending review campaigns can be edited.")

    update_fields = {}
    if "name" in body: update_fields["name"] = body["name"]
    if "subject" in body: update_fields["subject"] = body["subject"]
    if "body_html" in body: update_fields["body_html"] = body["body_html"]
    if "from_name" in body: update_fields["from_name"] = body["from_name"]
    if "from_prefix" in body: update_fields["from_prefix"] = body["from_prefix"]
    if "domain_id" in body: 
        domain_result = db.client.table("domains").select("status").eq("id", str(body["domain_id"])).eq("tenant_id", tenant_id).execute()
        domain_res_data = cast(List[Dict[str, Any]], domain_result.data or [])
        if not domain_res_data or domain_res_data[0].get("status") != "verified":
            raise HTTPException(status_code=403, detail="Access denied.")
        update_fields["domain_id"] = str(body["domain_id"])
    if "scheduled_at" in body: update_fields["scheduled_at"] = body["scheduled_at"]
    if "audience_target" in body: update_fields["audience_target"] = body["audience_target"]

    if not update_fields:
        raise HTTPException(status_code=400, detail="Nothing to update.")

    db.client.table("campaigns").update(update_fields).eq("id", campaign_id).eq("tenant_id", tenant_id).execute()

    return {"status": "updated", "id": campaign_id, "message": "Campaign updated successfully."}

class ScheduleRequest(BaseModel):
    scheduled_at: str          # ISO-8601 string e.g. "2025-03-10T09:00:00Z"
    target_list_id: Optional[str] = "all"

@router.post("/{campaign_id}/schedule")
@limiter.limit("20/hour")
async def schedule_campaign(request: Request, campaign_id: str, request_body: ScheduleRequest, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_permission("campaign:manage"))):
    """Schedule a draft campaign to be sent at a future date/time."""
    from utils.supabase_client import db
    from datetime import timezone

    # 1. Verify ownership and that it's a draft
    result = db.client.table("campaigns").select("status").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign_data = cast(Dict[str, Any], result.data[0])
    current_status = str(campaign_data.get("status", "draft"))
    if current_status not in ["draft", "scheduled", "approved"]:
        raise HTTPException(status_code=400, detail=f"Only draft or approved campaigns can be scheduled. Current status: {current_status}")

    # 2. Validate: scheduled_at must be in the future
    # FIX: use request_body (the Pydantic model), not request (the HTTP Request object)
    try:
        scheduled_dt = datetime.fromisoformat(request_body.scheduled_at.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date format. Use ISO-8601 e.g. 2025-03-10T09:00:00Z")

    if scheduled_dt <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future.")

    # 3. Persist schedule info
    db.client.table("campaigns").update({
        "status": "scheduled",
        "scheduled_at": scheduled_dt.isoformat(),
        "audience_target": request_body.target_list_id or "all",
    }).eq("id", campaign_id).eq("tenant_id", tenant_id).execute()


    return {
        "status": "scheduled",
        "message": f"Campaign scheduled for {scheduled_dt.strftime('%B %d, %Y at %H:%M UTC')}.",
        "scheduled_at": scheduled_dt.isoformat(),
    }

@router.post("/{campaign_id}/send")
@limiter.limit("2/minute")
async def send_campaign(request: Request, campaign_id: str, send_request: SendRequest, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_permission("campaign:send"))):
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
    camp_res_data = cast(List[Dict[str, Any]], campaign_res.data or [])
    if not camp_res_data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = camp_res_data[0]
    
    # STATE MACHINE: only 'approved' or 'paused' campaigns may be sent
    # 'paused' is allowed because a paused campaign was already approved before it started sending
    current_status = str(campaign.get("status", "unknown"))
    if current_status not in ["approved", "paused"]:
        raise HTTPException(
            status_code=400,
            detail=f"Campaign must be approved before sending. Current status: '{current_status}'. "
                   f"An admin must approve it first via POST /campaigns/{{id}}/approve."
        )
    
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

    daily_sent = 0
    tenant_res_data = cast(List[Dict[str, Any]], tenant_res.data or [])
    if tenant_res_data:
        t = tenant_res_data[0]
        if isinstance(t, dict):
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
                daily_sent = int(cast(Any, t.get("daily_sent_count") or 0))

            if daily_sent >= int(cast(Any, limit)):
                raise HTTPException(
                    status_code=429,
                    detail=f"Daily send limit reached ({limit:,} emails). Limit resets at midnight."
                )
    # ──────────────────────────────────────────────────────────────────
    # ── HIGH VOLUME SEND SAFETY ──────────────────────────────────────
    SEND_THRESHOLD = 1000
    if len(contacts) > SEND_THRESHOLD and not send_request.confirmed:
        return {
            "status": "CONFIRMATION_REQUIRED",
            "audience_size": len(contacts),
            "threshold": SEND_THRESHOLD,
            "message": f"Large audience detected ({len(contacts)} recipients). Please confirm you want to send this campaign."
        }
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
        cycle_res_data = cast(List[Dict[str, Any]], cycle_res.data or [])
        current_cycle = 0
        if cycle_res_data and cycle_res_data[0].get("emails_sent_this_cycle"):
            current_cycle = int(cast(Any, cycle_res_data[0]["emails_sent_this_cycle"]))
            
        db.client.table("tenants").update({
            "daily_sent_count": current_daily + len(contacts),
            "emails_sent_this_cycle": current_cycle + len(contacts)
        }).eq("id", tenant_id).execute()
    
    # ── Phase 7: Check if tenant crossed 80% quota → send warning email ──
    try:
        usage_res = db.client.table("tenants").select(
            "email, emails_sent_this_cycle, plans(name, max_monthly_emails)"
        ).eq("id", tenant_id).execute()
        usage_res_data = cast(List[Dict[str, Any]], usage_res.data or [])
        if usage_res_data:
            t = usage_res_data[0]
            plan = cast(Dict[str, Any], t.get("plans") or {})
            limit = int(plan.get("max_monthly_emails") or 1000)
            used = int(t.get("emails_sent_this_cycle") or 0)
            if limit > 0 and used >= limit * 0.8 and t.get("email"):
                # Only send once per cycle (use Redis flag)
                from utils.redis_client import redis_client as rc
                flag_key = f"tenant:{tenant_id}:quota_warning_sent"
                already_sent = await rc.client.get(flag_key)
                if not already_sent:
                    from services.notification_service import notify_quota_warning
                    await notify_quota_warning(str(t.get("email")), used, limit, plan.get("name", "Free"))
                    await rc.client.set(flag_key, "1", ex=30*24*3600)  # Expires after 30 days
    except Exception as qe:
        logger.warning(f"Quota warning check failed: {qe}")
    
    # Audit the send action
    try:
        # We need jwt_payload — it's the _ dependency, grab from send_request context indirectly.
        # Re-fetch from DB using tenant_id for the audit (non-blocking best-effort)
        await write_log(
            tenant_id=tenant_id,
            action="campaign_sent",
            resource_type="campaign",
            resource_id=campaign_id,
            metadata={"dispatched": dispatch_result["dispatched"], "snapshot_id": dispatch_result.get("snapshot_id")},
        )
    except Exception:
        pass  # Audit failure must never block a send

    return {
        "status": "queued",
        "message": f"Campaign queued successfully. {dispatch_result['dispatched']} emails are being dispatched.",
        "dispatched": dispatch_result["dispatched"],
        "snapshot_id": dispatch_result["snapshot_id"]
    }

@router.post("/{campaign_id}/pause")
async def pause_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_permission("campaign:send"))):
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
async def resume_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_permission("campaign:send"))):
    """Resume a paused campaign"""
    from utils.supabase_client import db
    
    # Verify ownership
    result = db.client.table("campaigns").select("status").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not result.data: raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign_data = cast(Dict[str, Any], result.data[0])
    if campaign_data.get("status") != "paused":
        raise HTTPException(status_code=400, detail="Campaign must be paused to resume.")

    # Set state in Redis instantly
    await redis_client.set_campaign_status(campaign_id, "SENDING")
    
    # Update DB
    db.client.table("campaigns").update({"status": "sending"}).eq("id", campaign_id).execute()
    
    return {"status": "resumed", "message": "Campaign resumed. Workers will pick up parked tasks."}

@router.post("/{campaign_id}/cancel")
async def cancel_campaign(campaign_id: str, tenant_id: str = Depends(require_active_tenant), _ = Depends(require_permission("campaign:send"))):
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
        dispatch_rows_typed = [cast(Dict[str, Any], r) for r in dispatch_rows]
        all_done = all(r.get("status") in ("DISPATCHED", "FAILED", "CANCELLED") for r in dispatch_rows_typed)
        any_dispatched = any(r.get("status") == "DISPATCHED" for r in dispatch_rows_typed)
        pending_count = sum(1 for r in dispatch_rows_typed if r.get("status") in ("PENDING", "PROCESSING"))
        
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
    
    dispatch_rows_typed = [cast(Dict[str, Any], r) for r in dispatch_rows] if dispatch_rows else []
    pending_stopped = sum(1 for r in dispatch_rows_typed if r.get("status") == "PENDING")
    return {"status": "cancelled", "message": f"Campaign cancelled. {pending_stopped} pending emails discarded."}

@router.post("/{campaign_id}/preview")
async def preview_campaign(campaign_id: str, sample_contact: Optional[dict] = None, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(require_permission("campaign:manage"))):
    """Preview a campaign with sample data"""
    from utils.supabase_client import db
    
    query = db.client.table("campaigns").select("*").eq("id", campaign_id).eq("tenant_id", tenant_id)
    query = apply_data_isolation(query, jwt_payload)
    result = query.execute()
    res_data = cast(List[Dict[str, Any]], result.data or [])
    
    if not res_data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign_data = res_data[0]
    
    contact = sample_contact or {
        "email": "preview@example.com",
        "first_name": "John",
        "last_name": "Doe"
    }
    
    body_html = str(campaign_data.get("body_html", ""))
    if body_html.strip().startswith("{") and body_html.strip().endswith("}"):
        try:
            import json
            from services.compile_service import compile_design_json
            body_html = compile_design_json(json.loads(body_html), template_id=campaign_id)
        except Exception:
            pass

    html_content = process_spintax(body_html)
    html_content = process_merge_tags(html_content, contact)
    
    subject = process_spintax(str(campaign_data.get("subject", "")))
    subject = process_merge_tags(subject, contact)
    
    return {
        "subject": subject,
        "html": html_content
    }


class TestEmailRequest(BaseModel):
    recipient_email: str

@router.post("/{campaign_id}/test")
async def send_test_email(campaign_id: str, request: TestEmailRequest, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(require_permission("campaign:manage"))):
    """Send a test email for this campaign to a specified address."""
    from utils.supabase_client import db
    
    query = db.client.table("campaigns").select("*").eq("id", campaign_id).eq("tenant_id", tenant_id)
    query = apply_data_isolation(query, jwt_payload)
    result = query.execute()
    res_data = cast(List[Dict[str, Any]], result.data or [])
    
    if not res_data:
        raise HTTPException(status_code=404, detail="Campaign not found")

    camp = res_data[0]
    sample_contact = {"email": request.recipient_email, "first_name": "Test", "last_name": "User"}

    body_html = str(camp.get("body_html", ""))
    if body_html.strip().startswith("{") and body_html.strip().endswith("}"):
        try:
            import json
            from services.compile_service import compile_design_json
            body_html = compile_design_json(json.loads(body_html), template_id=campaign_id)
        except Exception:
            pass

    html_content = process_merge_tags(process_spintax(body_html), sample_contact)
    subject = process_merge_tags(process_spintax(str(camp.get("subject", ""))), sample_contact)

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

@router.post("/{campaign_id}/duplicate")
@limiter.limit("10/hour")
async def duplicate_campaign(request: Request, campaign_id: str, tenant_id: str = Depends(require_active_tenant), jwt_payload: JWTPayload = Depends(require_permission("campaign:manage"))):
    """Duplicate an existing campaign (Tenant Scoped)."""
    from utils.supabase_client import db
    
    # 1. Fetch original campaign
    result = db.client.table("campaigns").select("*").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    res_data = cast(List[Dict[str, Any]], result.data or [])
    if not res_data:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    original = res_data[0]
    
    # 2. Prepare new data
    new_campaign_id = str(uuid.uuid4())
    
    # Handle naming (Copy)
    base_name = str(original.get('name', 'Untitled'))
    if " (Copy)" in base_name:
        # Avoid nested (Copy) (Copy)
        base_name = base_name.split(" (Copy)")[0]
    
    new_name = f"{base_name} (Copy)"
    
    data = {
        "id": new_campaign_id,
        "tenant_id": tenant_id,
        "name": new_name,
        "subject": original.get("subject"),
        "body_html": original.get("body_html"),
        "from_name": original.get("from_name"),
        "from_prefix": original.get("from_prefix"),
        "domain_id": str(original.get("domain_id")) if original.get("domain_id") else None,
        "status": "draft",
        "created_at": datetime.now().isoformat(),
        "created_by_user_id": jwt_payload.user_id,
        "is_archived": False
    }
    
    # 3. Insert new campaign
    db.client.table("campaigns").insert(data).execute()
    
    return {
        "status": "duplicated",
        "id": new_campaign_id,
        "message": f"Campaign duplicated as '{new_name}'"
    }

@router.post("/{campaign_id}/reject", response_model=dict)
async def reject_campaign_review(
    campaign_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("campaign:manage"))
):
    """Move campaign from awaiting_review back to draft and notify Creator."""
    from utils.supabase_client import db
    
    # 1. Fetch Campaign
    campaign_res = db.client.table("campaigns").select("name, created_by_user_id, status").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    camp_res_data = cast(List[Dict[str, Any]], campaign_res.data or [])
    if not camp_res_data:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    
    # 2. Update Status (Atomic)
    campaign_data = camp_res_data[0]
    # 2. Update Status (Atomic)
    validate_campaign_transition(str(campaign_data.get("status", "unknown")), "draft")
    res = db.client.table("campaigns").update({"status": "draft"}).eq("id", campaign_id).eq("status", "awaiting_review").execute()
    
    if not res.data:
        raise HTTPException(status_code=409, detail="State conflict: Campaign was modified or processed by another administrator.")

    # 3. Notify Creator (UX Restoration - Issue 4)
    creator_id = str(campaign_data.get("created_by_user_id", ""))
    await emit_notification(
        tenant_id, creator_id, jwt_payload.user_id, "campaign_rejected",
        "📋 Changes Requested", f"Your campaign '{campaign_data.get('name')}' was returned to draft.",
        {"campaign_id": campaign_id}
    )

    return {"status": "success", "message": "Campaign returned to draft."}


@router.post("/{campaign_id}/approve", response_model=dict)
async def approve_campaign_review(
    campaign_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("campaign:manage"))
):
    """Transition campaign from awaiting_review → approved. Admin/Owner only."""
    from utils.supabase_client import db

    # 1. Fetch campaign
    campaign_res = db.client.table("campaigns").select("name, created_by_user_id, status").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
    if not campaign_res.data:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    campaign_data = cast(Dict[str, Any], campaign_res.data[0])
    current_status = str(campaign_data.get("status", "unknown"))
    
    # 1. State Machine Enforcement (Issue 3)
    validate_campaign_transition(current_status, "approved")

    # 2. Atomic Transition
    # Using optimistic concurrency control (status check)
    update_query = db.client.table("campaigns").update({"status": "approved"}).eq("id", campaign_id).eq("status", current_status)
    
    res = update_query.execute()

    if not res.data:
        raise HTTPException(
            status_code=409, 
            detail="Concurrency Error: This campaign has been modified or approved by someone else. Please refresh."
        )

    campaign_name = str(campaign_data.get("name", "Untitled"))
    creator_id = str(campaign_data.get("created_by_user_id", ""))

    # 3. Notify Creator — only if a different person approved (not the creator themselves)
    # Per system requirements: Creators receive ZERO unsolicited alerts from admin actions.
    # Exception: Approval IS useful UX — the creator needs to know their campaign is ready to send.
    if creator_id and creator_id != jwt_payload.user_id:
        await emit_notification(
            tenant_id, creator_id, jwt_payload.user_id, "campaign_approved",
            "✅ Campaign Approved", f"Your campaign '{campaign_name}' has been approved and is ready to send.",
            {"campaign_id": campaign_id}
        )

    # 4. Audit log
    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="campaign_approved",
        resource_type="campaign",
        resource_id=campaign_id,
        metadata={"campaign_name": campaign_name}
    )

    return {"status": "success", "message": f"Campaign '{campaign_name}' approved and ready to send."}


@router.post("/{campaign_id}/request-review", response_model=dict)
@limiter.limit("10/hour")
async def request_campaign_review(
    request: Request,
    campaign_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("campaign:edit"))
):
    """Transition campaign from draft → awaiting_review and notify Admins/Owners.
    Rate-limited to 10 review requests per hour per IP to prevent spam.
    """
    from utils.supabase_client import db
    from services.email_service import send_campaign_review_notification

    try:
        # 1. Fetch Campaign
        campaign_res = db.client.table("campaigns").select("name, created_by_user_id, status").eq("id", campaign_id).eq("tenant_id", tenant_id).execute()
        if not campaign_res.data:
            raise HTTPException(status_code=404, detail="Campaign not found.")

        campaign_data = cast(Dict[str, Any], campaign_res.data[0])
        current_status = str(campaign_data.get("status", "draft"))
        # STATE MACHINE: only draft or awaiting_review campaigns can (re-)request review
        if current_status not in ["draft", "awaiting_review"]:
            raise HTTPException(
                status_code=400,
                detail=f"Only draft campaigns can request review. Current status: '{current_status}'."
            )

        campaign_name = str(campaign_data.get("name", "Untitled"))

        # 2. Safe creator info lookup — name, role, workspace
        creator_name = "A team member"
        creator_role = "Creator"
        workspace_name = "your workspace"
        try:
            creator_res = db.client.table("users").select("full_name, email").eq("id", jwt_payload.user_id).execute()
            creator_res_data = cast(List[Dict[str, Any]], creator_res.data or [])
            if creator_res_data:
                creator_row = creator_res_data[0]
                creator_name = str(creator_row.get("full_name") or creator_row.get("email") or "A team member")
        except Exception:
            pass

        try:
            role_res = db.client.table("tenant_users").select("role").eq("user_id", jwt_payload.user_id).eq("tenant_id", tenant_id).execute()
            role_res_data = cast(List[Dict[str, Any]], role_res.data or [])
            if role_res_data:
                role_row = role_res_data[0]
                creator_role = str(role_row.get("role", "Creator")).capitalize()
        except Exception:
            pass

        try:
            ws_res = db.client.table("tenants").select("workspace_name").eq("id", tenant_id).execute()
            ws_res_data = cast(List[Dict[str, Any]], ws_res.data or [])
            if ws_res_data:
                ws_row = ws_res_data[0]
                workspace_name = str(ws_row.get("workspace_name") or ws_row.get("company_name") or "your workspace")
        except Exception:
            pass

        # 3. Update Status (Atomic transition)
        validate_campaign_transition(current_status, "awaiting_review")
        db.client.table("campaigns").update({"status": "awaiting_review"}).eq("id", campaign_id).execute()

        # 4. Notify Admins (Issue 4)
        await notify_admins(
            tenant_id=tenant_id,
            sender_id=jwt_payload.user_id,
            event_type="campaign_review",
            title="📋 Campaign Review Requested",
            message=f"{creator_name} ({creator_role}) submitted '{campaign_name}' for review.",
            data={"campaign_id": campaign_id}
        )

        # 5. Email Notification (Keep existing logic for now)
        # (Assuming send_campaign_review_notification is still needed for SMTP)
        tu_res = db.client.table("tenant_users").select("user_id").eq("tenant_id", tenant_id).in_("role", ["owner", "admin"]).execute()
        admin_ids = [str(cast(Dict[str, Any], tu).get("user_id")) for tu in (tu_res.data or [])]
        if admin_ids:
            admins_res = db.client.table("users").select("id, email").in_("id", admin_ids).execute()
            for admin_raw in (admins_res.data or []):
                admin = cast(Dict[str, Any], admin_raw)
                if admin.get("id") == jwt_payload.user_id: continue
                try:
                    await send_campaign_review_notification(
                        to_email=str(admin.get("email")),
                        creator_name=creator_name,
                        campaign_name=campaign_name,
                        campaign_id=campaign_id,
                        creator_role=creator_role,
                        workspace_name=workspace_name,
                    )
                except Exception:
                    pass

        # 7. Audit log
        await write_log(
            tenant_id=tenant_id,
            user_id=jwt_payload.user_id,
            action="campaign_review_requested",
            resource_type="campaign",
            resource_id=campaign_id,
            metadata={"campaign_name": campaign_name}
        )

        return {"status": "success", "message": "Review request sent to workspace administrators."}

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is (they have CORS headers)
    except Exception as e:
        logger.error(f"[request-review] Unexpected error for campaign {campaign_id}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")
