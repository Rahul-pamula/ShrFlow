"""
Events API Route
Returns a merged activity feed from:
- campaign_dispatch (sent, failed, pending)
- tracking_events (opens, clicks) — when available
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from utils.jwt_middleware import require_active_tenant, JWTPayload
from utils.permissions import require_permission

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("/")
async def list_events(
    page: int = 1,
    limit: int = 50,
    event_type: Optional[str] = None,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_ANALYTICS"))
):

    """
    Activity feed: merge dispatch events + tracking events
    """
    from utils.supabase_client import db
    
    offset = (page - 1) * limit

    # Fetch dispatch records joined with campaigns
    dispatch_query = db.client.table("campaign_dispatch")\
        .select("id, status, error_log, created_at, updated_at, campaign_id, campaigns!inner(name, tenant_id)")\
        .eq("campaigns.tenant_id", tenant_id)\
        .order("created_at", desc=True)\
        .range(offset, offset + limit - 1)

    if event_type:
        # Map frontend event_type to dispatch status
        status_map = {
            "dispatched": "DISPATCHED",
            "failed": "FAILED",
            "pending": "PENDING",
        }
        if event_type in status_map:
            dispatch_query = dispatch_query.eq("status", status_map[event_type])

    result = dispatch_query.execute()
    records = result.data or []

    # Count total for pagination (Scoped to tenant)
    count_res = db.client.table("campaign_dispatch")\
        .select("id, campaigns!inner(tenant_id)", count="exact")\
        .eq("campaigns.tenant_id", tenant_id)\
        .execute()
    total = count_res.count or len(records)


    events = []
    for r in records:
        camp = r.get("campaigns") or {}
        status = r.get("status", "UNKNOWN")
        
        # Map to a friendly event type
        if status == "DISPATCHED":
            etype = "sent"
            label = "Email Sent"
        elif status == "FAILED":
            etype = "failed"
            label = "Delivery Failed"
        elif status == "CANCELLED":
            etype = "cancelled"
            label = "Cancelled"
        elif status == "PROCESSING":
            etype = "processing"
            label = "Processing"
        else:
            etype = "pending"
            label = "Queued"

        events.append({
            "id": r["id"],
            "type": etype,
            "label": label,
            "campaign_id": r.get("campaign_id"),
            "campaign_name": camp.get("name", "Unknown Campaign"),
            "detail": r.get("error_log") or "",
            "timestamp": r.get("updated_at") or r.get("created_at"),
        })

    return {
        "data": events,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
        }
    }


@router.get("/summary")
async def events_summary(
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_ANALYTICS"))
):

    """Quick stats card for dashboard (O(1) Space Complexity)"""
    from utils.supabase_client import db
    
    # Get campaign IDs for this tenant
    camps = db.client.table("campaigns").select("id").eq("tenant_id", tenant_id).execute()
    camp_ids = [c["id"] for c in (camps.data or [])]

    if not camp_ids:
        return {"sent": 0, "failed": 0, "pending": 0, "total": 0}

    # Execute DB-level COUNT queries instead of fetching full rows into Python memory
    def get_count_for_status(statuses: list):
        res = db.client.table("campaign_dispatch").select("id", count="exact").in_("campaign_id", camp_ids).in_("status", statuses).execute()
        return res.count if hasattr(res, 'count') and res.count is not None else 0

    sent = get_count_for_status(["DISPATCHED"])
    failed = get_count_for_status(["FAILED"])
    pending = get_count_for_status(["PENDING", "PROCESSING"])

    return {
        "sent": sent,
        "failed": failed,
        "pending": pending,
        "total": sent + failed + pending
    }
