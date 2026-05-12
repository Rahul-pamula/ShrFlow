"""
PASSWORD RESET ROUTES
Phase 1.5 — Auth Security

Two endpoints:
1. POST /auth/forgot-password  → generate token, send reset email
2. POST /auth/reset-password   → verify token, update password
"""

import secrets
import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Request, status
from typing import List, Dict, Any, cast, Optional
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Password Reset"])

APP_URL = os.getenv("APP_URL", "http://localhost:3000")


# ─── Pydantic models ────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class MessageResponse(BaseModel):
    message: str


# ─── Routes ─────────────────────────────────────────────────────

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password reset email",
)
async def forgot_password(body: ForgotPasswordRequest, request: Request):
    """
    Generates a secure reset token and emails a reset link.

    SECURITY:
    - Always returns 200 OK even if email doesn't exist (prevents user enumeration)
    - Token is 64-char cryptographically secure random hex (secrets module)
    - Token expires in 1 hour
    - Old unused tokens for the same user are deleted before creating a new one
    """
    from utils.supabase_client import db
    from services.email_service import send_password_reset_email
    from services.audit_service import write_log

    # Look up user (we still return 200 if not found — prevents enumeration)
    user_result = db.client.table("users").select("id, email").eq("email", body.email).execute()

    user_res_data = cast(List[Dict[str, Any]], user_result.data or [])
    if user_res_data:
        user = user_res_data[0]
        user_id = str(user.get("id", ""))

        # Delete any existing unused tokens for this user
        db.client.table("password_reset_tokens").delete().eq("user_id", user_id).is_("used_at", "null").execute()

        # Generate a new secure token
        reset_token = secrets.token_hex(64)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        db.client.table("password_reset_tokens").insert({
            "user_id": user_id,
            "token": reset_token,
            "expires_at": expires_at.isoformat(),
        }).execute()

        # Fire-and-forget: send the email in the background so response is instant
        import asyncio as _aio
        _aio.create_task(send_password_reset_email(body.email, reset_token))

        # Audit log
        await write_log(
            tenant_id="system",  # no tenant context at password reset
            action="auth.password_reset_request",
            user_id=user_id,
            metadata={"email_domain": body.email.split("@")[1]},  # log domain, not full email
            ip_address=request.client.host if request.client else None,
        )

    # Always return 200 — never reveal if email exists
    return {"message": "If that email is registered, you will receive a reset link shortly."}


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using a token from the reset email",
)
async def reset_password(body: ResetPasswordRequest):
    """
    Validates the reset token and updates the user's password.

    SECURITY:
    - Token must exist, be unused (used_at IS NULL), and not expired
    - Password is rehashed with bcrypt before storing
    - Token is marked as used immediately after successful reset (single-use)
    - Old JWTs are NOT invalidated (future improvement: token blacklist)
    """
    from utils.supabase_client import db
    from routes.auth import hash_password
    from services.audit_service import write_log

    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )

    now = datetime.now(timezone.utc)

    # Find valid token
    token_result = db.client.table("password_reset_tokens").select("*").eq("token", body.token).execute()

    token_res_data = cast(List[Dict[str, Any]], token_result.data or [])
    if not token_res_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link. Please request a new one."
        )

    token_row = token_res_data[0]

    # Check if already used
    if token_row.get("used_at"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link has already been used. Please request a new one."
        )

    # Check expiry
    expires_at = datetime.fromisoformat(token_row["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link has expired. Please request a new one."
        )

    user_id = token_row["user_id"]

    # Update the password
    new_hash = hash_password(body.new_password)
    db.client.table("users").update({
        "password_hash": new_hash,
    }).eq("id", user_id).execute()

    # Mark token as used (single-use)
    db.client.table("password_reset_tokens").update({
        "used_at": now.isoformat()
    }).eq("token", body.token).execute()

    # Audit log
    await write_log(
        tenant_id="system",
        action="auth.password_reset_complete",
        user_id=user_id,
    )

    return {"message": "Password updated successfully. You can now log in with your new password."}


# ─── Email verification routes ───────────────────────────────────

@router.post(
    "/send-verification",
    response_model=MessageResponse,
    summary="Resend email verification link",
)
async def send_verification(body: ForgotPasswordRequest):
    """Resend the email verification link to a user."""
    from utils.supabase_client import db
    from services.email_service import send_email_verification

    user_result = db.client.table("users").select("id, email_verified").eq("email", body.email).execute()

    user_res_data = cast(List[Dict[str, Any]], user_result.data or [])
    if user_res_data:
        user = user_res_data[0]

        if user.get("email_verified"):
            return {"message": "Email is already verified."}

        verify_token = secrets.token_hex(64)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

        # Delete old unused verification tokens
        db.client.table("email_verification_tokens").delete().eq("user_id", user["id"]).is_("used_at", "null").execute()

        db.client.table("email_verification_tokens").insert({
            "user_id": user["id"],
            "token": verify_token,
            "expires_at": expires_at.isoformat(),
        }).execute()

        await send_email_verification(body.email, verify_token)

    return {"message": "If that email is registered and unverified, a verification link has been sent."}


@router.get(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify email address using token from verification email",
)
async def verify_email(token: str):
    """Marks user's email as verified using the token from the verification email."""
    from utils.supabase_client import db

    now = datetime.now(timezone.utc)

    token_result = db.client.table("email_verification_tokens").select("*").eq("token", token).execute()

    token_res_data = cast(List[Dict[str, Any]], token_result.data or [])
    if not token_res_data:
        raise HTTPException(status_code=400, detail="Invalid verification link.")

    token_row = token_res_data[0]

    if token_row.get("used_at"):
        raise HTTPException(status_code=400, detail="This link has already been used.")

    expires_at = datetime.fromisoformat(token_row["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        raise HTTPException(status_code=400, detail="Verification link has expired. Request a new one.")

    # Mark email as verified
    db.client.table("users").update({"email_verified": True}).eq("id", token_row["user_id"]).execute()
    db.client.table("email_verification_tokens").update({"used_at": now.isoformat()}).eq("token", token).execute()

    return {"message": "Email verified successfully! You can now log in."}
