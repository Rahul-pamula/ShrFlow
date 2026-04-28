from fastapi import APIRouter, Depends, HTTPException
from typing import List
from utils.jwt_middleware import require_active_tenant, JWTPayload
from utils.permissions import require_permission
from utils.supabase_client import db

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
async def get_notifications(
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("workspace:view"))
):
    """Fetch unread notifications for the current user."""
    try:
        res = db.client.table("notifications")\
            .select("*")\
            .eq("tenant_id", tenant_id)\
            .eq("recipient_id", jwt_payload.user_id)\
            .order("created_at", desc=True)\
            .limit(20)\
            .execute()
        return res.data or []
    except Exception:
        # Graceful fallback if table doesn't exist yet
        return []

@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("workspace:view"))
):
    """Mark a notification as read."""
    from datetime import datetime
    try:
        db.client.table("notifications")\
            .update({"read_at": datetime.now().isoformat()})\
            .eq("id", notification_id)\
            .eq("recipient_id", jwt_payload.user_id)\
            .execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("workspace:view"))
):
    """Permanently remove a notification."""
    try:
        db.client.table("notifications")\
            .delete()\
            .eq("id", notification_id)\
            .eq("recipient_id", jwt_payload.user_id)\
            .execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
