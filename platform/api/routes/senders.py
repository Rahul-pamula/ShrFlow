from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr
import os
import secrets
from datetime import datetime, timezone, timedelta
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from utils.jwt_middleware import require_active_tenant, JWTPayload, verify_jwt_token
from utils.permissions import require_permission
from utils.rate_limiter import limiter
from utils.supabase_client import db
from services.audit_service import write_log

router = APIRouter(prefix="/senders", tags=["Senders"])

class AddSenderRequest(BaseModel):
    email: EmailStr

# ─── SMTP Config from .env ────────────────────────────────────────────────────
SMTP_HOST     = os.getenv("SMTP_HOST", "")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USERNAME", "")
SMTP_PASS     = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM     = os.getenv("SMTP_FROM_EMAIL", "noreply@emailengine.io")
SMTP_NAME     = os.getenv("SMTP_FROM_NAME", "Email Engine")
BACKEND_URL   = os.getenv("BACKEND_URL", "http://localhost:8000")

TOKEN_EXPIRY_HOURS = 24


async def send_verification_email(to_email: str, token: str):
    """Send a custom sender verification email via RabbitMQ Centralized Mailer."""
    from services.email_service import send_sender_verification
    from fastapi import HTTPException
    
    success = await send_sender_verification(to_email, token)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to enqueue sender verification email.")


# ─── List Available Domains for Senders ──────────────────────────────────────
@router.get("/domains")
async def list_sender_domains(
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("ADD_SENDER"))
):
    """List domains available for creating a sender (includes parent domains for franchises)"""
    target_tenant_id = tenant_id
    if jwt_payload.workspace_type == "FRANCHISE":
        t_res = db.client.table("tenants").select("parent_tenant_id").eq("id", tenant_id).single().execute()
        if t_res.data and t_res.data.get("parent_tenant_id"):
            target_tenant_id = t_res.data.get("parent_tenant_id")

    res = db.client.table("domains")\
        .select("id, domain_name, status, created_at")\
        .eq("tenant_id", target_tenant_id)\
        .eq("status", "verified")\
        .order("created_at", desc=True)\
        .execute()
    return {"data": res.data}


# ─── List Senders ──────────────────────────────────────────────────────────────
@router.get("/")
async def list_senders(
    tenant_id: str = Depends(require_active_tenant), 
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_SENDER"))
):
    """
    List sender identities. 
    Agency Member: Sees only their own.
    Team Member / Admin / Owner: Sees all.
    """
    query = db.client.table("sender_identities").select("*").eq("tenant_id", tenant_id)
    
    if jwt_payload.role == "member" and getattr(jwt_payload, "isolation_model", "team") == "agency":
        query = query.eq("user_id", jwt_payload.user_id)
        
    res = query.order("created_at", desc=True).execute()
    return {"data": res.data}


# ─── Add New Sender → sends verification email via our SMTP ───────────────────
@router.post("/")
@limiter.limit("5/hour")
async def add_sender_identity(
    request: Request,
    body: AddSenderRequest, 
    tenant_id: str = Depends(require_active_tenant), 
    jwt_payload: JWTPayload = Depends(require_permission("ADD_SENDER"))
):
    """
    Request verification for a sender email address.
    Sends a custom verification email FROM our centralized SMTP (shrmail.app@gmail.com)
    TO the sender address. If the sender has no inbox (e.g. sales@rahulpamula.me),
    Cloudflare Email Routing will forward it to their real inbox.
    """
    email = body.email.strip().lower()
    
    # 1. Verify domain is registered and verified.
    # For FRANCHISE workspaces, check the MAIN OWNER's domain.
    domain_part = email.split("@")[1]
    
    domain_tenant_id = tenant_id
    if jwt_payload.workspace_type == "FRANCHISE":
        # Get parent_tenant_id
        t_res = db.client.table("tenants").select("parent_tenant_id").eq("id", tenant_id).single().execute()
        if t_res.data and t_res.data.get("parent_tenant_id"):
            domain_tenant_id = t_res.data.get("parent_tenant_id")
            
    d_res = db.client.table("domains").select("status").eq("tenant_id", domain_tenant_id).eq("domain_name", domain_part).execute()
    if not d_res.data or d_res.data[0]["status"] != "verified":
        raise HTTPException(status_code=403, detail="Access denied.")

    # 2. Check if already verified in DB
    existing = db.client.table("sender_identities").select("id, status").eq("tenant_id", tenant_id).eq("email", email).execute()
    if existing.data:
        if existing.data[0]["status"] == "verified":
            raise HTTPException(status_code=400, detail="This sender email is already verified in your workspace.")
        # If pending, resend a fresh token below — delete the old one first
        db.client.table("sender_identities").delete().eq("id", existing.data[0]["id"]).execute()

    # 3. Generate a secure verification token
    token = secrets.token_urlsafe(48)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)).isoformat()

    # 4. Save to DB with status=pending
    try:
        inserted = db.client.table("sender_identities").insert({
            "tenant_id": tenant_id,
            "user_id": jwt_payload.user_id,
            "email": email,
            "status": "pending",
            "verification_token": token,
            "token_expires_at": expires_at
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save sender in database: {str(e)}")

    # 5. Send the verification email via our own SMTP
    await send_verification_email(email, token)

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="sender.add",
        resource_type="sender_identity",
        resource_id=inserted.data[0].get("id"),
        metadata={"email_domain": email.split("@")[1]},  # domain only — not PII
    )

    return {
        "status": "success",
        "message": f"A verification email has been sent to {email} from our centralized mail. Please check that inbox (or your Cloudflare forwarding destination) and click the link.",
        "data": inserted.data[0]
    }


# ─── Confirm Sender via Token (clicked from email link) ───────────────────────
@router.get("/confirm")
async def confirm_sender_token(token: str):
    """
    Public endpoint — no auth needed. Called when the user clicks the verification
    link inside the email. Marks the sender as verified.
    """
    res = db.client.table("sender_identities").select("*").eq("verification_token", token).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Invalid or expired verification token.")
    
    sender = res.data[0]
    
    # Check expiry
    expires_at = sender.get("token_expires_at")
    if expires_at:
        exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > exp:
            raise HTTPException(status_code=410, detail="This verification link has expired. Please request a new one from the app.")
    
    if sender["status"] == "verified":
        return {"status": "already_verified", "message": "This sender address is already verified. You can close this tab."}

    # Mark as verified and clear the token
    db.client.table("sender_identities").update({
        "status": "verified",
        "verification_token": None,
        "token_expires_at": None
    }).eq("id", sender["id"]).execute()

    # Return a simple success HTML page
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content="""
    <html>
    <head><title>Sender Verified</title></head>
    <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; 
                 height: 100vh; background: #0f0f0f; margin: 0;">
        <div style="text-align: center; background: #1a1a1a; border: 1px solid #2a2a2a;
                    border-radius: 12px; padding: 48px; max-width: 400px;">
            <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
            <h2 style="color: #fff; margin-bottom: 12px;">Sender Verified!</h2>
            <p style="color: #888; line-height: 1.6;">
                Your sender address has been verified successfully.<br/>
                You can now use it as a FROM address in your campaigns.
            </p>
            <p style="color: #555; font-size: 12px; margin-top: 24px;">
                You can close this tab.
            </p>
        </div>
    </body>
    </html>
    """, status_code=200)


# ─── Resend Verification ───────────────────────────────────────────────────────
@router.post("/{sender_id}/verify")
async def resend_verification(
    sender_id: str, 
    tenant_id: str = Depends(require_active_tenant), 
    jwt_payload: JWTPayload = Depends(require_permission("ADD_SENDER"))
):
    """Resend the verification email with a fresh token."""
    res = db.client.table("sender_identities").select("*").eq("id", sender_id).eq("tenant_id", tenant_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Sender not found")
    
    sender = res.data[0]
    if sender["status"] == "verified":
        return {"status": "already_verified", "message": "This sender is already verified."}
    
    # Generate a new token
    token = secrets.token_urlsafe(48)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)).isoformat()
    
    db.client.table("sender_identities").update({
        "verification_token": token,
        "token_expires_at": expires_at
    }).eq("id", sender_id).execute()
    
    await send_verification_email(sender["email"], token)
    
    return {"status": "success", "message": "Verification email resent."}


# ─── Delete Sender ─────────────────────────────────────────────────────────────
@router.delete("/{sender_id}")
async def delete_sender(
    sender_id: str, 
    tenant_id: str = Depends(require_active_tenant), 
    jwt_payload: JWTPayload = Depends(require_permission("ADD_SENDER"))
):
    """Delete sender identity from DB."""
    res = db.client.table("sender_identities").select("*").eq("id", sender_id).eq("tenant_id", tenant_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Sender not found")
        
    if jwt_payload.role == "member" and getattr(jwt_payload, "isolation_model", "team") == "agency" and res.data[0]["user_id"] != jwt_payload.user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own sender identities.")
            
    db.client.table("sender_identities").delete().eq("id", sender_id).execute()
    return {"status": "success", "message": "Sender identity removed"}
