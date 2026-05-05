from fastapi import Depends, HTTPException, status
from utils.jwt_middleware import require_active_tenant, JWTPayload, verify_jwt_token

# -----------------------------------
# ROLE PERMISSION MATRIX
# -----------------------------------
# Precise mapping based on production SaaS requirements
ROLE_PERMISSIONS = {
    "OWNER": [
        # Absolute Power
        "workspace:rename", "workspace:delete", "workspace:transfer",
        "team:manage_roles", "billing:manage", "domains:delete", "api_keys:manage",
        # Inherit all below
        "team:invite", "campaign:send", "campaign:manage", "contacts:export",
        "domains:add", "domains:verify", "settings:update", "franchise:manage",
        "campaign:create", "campaign:edit", "contacts:import", "contacts:view",
        "analytics:view", "campaign:view", "team:view", "domains:view", 
        "sender:manage", "template:view", "template:manage", "billing:view",
        "settings:manage", "workspace:view", "settings:view", "asset:create"
    ],
    "ADMIN": [
        "team:invite", "campaign:send", "campaign:manage", "contacts:export",
        "settings:update", "franchise:manage",
        "campaign:create", "campaign:edit", "contacts:import", "contacts:view",
        "analytics:view", "campaign:view", "team:view", "domains:view",
        "sender:manage", "template:view", "template:manage", "billing:view",
        "settings:manage", "workspace:view", "settings:view", "asset:create"
    ],
    "CREATOR": [
        "campaign:create", "campaign:edit", "contacts:import", "contacts:view",
        "analytics:view", "campaign:view", "team:view", "domains:view",
        "template:view", "template:manage",
        "workspace:view", "settings:view", "billing:view", "settings:update", "asset:create"
    ],
    "VIEWER": [
        "analytics:view", "campaign:view", "team:view", "domains:view", "template:view", "billing:view",
        "workspace:view", "settings:view"
    ]
}

def can(payload: JWTPayload, action: str) -> bool:
    """
    Core backend RBAC validator.
    Checks if the user role in the payload has the required action.
    """
    role = getattr(payload, "role", "VIEWER").upper()
    workspace_type = payload.workspace_type
    
    # 1. Workspace Isolation Overrides
    if workspace_type == "FRANCHISE":
        # Production Hardening: Franchises cannot manage infrastructure, billing, or nested franchises.
        # These are exclusively Main Workspace (Parent) administrative concerns.
        if action in [
            "domains:delete", "domains:add", "domains:verify", 
            "workspace:delete", "workspace:transfer", "workspace:rename",
            "billing:manage", "franchise:manage"
        ]:
            return False

    # 2. Permission Check
    permissions = ROLE_PERMISSIONS.get(role, [])
    if action in permissions:
        return True
        
    return False

def require_permission(action: str):
    """
    Dependency generator for FastAPI endpoints.
    Usage: Depends(require_permission('campaign:send'))
    """
    def permission_checker(jwt_payload: JWTPayload = Depends(verify_jwt_token)):
        if not can(jwt_payload, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {action}"
            )
        return jwt_payload
    return permission_checker
