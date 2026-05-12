from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from typing import List, Dict, Any, cast, Optional
from pydantic import BaseModel

from services.account_service import AccountService
from services.account_deletion_service import AccountDeletionService
from utils.jwt_middleware import JWTPayload, require_authenticated_user

router = APIRouter(prefix="/account", tags=["Account"])


class AccountSwitchRequest(BaseModel):
    tenant_id: str


@router.get("/workspaces")
async def get_account_workspaces(
    jwt_payload: JWTPayload = Depends(require_authenticated_user),
):
    try:
        return AccountService.list_workspaces(jwt_payload.user_id)
    except Exception as e:
        print(f"[Account API Error] Failed to list workspaces: {e}")
        # Return empty list or raise specific error
        return []


@router.get("/invitations")
async def get_account_invitations(
    jwt_payload: JWTPayload = Depends(require_authenticated_user),
):
    return AccountService.list_invitations(jwt_payload.email)


@router.post("/invitations/{invitation_id}/decline")
async def decline_account_invitation(
    invitation_id: str,
    jwt_payload: JWTPayload = Depends(require_authenticated_user),
):
    try:
        return AccountService.decline_invitation(
            email=jwt_payload.email,
            invitation_id=invitation_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post("/switch")
async def switch_account_workspace(
    body: AccountSwitchRequest,
    response: Response,
    jwt_payload: JWTPayload = Depends(require_authenticated_user),
):
    from routes.auth import _build_auth_response, _create_refresh_token, _set_refresh_cookie, create_access_token
    from utils.supabase_client import db

    link = (
        db.client.table("tenant_users")
        .select("role, isolation_model")
        .eq("user_id", jwt_payload.user_id)
        .eq("tenant_id", body.tenant_id)
        .execute()
    )
    link_res_data = cast(List[Dict[str, Any]], link.data or [])
    if not link_res_data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this workspace.",
        )

    tenant = (
        db.client.table("tenants")
        .select("status")
        .eq("id", body.tenant_id)
        .limit(1)
        .execute()
    )
    tenant_res_data = cast(List[Dict[str, Any]], tenant.data or [])
    if not tenant_res_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    role = link_res_data[0].get("role", "member")
    isolation_model = link_res_data[0].get("isolation_model", "team")
    tenant_status = tenant_res_data[0].get("status", "active")

    new_token = create_access_token(
        {
            "user_id": jwt_payload.user_id,
            "tenant_id": body.tenant_id,
            "email": jwt_payload.email,
            "role": role,
            "isolation_model": isolation_model,
        }
    )

    refresh_token = _create_refresh_token(jwt_payload.user_id, body.tenant_id)
    _set_refresh_cookie(response, refresh_token)
    AccountService.set_last_active_tenant_id(jwt_payload.user_id, body.tenant_id)

    user_res = db.client.table("users").select("*").eq("id", jwt_payload.user_id).execute()
    user_res_data = cast(List[Dict[str, Any]], user_res.data or [])
    user = user_res_data[0] if user_res_data else {}

    return _build_auth_response(
        user_id=jwt_payload.user_id,
        tenant_id=body.tenant_id,
        token=new_token,
        role=role,
        onboarding_required=(tenant_status == "onboarding"),
        tenant_status=tenant_status,
        email_verified=user.get("email_verified", False),
        full_name=user.get("full_name"),
        user_status=user.get("user_status", "active"),
        deletion_scheduled_at=user.get("deletion_scheduled_at"),
    )


@router.get("/delete/preflight")
async def get_account_deletion_preflight(
    jwt_payload: JWTPayload = Depends(require_authenticated_user),
):
    try:
        return AccountDeletionService.build_preflight(jwt_payload.user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post("/delete")
async def request_account_deletion(
    request: Request,
    jwt_payload: JWTPayload = Depends(require_authenticated_user),
):
    try:
        return AccountDeletionService.request_deletion(
            jwt_payload.user_id,
            actor_tenant_id=jwt_payload.tenant_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

@router.post("/cancel-deletion")
async def cancel_account_deletion(
    request: Request,
    jwt_payload: JWTPayload = Depends(require_authenticated_user),
):
    try:
        return AccountDeletionService.cancel_deletion(
            jwt_payload.user_id,
            actor_tenant_id=jwt_payload.tenant_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
