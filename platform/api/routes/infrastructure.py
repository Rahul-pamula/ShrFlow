"""
Infrastructure Monitoring API
Phase 11 — Live Webhook Feed
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from utils.jwt_middleware import require_active_tenant, JWTPayload
from utils.permissions import require_permission
from utils.supabase_client import db


router = APIRouter(prefix="/infrastructure", tags=["Infrastructure"])

@router.get("/webhooks/live")
async def get_live_webhooks(
    limit: int = 20,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_SETTINGS"))
):

    """
    Fetch recent webhook events from audit_logs for the live feed.
    Shows both tenant-specific and SYSTEM events related to webhooks.
    """
    # Fetch events where action starts with 'webhook.'
    # We include 'SYSTEM' tenant events because some initial webhook hits 
    # might not have resolved the tenant yet (e.g. generic bounce endpoints).
    res = db.client.table("audit_logs")\
        .select("*")\
        .ilike("action", "webhook.%")\
        .or_(f"tenant_id.eq.{tenant_id},tenant_id.eq.SYSTEM")\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()
    
    return {
        "data": res.data or []
    }

@router.get("/stats")
async def get_infra_stats(
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_SETTINGS"))
):

    """
    Aggregate stats for infrastructure health overview.
    """
    # Get domain count
    domains = db.client.table("domains").select("id", count="exact").eq("tenant_id", tenant_id).execute()
    
    # Get sender count
    senders = db.client.table("sender_identities").select("id", count="exact").eq("tenant_id", tenant_id).execute()
    
    # Get recent bounce count (last 24h)
    # Note: In a real app, this would be a cached Redis value or a pre-aggregated table.
    
    return {
        "domains": domains.count or 0,
        "senders": senders.count or 0,
        "status": "operational"
    }
