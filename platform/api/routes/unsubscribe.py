"""
Unsubscribe Route
GET  /unsubscribe?token={token}  → verify token, mark contact unsubscribed, redirect to /unsubscribe/done
POST /unsubscribe                → same but JSON response (for API use)
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from utils.unsub_token import verify_unsub_token
from utils.supabase_client import db
import logging

logger = logging.getLogger("email_engine.unsubscribe")
router = APIRouter(tags=["Unsubscribe"])

FRONTEND_BASE = "http://localhost:3000"

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

    if not res.data:
        logger.warning(f"[UNSUB] contact_id={contact_id} not found or already unsubscribed")
    else:
        logger.info(f"[UNSUB] contact_id={contact_id} unsubscribed from campaign={campaign_id}")

    # Redirect to frontend confirmation page
    return RedirectResponse(url=f"{FRONTEND_BASE}/unsubscribe?status=success", status_code=302)


@router.post("/unsubscribe")
async def unsubscribe_api(token: str = Query(...)):
    """JSON API version — for programmatic use."""
    try:
        contact_id, campaign_id = verify_unsub_token(token)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid or expired unsubscribe link.")

    db.client.table("contacts")\
        .update({"status": "unsubscribed", "unsubscribed_at": "now()"})\
        .eq("id", contact_id)\
        .execute()

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

    if not res.data:
        return {"message": "No unsubscribed contact found with that email.", "resubscribed": 0}

    ids = [c["id"] for c in res.data]
    for cid in ids:
        db.client.table("contacts").update({
            "status": "active",
            "unsubscribed_at": None,
        }).eq("id", cid).execute()

    logger.info(f"[RESUB] {req.email} re-subscribed ({len(ids)} records updated)")
    return {"message": "You have been re-subscribed successfully.", "resubscribed": len(ids)}
