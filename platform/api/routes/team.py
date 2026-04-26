import csv
import io
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from utils.rate_limiter import limiter
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr

from services.audit_service import write_log
from utils.jwt_middleware import require_active_tenant, require_authenticated_user, JWTPayload, verify_jwt_token
from utils.permissions import require_permission, can
from utils.supabase_client import db
from services.email_service import send_team_invite

router = APIRouter(prefix="/team", tags=["Team & Workspaces"])

VALID_MEMBER_ROLES = {"owner", "manager", "member"}
VALID_ISOLATION_MODELS = {"team", "agency"}

def enforce_main_workspace(tenant_id: str):
    res = db.client.table("tenants").select("workspace_type").eq("id", tenant_id).single().execute()
    if res.data and res.data.get("workspace_type") == "FRANCHISE":
        raise HTTPException(status_code=403, detail="Access denied.")

class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "member"
    isolation_model: str = "team"

class AcceptInviteRequest(BaseModel):
    token: str

class UpdateRoleRequest(BaseModel):
    role: Optional[str] = None
    isolation_model: Optional[str] = None


class TransferOwnershipRequest(BaseModel):
    new_owner_role_for_current_user: str = "manager"


class CreateFranchiseRequest(BaseModel):
    email: EmailStr
    workspace_name: str


# Helper to check if current user is owner/manager

def _normalize_public_role(role: Optional[str]) -> str:
    if role == "admin":
        return "manager"
    return role or "member"


def _normalize_storage_role(role: Optional[str]) -> str:
    if role == "manager":
        return "admin"
    return role or "member"


def _iso_to_dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _get_workspace_name(tenant_id: str) -> str:
    tenant_res = (
        db.client.table("tenants")
        .select("company_name")
        .eq("id", tenant_id)
        .execute()
    )
    if not tenant_res.data:
        return "Your Workspace"
    return tenant_res.data[0].get("company_name") or "Your Workspace"


def _get_user_name(user_id: str, fallback: str) -> str:
    user_res = db.client.table("users").select("full_name").eq("id", user_id).execute()
    if not user_res.data:
        return fallback
    return user_res.data[0].get("full_name") or fallback


def _get_membership(tenant_id: str, user_id: str) -> Optional[dict]:
    res = (
        db.client.table("tenant_users")
        .select("id, user_id, role, isolation_model, joined_at")
        .eq("tenant_id", tenant_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        return None
    return res.data[0]


def _count_owners(tenant_id: str) -> int:
    res = (
        db.client.table("tenant_users")
        .select("id")
        .eq("tenant_id", tenant_id)
        .eq("role", "owner")
        .execute()
    )
    return len(res.data or [])



@router.get("/members")
async def get_team_members(
    tenant_id: str = Depends(require_active_tenant),
    _: JWTPayload = Depends(require_permission("VIEW_TEAM")),
):
    """List all users in the current workspace."""
    # Since Supabase rest doesn't easily do clean many-to-many joins without RPC, we'll fetch both and map
    tu_res = db.client.table("tenant_users").select("user_id, role, isolation_model, joined_at").eq("tenant_id", tenant_id).execute()
    members = tu_res.data or []
    if not members:
        return []

    user_ids = [m["user_id"] for m in members]
    users_res = db.client.table("users").select("id, email, full_name, avatar_url, last_login_at").in_("id", user_ids).execute()
    users_by_id = {u["id"]: u for u in (users_res.data or [])}

    result = []
    for m in members:
        u = users_by_id.get(m["user_id"], {})
        result.append({
            "user_id": m["user_id"],
            "role": _normalize_public_role(m["role"]),
            "isolation_model": m.get("isolation_model", "team"),
            "joined_at": m["joined_at"],
            "email": u.get("email"),
            "full_name": u.get("full_name"),
            "avatar_url": u.get("avatar_url"),
            "last_login_at": u.get("last_login_at"),
        })
    return result


@router.get("/members/export")
async def export_team_members(
    role: Optional[str] = Query(None),
    invited_by: Optional[str] = Query(None),
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_TEAM")),
):
    """Export current workspace members as a CSV."""
    if _normalize_public_role(jwt_payload.role) not in ["owner", "manager"]:
        raise HTTPException(status_code=403, detail="You do not have permission to export members.")

    if role and role not in VALID_MEMBER_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role filter.")

    # Apply RLS-like logic for managers: they can only export members they invited.
    if _normalize_public_role(jwt_payload.role) == "manager":
        if invited_by and invited_by != jwt_payload.user_id:
            raise HTTPException(status_code=403, detail="Managers can only export their own invitees.")
        invited_by = jwt_payload.user_id # Enforce

    query = db.client.table("tenant_users").select("user_id, role, isolation_model, joined_at, invited_by").eq("tenant_id", tenant_id)
    if invited_by:
        query = query.eq("invited_by", invited_by)
        
    members_res = query.order("joined_at", desc=False).execute()
    memberships = members_res.data or []

    if role:
        target_storage_role = _normalize_storage_role(role)
        memberships = [member for member in memberships if member["role"] == target_storage_role]

    user_ids = [member["user_id"] for member in memberships]
    users_by_id = {}
    if user_ids:
        users_res = (
            db.client.table("users")
            .select("id, email, full_name")
            .in_("id", user_ids)
            .execute()
        )
        users_by_id = {user["id"]: user for user in (users_res.data or [])}

    import io
    import csv
    import logging
    logger = logging.getLogger(__name__)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["First Name", "Last Name", "Email", "Role", "Date Joined"])
    
    for m in memberships:
        u = users_by_id.get(m["user_id"], {})
        full_name = (u.get("full_name") or "").strip()
        parts = full_name.split(None, 1) if full_name else ["", ""]
        first_name = parts[0] if parts else ""
        last_name = parts[1] if len(parts) > 1 else ""
        writer.writerow([
            first_name,
            last_name,
            u.get("email") or "",
            _normalize_public_role(m["role"]),
            m.get("joined_at") or "",
        ])

    # Log export
    try:
        db.client.table("exports_log").insert({
            "tenant_id": tenant_id,
            "requested_by": jwt_payload.user_id,
            "role_filter": role,
            "invited_by_filter": invited_by,
            "format": "csv",
            "status": "completed"
        }).execute()
    except Exception as e:
        logger.error(f"Failed to log export: {e}")

    workspace_slug = _get_workspace_name(tenant_id).strip().lower().replace(" ", "_")
    filename = f"{workspace_slug or 'workspace'}_team_members.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/franchises")
async def list_franchises(
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("ADD_FRANCHISE")),
):
    """List child franchise workspaces for the current tenant."""
        
    tenant_res = (
        db.client.table("tenants")
        .select("id, company_name, status, franchise_status, created_at")
        .eq("parent_tenant_id", tenant_id)
        .order("created_at", desc=False)
        .execute()
    )
    franchises = tenant_res.data or []
    if not franchises:
        return []

    franchise_ids = [franchise["id"] for franchise in franchises]
    owner_links_res = (
        db.client.table("tenant_users")
        .select("tenant_id, user_id, role")
        .in_("tenant_id", franchise_ids)
        .eq("role", "owner")
        .execute()
    )
    owner_links = owner_links_res.data or []
    owner_ids = [link["user_id"] for link in owner_links]
    owners_by_user_id = {}
    if owner_ids:
        owners_res = (
            db.client.table("users")
            .select("id, email, full_name")
            .in_("id", owner_ids)
            .execute()
        )
        owners_by_user_id = {owner["id"]: owner for owner in (owners_res.data or [])}

    pending_invites_res = (
        db.client.table("team_invitations")
        .select("id, email, franchise_tenant_id, expires_at")
        .eq("tenant_id", tenant_id)
        .eq("invite_type", "franchise")
        .execute()
    )
    pending_invites_by_tenant = {
        invite["franchise_tenant_id"]: invite for invite in (pending_invites_res.data or [])
    }

    owner_by_tenant = {}
    for link in owner_links:
        owner = owners_by_user_id.get(link["user_id"], {})
        owner_by_tenant[link["tenant_id"]] = {
            "user_id": link["user_id"],
            "email": owner.get("email"),
            "full_name": owner.get("full_name"),
        }

    results = []
    for franchise in franchises:
        pending_invite = pending_invites_by_tenant.get(franchise["id"])
        owner = owner_by_tenant.get(franchise["id"])
        results.append(
            {
                "id": franchise["id"],
                "workspace_name": franchise.get("company_name") or "Unnamed Franchise",
                "status": franchise.get("franchise_status") or "active",
                "created_at": franchise.get("created_at"),
                "owner": owner,
                "pending_invite": pending_invite,
            }
        )

    return results


@router.post("/franchises")
@limiter.limit("5/hour")
async def create_franchise(
    body: CreateFranchiseRequest,
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("ADD_FRANCHISE")),
):
    """Create a child franchise workspace and invite its owner."""
        
    workspace_name = body.workspace_name.strip()
    if len(workspace_name) < 2:
        raise HTTPException(status_code=400, detail="Workspace name is too short.")

    existing_invite_res = (
        db.client.table("team_invitations")
        .select("id, expires_at")
        .eq("tenant_id", tenant_id)
        .eq("email", body.email)
        .eq("invite_type", "franchise")
        .execute()
    )
    for invite in existing_invite_res.data or []:
        if _iso_to_dt(invite["expires_at"]) >= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="An active franchise invitation already exists for this email.")

    franchise_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    (
        db.client.table("tenants")
        .insert(
            {
                "id": franchise_id,
                "company_name": workspace_name,
                "email": body.email,
                "status": "active",
                "workspace_type": "franchise",
                "franchise_status": "pending_invite",
                "parent_tenant_id": tenant_id,
                "created_at": now,
                "updated_at": now,
            }
        )
        .execute()
    )

    token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    (
        db.client.table("team_invitations")
        .insert(
            {
                "tenant_id": tenant_id,
                "email": body.email,
                "role": "owner",
                "token": token,
                "expires_at": expires_at,
                "inviter_id": jwt_payload.user_id,
                "invite_type": "franchise",
                "franchise_tenant_id": franchise_id,
            }
        )
        .execute()
    )

    parent_workspace_name = _get_workspace_name(tenant_id)
    inviter_name = _get_user_name(jwt_payload.user_id, jwt_payload.email)
    await send_team_invite(body.email, inviter_name, workspace_name, token)

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="franchise.created",
        resource_type="tenant",
        resource_id=franchise_id,
        metadata={"workspace_name": workspace_name, "parent_workspace_name": parent_workspace_name},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return {"message": f"Franchise workspace created for {workspace_name}.", "franchise_id": franchise_id}


@router.post("/franchises/{franchise_id}/suspend")
async def suspend_franchise(
    franchise_id: str,
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("ADD_FRANCHISE")),
):
    """Suspend a child franchise workspace."""
        
    res = (
        db.client.table("tenants")
        .update({"franchise_status": "suspended"})
        .eq("id", franchise_id)
        .eq("parent_tenant_id", tenant_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Franchise not found.")

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="franchise.suspended",
        resource_type="tenant",
        resource_id=franchise_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return {"message": "Franchise suspended."}


@router.post("/franchises/{franchise_id}/reactivate")
async def reactivate_franchise(
    franchise_id: str,
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("ADD_FRANCHISE")),
):
    """Reactivate a suspended franchise workspace."""
        
    res = (
        db.client.table("tenants")
        .update({"franchise_status": "active"})
        .eq("id", franchise_id)
        .eq("parent_tenant_id", tenant_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Franchise not found.")

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="franchise.reactivated",
        resource_type="tenant",
        resource_id=franchise_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return {"message": "Franchise reactivated."}


@router.delete("/franchises/{franchise_id}")
async def delete_franchise(
    franchise_id: str,
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("ADD_FRANCHISE")),
):
    """Delete a child franchise workspace and its pending invite, if any."""
        
    franchise_res = (
        db.client.table("tenants")
        .select("id")
        .eq("id", franchise_id)
        .eq("parent_tenant_id", tenant_id)
        .execute()
    )
    if not franchise_res.data:
        raise HTTPException(status_code=404, detail="Franchise not found.")

    (
        db.client.table("team_invitations")
        .delete()
        .eq("tenant_id", tenant_id)
        .eq("invite_type", "franchise")
        .eq("franchise_tenant_id", franchise_id)
        .execute()
    )
    (
        db.client.table("tenants")
        .delete()
        .eq("id", franchise_id)
        .eq("parent_tenant_id", tenant_id)
        .execute()
    )

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="franchise.deleted",
        resource_type="tenant",
        resource_id=franchise_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return {"message": "Franchise deleted."}


@router.get("/invites/validate")
async def validate_invite(token: str):
    """Peek at an invite token to get the target email (no auth required, doesn't consume the token)."""
    res = db.client.table("team_invitations").select("email, role, isolation_model, expires_at, tenant_id").eq("token", token).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation token.")
    
    invite = res.data[0]
    
    # Check expiration
    if datetime.fromisoformat(invite["expires_at"].replace('Z', '+00:00')) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation has expired.")
    
    target_tenant_id = invite.get("franchise_tenant_id") if invite.get("invite_type") == "franchise" else invite["tenant_id"]
    # Get workspace name
    t_res = db.client.table("tenants").select("company_name").eq("id", target_tenant_id).execute()
    workspace_name = t_res.data[0].get("company_name") or "the team" if t_res.data else "the team"
    
    return {
        "invited_email": invite["email"],
        "role": _normalize_public_role(invite["role"]),
        "workspace_name": workspace_name,
        "invite_type": invite.get("invite_type", "team"),
    }


@router.get("/invites")
async def get_pending_invites(
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_TEAM"))
):
    """List pending invitations for the workspace (filtered by role)."""
    if can(jwt_payload, "MANAGE_TEAM"):
        # Owners see all invites for the tenant
        res = db.client.table("team_invitations").select("*").eq("tenant_id", tenant_id).execute()
    else:
        # Standard members only see invites they personally sent
        res = db.client.table("team_invitations").select("*").eq("tenant_id", tenant_id).eq("inviter_id", jwt_payload.user_id).execute()

    invites = res.data or []
    inviter_ids = [invite["inviter_id"] for invite in invites if invite.get("inviter_id")]
    users_by_id = {}
    if inviter_ids:
        users_res = db.client.table("users").select("id, full_name").in_("id", inviter_ids).execute()
        users_by_id = {user["id"]: user for user in (users_res.data or [])}

    for invite in invites:
        inviter = users_by_id.get(invite.get("inviter_id") or "", {})
        invite["role"] = _normalize_public_role(invite["role"])
        invite["inviter_name"] = inviter.get("full_name")

    return invites


@router.post("/invites")
@limiter.limit("10/hour")
async def send_invite(
    request: Request,
    body: InviteRequest, 
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM"))
):
    """Invite a new member to the workspace."""
    
    if body.role not in {"manager", "member"}:
        raise HTTPException(status_code=400, detail="Invalid role.")

    if body.isolation_model not in VALID_ISOLATION_MODELS:
        raise HTTPException(status_code=400, detail="Invalid isolation model.")

    if jwt_payload.ui_role == "MANAGER" and body.role != "member":
        raise HTTPException(status_code=403, detail="Access denied.")

    # Check if they already exist in the workspace
    # First get user id by email
    user_res = db.client.table("users").select("id").eq("email", body.email).execute()
    if user_res.data:
        existing_uid = user_res.data[0]["id"]
        tu_res = db.client.table("tenant_users").select("id").eq("tenant_id", tenant_id).eq("user_id", existing_uid).execute()
        if tu_res.data:
            raise HTTPException(status_code=400, detail="User is already a member of this workspace.")

    existing_invites_res = (
        db.client.table("team_invitations")
        .select("id, expires_at")
        .eq("tenant_id", tenant_id)
        .eq("email", body.email)
        .execute()
    )
    for invite in existing_invites_res.data or []:
        if _iso_to_dt(invite["expires_at"]) >= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="An active invitation already exists for this email.")

    # Generate token
    token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    # Insert invite
    db.client.table("team_invitations").insert({
        "tenant_id": tenant_id,
        "email": body.email,
        "role": _normalize_storage_role(body.role),
        "isolation_model": body.isolation_model,
        "token": token,
        "expires_at": expires_at,
        "inviter_id": jwt_payload.user_id
    }).execute()

    # Get Workspace / Inviter info for email
    t_res = db.client.table("tenants").select("company_name").eq("id", tenant_id).execute()
    workspace_name = t_res.data[0].get("company_name") or "Your Team"
    
    inviter_res = db.client.table("users").select("full_name").eq("id", jwt_payload.user_id).execute()
    inviter_name = inviter_res.data[0].get("full_name") or jwt_payload.email

    # Fire background email
    await send_team_invite(body.email, inviter_name, workspace_name, token)

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="team.invite_sent",
        resource_type="team_invitation",
        metadata={"role": body.role, "isolation_model": body.isolation_model},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return {"message": f"Invitation sent to {body.email}"}


@router.post("/invites/{invite_id}/resend")
async def resend_invite(
    invite_id: str,
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM")),
):
    """Resend a pending invitation with a fresh token and expiry."""
    invite_res = (
        db.client.table("team_invitations")
        .select("*")
        .eq("id", invite_id)
        .eq("tenant_id", tenant_id)
        .execute()
    )
    if not invite_res.data:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    invite = invite_res.data[0]
    if _normalize_public_role(jwt_payload.role) not in ["owner", "manager"] and invite.get("inviter_id") != jwt_payload.user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to resend this invitation.")

    if _normalize_public_role(jwt_payload.role) == "manager" and _normalize_public_role(invite["role"]) != "member":
        raise HTTPException(status_code=403, detail="Managers can only resend member invitations.")

    new_token = secrets.token_urlsafe(32)
    new_expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    (
        db.client.table("team_invitations")
        .update({"token": new_token, "expires_at": new_expires_at})
        .eq("id", invite_id)
        .eq("tenant_id", tenant_id)
        .execute()
    )

    workspace_name = _get_workspace_name(tenant_id)
    inviter_name = _get_user_name(jwt_payload.user_id, jwt_payload.email)
    await send_team_invite(invite["email"], inviter_name, workspace_name, new_token)

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="team.invite_resent",
        resource_type="team_invitation",
        resource_id=invite_id,
        metadata={"role": _normalize_public_role(invite["role"])},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return {"message": f"Invitation resent to {invite['email']}"}


@router.delete("/invites/{invite_id}")
async def cancel_invite(
    invite_id: str,
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM"))
):
    """Cancel a pending invitation."""
    # Fetch the invite to check permissions
    res = db.client.table("team_invitations").select("id, inviter_id").eq("id", invite_id).eq("tenant_id", tenant_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Invitation not found.")
        
    invite = res.data[0]
    
    # Must be admin/owner, OR be the person who sent the invite
    if _normalize_public_role(jwt_payload.role) not in ["owner", "manager"] and jwt_payload.user_id != invite.get("inviter_id"):
        raise HTTPException(status_code=403, detail="You do not have permission to cancel this invitation.")
        
    db.client.table("team_invitations").delete().eq("id", invite_id).eq("tenant_id", tenant_id).execute()


    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="team.invite_canceled",
        resource_type="team_invitation",
        resource_id=invite_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return {"message": "Invitation canceled successfully."}


@router.post("/invites/accept")
async def accept_invite(
    body: AcceptInviteRequest,
    request: Request,
    jwt_payload: JWTPayload = Depends(require_authenticated_user)
):
    """Accept an invitation to join a workspace."""
    # Verify token
    res = db.client.table("team_invitations").select("*").eq("token", body.token).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation token.")
    
    invite = res.data[0]
    
    # Check expiration
    if datetime.fromisoformat(invite["expires_at"].replace('Z', '+00:00')) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation has expired.")

    if jwt_payload.email.lower() != invite["email"].lower():
        raise HTTPException(status_code=403, detail="This invitation was sent to a different email address.")

    # Add to tenant_users
    target_tenant_id = invite.get("franchise_tenant_id") if invite.get("invite_type") == "franchise" else invite["tenant_id"]
    try:
        db.client.table("tenant_users").insert({
            "tenant_id": target_tenant_id,
            "user_id": jwt_payload.user_id,
            "role": invite["role"],
            "isolation_model": invite.get("isolation_model", "team"),
            "joined_at": datetime.now(timezone.utc).isoformat(),
            "invited_by": invite.get("inviter_id")
        }).execute()
    except Exception as e:
        if "duplicate key value" in str(e).lower():
            pass # Already a member
        else:
            raise HTTPException(status_code=500, detail="Failed to add user to workspace.")

    # Delete the invite
    db.client.table("team_invitations").delete().eq("id", invite["id"]).execute()

    if invite.get("invite_type") == "franchise" and invite.get("franchise_tenant_id"):
        (
            db.client.table("tenants")
            .update({"franchise_status": "active"})
            .eq("id", invite["franchise_tenant_id"])
            .execute()
        )

    await write_log(
        tenant_id=target_tenant_id,
        user_id=jwt_payload.user_id,
        action="team.invite_accepted",
        resource_type="team_invitation",
        resource_id=invite["id"],
        metadata={
            "role": _normalize_public_role(invite["role"]),
            "isolation_model": invite.get("isolation_model", "team"),
            "invite_type": invite.get("invite_type", "team"),
        },
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    # Issue a FRESH JWT scoped to the TARGET workspace (franchise or team)
    # IMPORTANT: must use target_tenant_id, NOT invite["tenant_id"]
    # invite["tenant_id"] = parent workspace that sent the invite
    # target_tenant_id   = the actual workspace the user is joining
    from routes.auth import create_access_token
    new_token = create_access_token({
        "user_id": jwt_payload.user_id,
        "tenant_id": target_tenant_id,
        "email": jwt_payload.email,
        "role": invite["role"],
        "isolation_model": invite.get("isolation_model", "team")
    })

    return {
        "message": "Successfully joined workspace.",
        "tenant_id": target_tenant_id,
        "new_token": new_token,
        "role": _normalize_public_role(invite["role"]),
        "isolation_model": invite.get("isolation_model", "team")
    }


@router.delete("/members/{user_id}")
async def remove_member(
    user_id: str,
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM"))
):
    """Remove a user from the workspace."""
        
    # Prevent self-removal here (could build a separate 'leave' route)
    if user_id == jwt_payload.user_id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself.")

    target = _get_membership(tenant_id, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found.")

    if _normalize_public_role(jwt_payload.role) == "manager" and _normalize_public_role(target["role"]) != "member":
        raise HTTPException(status_code=403, detail="Managers can only remove members.")

    if target["role"] == "owner" and _count_owners(tenant_id) <= 1:
        raise HTTPException(status_code=400, detail="You cannot remove the last owner of this workspace.")

    db.client.table("tenant_users").delete().eq("tenant_id", tenant_id).eq("user_id", user_id).execute()

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="team.member_removed",
        resource_type="tenant_user",
        resource_id=user_id,
        metadata={"removed_role": _normalize_public_role(target["role"])},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    return {"message": "Member removed."}


@router.delete("/members/me/leave")
async def leave_workspace(
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(verify_jwt_token)
):
    """Allow a user to voluntarily leave the workspace."""
    user_id = jwt_payload.user_id
    
    # Check if they are the last owner
    if jwt_payload.role == "owner":
        owners_res = db.client.table("tenant_users").select("id").eq("tenant_id", tenant_id).eq("role", "owner").execute()
        if owners_res.data and len(owners_res.data) <= 1:
            raise HTTPException(status_code=400, detail="Cannot leave: You are the last owner.")
            
    # Delete their membership
    db.client.table("tenant_users").delete().eq("tenant_id", tenant_id).eq("user_id", user_id).execute()

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="team.member_left",
        resource_type="tenant_user",
        resource_id=user_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    
    return {"message": "You have left the workspace."}


@router.patch("/members/{user_id}/role")
async def update_member_role(
    user_id: str,
    request: Request,
    body: UpdateRoleRequest,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM"))
):
    """Change a user's role and access mode in the workspace."""
    # Only owners can change roles 
    if jwt_payload.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can change roles.")

    if body.role and body.role not in {"manager", "member"}:
        raise HTTPException(status_code=400, detail="Invalid role. Use ownership transfer to assign a new owner.")
        
    if body.isolation_model and body.isolation_model not in VALID_ISOLATION_MODELS:
        raise HTTPException(status_code=400, detail="Invalid isolation model.")
        
    if user_id == jwt_payload.user_id and body.role:
        raise HTTPException(status_code=400, detail="You cannot modify your own role.")

    target = _get_membership(tenant_id, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found.")

    if target["role"] == "owner" and body.role and _count_owners(tenant_id) <= 1:
        raise HTTPException(status_code=400, detail="Use ownership transfer before demoting the last owner.")

    updates = {}
    if body.role:
        updates["role"] = _normalize_storage_role(body.role)
    if body.isolation_model:
        updates["isolation_model"] = body.isolation_model
        
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update.")

    res = db.client.table("tenant_users").update(updates).eq("tenant_id", tenant_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Member not found.")

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="team.member_updated",
        resource_type="tenant_user",
        resource_id=user_id,
        metadata={
            key: _normalize_public_role(value) if key == "role" else value
            for key, value in updates.items()
        },
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
        
    return {"message": "Member details updated."}


@router.post("/members/{user_id}/transfer-ownership")
async def transfer_ownership(
    user_id: str,
    body: TransferOwnershipRequest,
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM")),
):
    """Transfer ownership from the current owner to another workspace member."""
    if jwt_payload.ui_role not in ["MAIN_OWNER", "FRANCHISE_OWNER"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    if user_id == jwt_payload.user_id:
        raise HTTPException(status_code=400, detail="You already own this workspace.")

    if body.new_owner_role_for_current_user not in {"manager", "member"}:
        raise HTTPException(status_code=400, detail="Current owner can only be downgraded to manager or member.")

    target = _get_membership(tenant_id, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target member not found.")

    (
        db.client.table("tenant_users")
        .update({"role": "owner"})
        .eq("tenant_id", tenant_id)
        .eq("user_id", user_id)
        .execute()
    )
    (
        db.client.table("tenant_users")
        .update({"role": _normalize_storage_role(body.new_owner_role_for_current_user)})
        .eq("tenant_id", tenant_id)
        .eq("user_id", jwt_payload.user_id)
        .execute()
    )

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="team.ownership_transferred",
        resource_type="tenant",
        resource_id=tenant_id,
        metadata={
            "new_owner_user_id": user_id,
            "previous_owner_new_role": body.new_owner_role_for_current_user,
        },
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return {"message": "Ownership transferred successfully."}


# === Enterprise JIT Auto-Discovery Routes ===

@router.get("/requests")
async def get_join_requests(
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM"))
):
    """List pending Enterprise JIT access requests."""
        
    res = db.client.table("join_requests").select("*").eq("tenant_id", tenant_id).eq("status", "pending").execute()
    requests = res.data or []
    if not requests:
        return []

    user_ids = [r["user_id"] for r in requests]
    users_res = db.client.table("users").select("id, email, full_name, avatar_url").in_("id", user_ids).execute()
    users_by_id = {u["id"]: u for u in (users_res.data or [])}

    result = []
    for r in requests:
        u = users_by_id.get(r["user_id"], {})
        result.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "status": r["status"],
            "risk_score": r["risk_score"],
            "created_at": r["created_at"],
            "email": u.get("email"),
            "full_name": u.get("full_name"),
            "avatar_url": u.get("avatar_url"),
        })
    return result


@router.post("/requests/{request_id}/approve")
async def approve_join_request(
    request_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM"))
):


    """Approve a join request and promote the user to workspace member."""
        
    # Verify request
    req_res = db.client.table("join_requests").select("*").eq("id", request_id).eq("tenant_id", tenant_id).execute()
    if not req_res.data:
        raise HTTPException(status_code=404, detail="Request not found or unauthorized.")
        
    join_req = req_res.data[0]
    if join_req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request is already processed.")
        
    # Mark as approved
    db.client.table("join_requests").update({
        "status": "approved", 
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", request_id).eq("tenant_id", tenant_id).execute()

    
    # Insert into tenant_users
    try:
        db.client.table("tenant_users").insert({
            "tenant_id": tenant_id,
            "user_id": join_req["user_id"],
            "role": "member",
            "joined_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception:
        pass # Handle cases where they might already exist
        
    return {"message": "Request approved and user added to workspace."}


@router.post("/requests/{request_id}/deny")
async def deny_join_request(
    request_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM"))
):

    """Deny a join request."""
        
    req_res = db.client.table("join_requests").select("id").eq("id", request_id).eq("tenant_id", tenant_id).execute()
    if not req_res.data:
        raise HTTPException(status_code=404, detail="Request not found.")
        
    db.client.table("join_requests").update({
        "status": "denied", 
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", request_id).eq("tenant_id", tenant_id).execute()

    
    return {"message": "Request denied."}


@router.post("/requests/{request_id}/blacklist")
async def blacklist_join_request(
    request_id: str,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM"))
):

    """Permanently block a user from joining."""
        
    req_res = db.client.table("join_requests").select("id").eq("id", request_id).eq("tenant_id", tenant_id).execute()
    if not req_res.data:
        raise HTTPException(status_code=404, detail="Request not found.")
        
    db.client.table("join_requests").update({
        "status": "blocked", 
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", request_id).eq("tenant_id", tenant_id).execute()

    
    return {"message": "User blacklisted from workspace."}


# === Manager Request System ===
# Managers can raise requests for billing changes or franchise creation.
# Owners review, approve, or reject each request.

class CreateWorkspaceRequestBody(BaseModel):
    request_type: str        # 'billing_change' | 'franchise_request'
    notes: Optional[str] = None
    payload: Optional[dict] = None  # Extra context e.g. requested plan, franchise name


@router.post("/workspace-requests")
async def create_workspace_request(
    body: CreateWorkspaceRequestBody,
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_SETTINGS")),
):
    """Manager submits a request for owner review (billing change, franchise creation, etc.)"""
    if jwt_payload.ui_role not in ["MANAGER", "MAIN_OWNER", "FRANCHISE_OWNER"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    valid_types = {"billing_change", "franchise_request"}
    if body.request_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid request type. Must be one of: {valid_types}")

    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    db.client.table("workspace_requests").insert({
        "id": new_id,
        "tenant_id": tenant_id,
        "requested_by": jwt_payload.user_id,
        "request_type": body.request_type,
        "notes": body.notes,
        "payload": body.payload or {},
        "status": "pending",
        "created_at": now,
        "updated_at": now,
    }).execute()

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="workspace_request.created",
        resource_type="workspace_request",
        resource_id=new_id,
        metadata={"request_type": body.request_type},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return {"message": "Request submitted. The workspace owner will review it.", "id": new_id}


@router.get("/workspace-requests")
async def list_workspace_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_SETTINGS")),
):
    """List workspace requests. Owners see all; managers see their own only."""
    role = _normalize_public_role(jwt_payload.role)

    query = (
        db.client.table("workspace_requests")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("created_at", desc=True)
    )

    if role not in ["owner"]:
        # Managers and members only see their own requests
        query = query.eq("requested_by", jwt_payload.user_id)

    if status_filter:
        query = query.eq("status", status_filter)

    res = query.execute()
    requests_list = res.data or []

    # Enrich with requester name
    user_ids = list({r["requested_by"] for r in requests_list if r.get("requested_by")})
    users_by_id = {}
    if user_ids:
        users_res = db.client.table("users").select("id, email, full_name").in_("id", user_ids).execute()
        users_by_id = {u["id"]: u for u in (users_res.data or [])}

    for r in requests_list:
        requester = users_by_id.get(r.get("requested_by") or "", {})
        r["requester_email"] = requester.get("email")
        r["requester_name"] = requester.get("full_name")

    return requests_list


@router.post("/workspace-requests/{request_id}/approve")
async def approve_workspace_request(
    request_id: str,
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM")),
):
    """Owner approves a pending workspace request."""
    if jwt_payload.ui_role not in ["MAIN_OWNER", "FRANCHISE_OWNER"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    res = db.client.table("workspace_requests").select("*").eq("id", request_id).eq("tenant_id", tenant_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Request not found.")

    req = res.data[0]
    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request is already resolved.")

    now = datetime.now(timezone.utc).isoformat()
    db.client.table("workspace_requests").update({
        "status": "approved",
        "resolved_by": jwt_payload.user_id,
        "resolved_at": now,
        "updated_at": now,
    }).eq("id", request_id).execute()

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="workspace_request.approved",
        resource_type="workspace_request",
        resource_id=request_id,
        metadata={"request_type": req["request_type"]},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return {"message": "Request approved."}


@router.post("/workspace-requests/{request_id}/reject")
async def reject_workspace_request(
    request_id: str,
    request: Request,
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("MANAGE_TEAM")),
):
    """Owner rejects a pending workspace request."""
    if jwt_payload.ui_role not in ["MAIN_OWNER", "FRANCHISE_OWNER"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    res = db.client.table("workspace_requests").select("*").eq("id", request_id).eq("tenant_id", tenant_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Request not found.")

    req = res.data[0]
    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request is already resolved.")

    now = datetime.now(timezone.utc).isoformat()
    db.client.table("workspace_requests").update({
        "status": "rejected",
        "resolved_by": jwt_payload.user_id,
        "resolved_at": now,
        "updated_at": now,
    }).eq("id", request_id).execute()

    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="workspace_request.rejected",
        resource_type="workspace_request",
        resource_id=request_id,
        metadata={"request_type": req["request_type"]},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return {"message": "Request rejected."}
