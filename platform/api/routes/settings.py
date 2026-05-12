"""
Settings Routes — Phase 8A
Handles profile, organization, and API key management.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, cast
import uuid
import hashlib
import secrets
from datetime import datetime, timezone

router = APIRouter(prefix="/settings", tags=["Settings"])

from utils.supabase_client import db
from utils.jwt_middleware import require_admin_or_owner, verify_jwt_token, JWTPayload, require_authenticated_user
from utils.permissions import require_permission
from services.audit_service import write_log



# ── Pydantic Models ────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    timezone: Optional[str] = None

class IsolationModelUpdate(BaseModel):
    data_isolation_model: str


class OrganizationUpdate(BaseModel):
    company_name: Optional[str] = None
    business_address: Optional[str] = None
    business_city: Optional[str] = None
    business_state: Optional[str] = None
    business_zip: Optional[str] = None
    business_country: Optional[str] = None


class ApiKeyCreate(BaseModel):
    name: str


def _public_role(role: Optional[str]) -> str:
    # Backward-compat: 'manager' was the old name for 'admin'
    if role == "manager":
        return "admin"
    return role or "creator"


# ── Profile ────────────────────────────────────────────────────────────

@router.get("/profile")
async def get_profile(claims: JWTPayload = Depends(require_permission("settings:view"))):

    """Return current user's profile info"""
    result = db.client.table("users").select(
        "id, email, full_name, timezone, created_at"
    ).eq("id", claims.user_id).execute()

    res_data = cast(List[Dict[str, Any]], result.data or [])
    if not res_data:
        raise HTTPException(status_code=404, detail="User not found")

    return res_data[0]


@router.patch("/profile")
async def update_profile(body: ProfileUpdate, claims: JWTPayload = Depends(require_permission("settings:update"))):

    """Update current user's name or timezone"""
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")

    result = db.client.table("users").update(updates).eq("id", claims.user_id).execute()
    res_data = cast(List[Dict[str, Any]], result.data or [])
    return {"message": "Profile updated", "data": res_data[0] if res_data else {}}


# ── Organization ───────────────────────────────────────────────────────

@router.get("/organization")
async def get_organization(claims: JWTPayload = Depends(require_permission("settings:view"))):

    """Return current tenant's organization info"""
    result = db.client.table("tenants").select(
        "id, email, company_name, business_address, business_city, "
        "business_state, business_zip, business_country, created_at"
    ).eq("id", claims.tenant_id).execute()

    res_data = cast(List[Dict[str, Any]], result.data or [])
    if not res_data:
        raise HTTPException(status_code=404, detail="Organization not found")

    return res_data[0]


@router.patch("/organization")
async def update_organization(body: OrganizationUpdate, claims: JWTPayload = Depends(require_permission("settings:manage"))):

    """Update current tenant's organization details"""
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")

    result = db.client.table("tenants").update(updates).eq("id", claims.tenant_id).execute()
    res_data = cast(List[Dict[str, Any]], result.data or [])
    
    await write_log(
        tenant_id=claims.tenant_id,
        user_id=claims.user_id,
        action="workspace_updated",
        resource_type="tenant",
        resource_id=claims.tenant_id,
        metadata=updates
    )
    
    res_data = cast(List[Dict[str, Any]], result.data or [])
    
    return {"message": "Organization updated", "data": res_data[0] if res_data else {}}


@router.patch("/organization/isolation-model")
async def update_isolation_model(
    body: IsolationModelUpdate, 
    from_utils_jwt = Depends(require_permission("settings:update"))
):

    """
    Update the workspace data isolation model.
    Only owners can do this.
    Returns a fresh JWT token so the owner's session isn't invalidated by the middleware.
    """
    # Removed manual role check — enforced by CHANGE_ISOLATION_MODEL permission

        
    if body.data_isolation_model not in ["team", "agency"]:
        raise HTTPException(status_code=400, detail="Invalid isolation model. Must be 'team' or 'agency'.")

    db.client.table("tenants").update({
        "data_isolation_model": body.data_isolation_model
    }).eq("id", from_utils_jwt.tenant_id).execute()
    
    await write_log(
        tenant_id=from_utils_jwt.tenant_id,
        user_id=from_utils_jwt.user_id,
        action="workspace_updated",
        resource_type="tenant",
        resource_id=from_utils_jwt.tenant_id,
        metadata={"data_isolation_model": body.data_isolation_model}
    )
    
    # Generate fresh JWT
    from routes.auth import create_access_token
    token_data = {
        "user_id": from_utils_jwt.user_id,
        "tenant_id": from_utils_jwt.tenant_id,
        "email": from_utils_jwt.email,
        "role": from_utils_jwt.role,
        "isolation_model": body.data_isolation_model
    }
    
    access_token = create_access_token(token_data)
    
    return {
        "message": f"Workspace updated to {body.data_isolation_model} model.",
        "token": access_token
    }


# ── Preferences ───────────────────────────────────────────────────────

class PreferencesUpdate(BaseModel):
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    default_from_name: Optional[str] = None


@router.get("/preferences")
async def get_preferences(claims: JWTPayload = Depends(require_permission("settings:view"))):
    """Return current user's and tenant's preferences"""
    user_res = db.client.table("users").select("timezone").eq("id", claims.user_id).single().execute()
    tenant_res = db.client.table("tenants").select("date_format, default_from_name").eq("id", claims.tenant_id).single().execute()

    return {
        "timezone": user_res.data.get("timezone") if user_res.data else "UTC",
        "date_format": tenant_res.data.get("date_format") if tenant_res.data else "MMM DD, YYYY",
        "default_from_name": tenant_res.data.get("default_from_name") if tenant_res.data else "",
    }


@router.patch("/preferences")
async def update_preferences(body: PreferencesUpdate, claims: JWTPayload = Depends(require_permission("settings:update"))):
    """Update user timezone and tenant-level preferences"""
    if body.timezone:
        db.client.table("users").update({"timezone": body.timezone}).eq("id", claims.user_id).execute()

    tenant_updates = {}
    if body.date_format is not None:
        tenant_updates["date_format"] = body.date_format
    if body.default_from_name is not None:
        tenant_updates["default_from_name"] = body.default_from_name

    if tenant_updates:
        db.client.table("tenants").update(tenant_updates).eq("id", claims.tenant_id).execute()

    return {"message": "Preferences updated"}


# ── API Keys ───────────────────────────────────────────────────────────

@router.get("/api-keys")
async def list_api_keys(claims: JWTPayload = Depends(require_permission("settings:update"))):

    """List all active API keys for the tenant (never return the raw secret)"""
    result = db.client.table("api_keys").select(
        "id, name, key_prefix, created_at, last_used_at"
    ).eq("tenant_id", claims.tenant_id).is_("revoked_at", "null").order("created_at", desc=True).execute()

    return {"api_keys": result.data or []}


@router.post("/api-keys")
async def create_api_key(body: ApiKeyCreate, claims: JWTPayload = Depends(require_permission("settings:update"))):

    """Generate a new API key. The raw key is shown ONCE — never stored in plain text."""
    raw_key = f"ee_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:12]

    result = db.client.table("api_keys").insert({
        "id": str(uuid.uuid4()),
        "tenant_id": claims.tenant_id,
        "name": body.name,
        "key_hash": key_hash,
        "key_prefix": key_prefix,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {
        "message": "API key created. Copy it now — it will not be shown again.",
        "key": raw_key,
        "key_prefix": key_prefix,
        "name": body.name,
    }


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str, claims: JWTPayload = Depends(require_permission("settings:update"))):

    """Revoke (soft-delete) an API key by setting revoked_at"""
    result = db.client.table("api_keys").update({
        "revoked_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", key_id).eq("tenant_id", claims.tenant_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="API key not found")

    return {"message": "API key revoked"}


# ── Audit History ───────────────────────────────────────────────────────

@router.get("/audit")
async def get_audit_history(
    limit: int = Query(50, ge=1, le=200),
    action_prefix: Optional[str] = Query(None),
    claims: JWTPayload = Depends(require_permission("settings:update")),
):

    """Return recent audit history for workspace governance actions."""
    query = (
        db.client.table("audit_logs")
        .select("id, action, user_id, resource_type, resource_id, metadata, created_at")
        .eq("tenant_id", claims.tenant_id)
        .order("created_at", desc=True)
        .limit(limit)
    )

    if action_prefix:
        query = query.ilike("action", f"{action_prefix}%")

    result = query.execute()
    entries = cast(List[Dict[str, Any]], result.data or [])

    user_ids = [entry["user_id"] for entry in entries if entry.get("user_id")]
    users_by_id = {}
    if user_ids:
        users_res = (
            db.client.table("users")
            .select("id, email, full_name")
            .in_("id", user_ids)
            .execute()
        )
        users_by_id = {user["id"]: user for user in (users_res.data or [])}

    for entry in entries:
        actor = users_by_id.get(entry.get("user_id") or "", {})
        entry["actor"] = {
            "user_id": entry.get("user_id"),
            "email": actor.get("email"),
            "full_name": actor.get("full_name"),
            "role": _public_role(claims.role) if entry.get("user_id") == claims.user_id else None,
        }

    return {"data": entries}


@router.get("/exports/history")
async def get_export_history(
    limit: int = Query(50, ge=1, le=200),
    claims: JWTPayload = Depends(require_permission("settings:update")),
):

    """Return recent export history across team exports and contact export jobs."""
    team_export_res = (
        db.client.table("audit_logs")
        .select("id, action, user_id, metadata, created_at")
        .eq("tenant_id", claims.tenant_id)
        .eq("action", "team.export")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    team_exports = cast(List[Dict[str, Any]], team_export_res.data or [])

    contact_jobs_res = (
        db.client.table("jobs")
        .select("id, type, status, progress, error_log, created_at, updated_at")
        .eq("tenant_id", claims.tenant_id)
        .eq("type", "csv_export")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    contact_jobs = cast(List[Dict[str, Any]], contact_jobs_res.data or [])

    user_ids = [entry["user_id"] for entry in team_exports if entry.get("user_id")]
    users_by_id = {}
    if user_ids:
        users_res = (
            db.client.table("users")
            .select("id, email, full_name")
            .in_("id", user_ids)
            .execute()
        )
        users_by_id = {user["id"]: user for user in (users_res.data or [])}

    team_history = []
    for entry in team_exports:
        actor = users_by_id.get(entry.get("user_id") or "", {})
        team_history.append(
            {
                "id": entry["id"],
                "kind": "team_members",
                "status": "completed",
                "created_at": entry["created_at"],
                "updated_at": entry["created_at"],
                "actor": {
                    "user_id": entry.get("user_id"),
                    "email": actor.get("email"),
                    "full_name": actor.get("full_name"),
                },
                "meta": entry.get("metadata") or {},
            }
        )

    contact_history = []
    for job in contact_jobs:
        result_url = None
        if job.get("error_log"):
            try:
                import json

                parsed = json.loads(job["error_log"])
                if isinstance(parsed, dict):
                    result_url = parsed.get("result_url")
            except Exception:
                result_url = None

        contact_history.append(
            {
                "id": job["id"],
                "kind": "contacts",
                "status": job.get("status"),
                "progress": job.get("progress", 0),
                "created_at": job.get("created_at"),
                "updated_at": job.get("updated_at"),
                "download_url": result_url,
                "meta": {},
            }
        )

    combined = sorted(
        [*team_history, *contact_history],
        key=lambda item: item.get("created_at") or "",
        reverse=True,
    )[:limit]

    return {"data": combined}


# ── GDPR Compliance ────────────────────────────────────────────────────

@router.post("/gdpr/erase-contact/{contact_id}")
async def gdpr_erase_contact(contact_id: str, claims: JWTPayload = Depends(require_permission("settings:update"))):

    """
    GDPR Right to Erasure — anonymize a contact.
    Does NOT delete the row (preserves analytics history).
    Overwrites PII with anonymized placeholders.
    """
    # Verify contact belongs to this tenant
    check = db.client.table("contacts").select("id").eq("id", contact_id).eq("tenant_id", claims.tenant_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.client.table("contacts").update({
        "email": f"deleted_{contact_id[:8]}@gdpr.invalid",
        "first_name": "[Deleted]",
        "last_name": "[Deleted]",
        "phone": None,
        "custom_fields": {},
        "status": "unsubscribed",
    }).eq("id", contact_id).execute()

    return {"message": f"Contact {contact_id} anonymized per GDPR Right to Erasure"}
    

# ── Workspace Lifecycle ────────────────────────────────────────────────

@router.delete("/workspace/{tenant_id}")
async def leave_or_delete_workspace(
    tenant_id: str,
    jwt_payload: JWTPayload = Depends(require_authenticated_user)
):
    """
    Remove current user from a workspace (Leave) OR delete the workspace entirely (Delete).
    
    RBAC Rules:
    - OWNER: Can only delete if they are the LAST member (solo workspace). 
             Otherwise, they MUST transfer ownership first.
    - ADMIN/CREATOR/VIEWER: Just removes their own membership link (Leave).
    """
    from services.audit_service import write_log
    
    # 1. Verify membership and role for the target tenant
    membership_res = db.client.table("tenant_users").select("role")\
        .eq("user_id", jwt_payload.user_id)\
        .eq("tenant_id", tenant_id)\
        .execute()
        
    res_data = cast(List[Dict[str, Any]], membership_res.data or [])
    if not res_data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You are not a member of this workspace."
        )
        
    user_role = cast(str, res_data[0].get("role", "creator")).lower()
    
    # 2. Logic for Non-Owners (Leave Workspace)
    if user_role != "owner":
        try:
            db.client.table("tenant_users").delete()\
                .eq("user_id", jwt_payload.user_id)\
                .eq("tenant_id", tenant_id)\
                .execute()
                
            await write_log(
                tenant_id=tenant_id,
                action="workspace:leave",
                user_id=jwt_payload.user_id,
                metadata={"role": user_role}
            )
            
            return {"message": "Successfully left the workspace."}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to leave workspace: {str(e)}")
            
    # 3. Logic for Owners (Delete Workspace or Blocked Leave)
    else:
        # Check if there are other members
        members_res = db.client.table("tenant_users").select("user_id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .execute()
            
        member_count = members_res.count if hasattr(members_res, "count") else len(members_res.data)
        
        if member_count > 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="As an Owner, you cannot leave a workspace with other members. Please transfer ownership or remove all other members first."
            )
            
        # Solo Owner -> Full Wipe (Cascade Delete)
        try:
            # We delete the tenant record. Assuming foreign keys are set to CASCADE in DB.
            db.client.table("tenants").delete().eq("id", tenant_id).execute()
            
            await write_log(
                tenant_id=tenant_id,
                action="workspace:delete",
                user_id=jwt_payload.user_id,
                metadata={"reason": "Solo owner deletion"}
            )
            
            return {"message": "Workspace successfully deleted."}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete workspace: {str(e)}")
