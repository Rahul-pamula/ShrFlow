"""
Unsubscribe Route
GET  /unsubscribe?token={token}  → verify token, mark contact unsubscribed, redirect to /unsubscribe/done
POST /unsubscribe                → same but JSON response (for API use)
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, cast, Optional
from fastapi.responses import RedirectResponse
from utils.unsub_token import verify_unsub_token
from utils.supabase_client import db
import os
import logging

logger = logging.getLogger("email_engine.unsubscribe")
router = APIRouter(tags=["Unsubscribe"])

FRONTEND_BASE = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3000").replace(":8000", ":3000") # simplistic fallback

def _record_unsubscribe_event(contact_id: str, campaign_id: str, tenant_id: str):
    try:
        res = db.client.table("campaign_dispatch")\
            .select("id")\
            .eq("campaign_id", campaign_id)\
            .eq("subscriber_id", contact_id)\
            .execute()
        res_data = cast(List[Dict[str, Any]], res.data or [])
        if res_data:
            dispatch_id = res_data[0].get("id")
            db.client.table("email_events").insert({
                "tenant_id": tenant_id,
                "dispatch_id": dispatch_id,
                "campaign_id": campaign_id,
                "contact_id": contact_id,
                "event_type": "unsubscribe",
                "source": "human",
                "ip_address": "",
                "user_agent": ""
            }).execute()
    except Exception as e:
        print(f"[UNSUB_CRASH] EVENT INSERT FAILED: {e}")
        logger.error(f"[UNSUB] Failed to log unsubscribe event to email_events: {e}")

@router.get("/unsubscribe")
async def unsubscribe_via_link(token: str = Query(...)):
    """
    Called when a contact clicks the unsubscribe link in an email.
    Verifies the signed token, marks contact as 'unsubscribed', then
    redirects to the frontend confirmation page.
    """
    try:
        contact_id, campaign_id = verify_unsub_token(token)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid or expired unsubscribe link.")

    # Mark contact as unsubscribed
    res = db.client.table("contacts")\
        .update({"status": "unsubscribed", "unsubscribed_at": "now()"})\
        .eq("id", contact_id)\
        .execute()

    res_data = cast(List[Dict[str, Any]], res.data or [])
    if not res_data:
        logger.warning(f"[UNSUB] contact_id={contact_id} not found or already unsubscribed")
    else:
        logger.info(f"[UNSUB] contact_id={contact_id} unsubscribed from campaign={campaign_id}")
        tenant_id = res_data[0].get("tenant_id")
        if tenant_id:
            _record_unsubscribe_event(contact_id, campaign_id, str(tenant_id))

    # Redirect to frontend confirmation page
    return RedirectResponse(url=f"{FRONTEND_BASE}/unsubscribe?status=success", status_code=302)


@router.post("/unsubscribe")
async def unsubscribe_api(token: str = Query(...)):
    """JSON API version — for programmatic use."""
    try:
        contact_id, campaign_id = verify_unsub_token(token)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid or expired unsubscribe link.")

    res = db.client.table("contacts")\
        .update({"status": "unsubscribed", "unsubscribed_at": "now()"})\
        .eq("id", contact_id)\
        .execute()
        
    res_data = cast(List[Dict[str, Any]], res.data or [])
    if res_data:
        tenant_id = res_data[0].get("tenant_id")
        if tenant_id:
            _record_unsubscribe_event(contact_id, campaign_id, str(tenant_id))

    return {"message": "Successfully unsubscribed", "contact_id": contact_id}


from pydantic import BaseModel

class ResubscribeRequest(BaseModel):
    email: str

@router.post("/resubscribe")
async def resubscribe(req: ResubscribeRequest):
    """
    Re-subscribe a contact who previously unsubscribed.
    Finds all contacts matching the email (across all tenants) and reactivates them.
    """
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=422, detail="Invalid email address.")

    res = db.client.table("contacts")\
        .select("id, status")\
        .eq("email", req.email.strip().lower())\
        .eq("status", "unsubscribed")\
        .execute()

    res_data = cast(List[Dict[str, Any]], res.data or [])
    if not res_data:
        return {"message": "No unsubscribed contact found with that email.", "resubscribed": 0}

    ids = [str(c.get("id")) for c in res_data]
    for cid in ids:
        db.client.table("contacts").update({
            "status": "subscribed",
            "unsubscribed_at": None,
        }).eq("id", cid).execute()

    logger.info(f"[RESUB] {req.email} re-subscribed ({len(ids)} records updated)")
    return {"message": "You have been re-subscribed successfully.", "resubscribed": len(ids)}
