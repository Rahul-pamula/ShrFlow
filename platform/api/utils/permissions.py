from fastapi import Depends, HTTPException, status
from utils.jwt_middleware import require_active_tenant, JWTPayload, verify_jwt_token

# Define standard RBAC actions
ACTIONS = [
    "ADD_DOMAIN", "VIEW_DOMAIN",
    "ADD_FRANCHISE", "VIEW_FRANCHISE",
    "VIEW_BILLING", "MANAGE_BILLING",
    "ADD_MANAGER", "ADD_MEMBER",
    "ADD_SENDER", "VIEW_SENDER",
    "VIEW_SETTINGS", "MANAGE_SETTINGS",
    "CREATE_CAMPAIGN", "VIEW_CAMPAIGN",
    "MANAGE_TEAM", "VIEW_TEAM",
    "MANAGE_CONTACT", "VIEW_CONTACT",
    "VIEW_ANALYTICS",
    "VIEW_ASSETS", "ADD_ASSETS",
    "VIEW_TEMPLATE", "MANAGE_TEMPLATE",
    "CHANGE_ISOLATION_MODEL"
]



def can(payload: JWTPayload, action: str) -> bool:
    """
    Core backend RBAC validator mirroring the frontend logic.
    """
    ui_role = payload.ui_role
    workspace_type = payload.workspace_type
    
    # --------------------------------------------------
    # 1. STRICT WORKSPACE OVERRIDES
    # --------------------------------------------------
    # Franchises CANNOT access parent infrastructure,
    # regardless of whether they are an 'owner' or 'manager'.
    if workspace_type == "FRANCHISE":
        if action in ["ADD_DOMAIN", "ADD_FRANCHISE", "VIEW_BILLING"]:
            return False

    # --------------------------------------------------
    # 2. ROLE-BASED ACCESS
    # --------------------------------------------------
    if ui_role == "MAIN_OWNER":
        return True
        
    if ui_role == "FRANCHISE_OWNER":
        return action in [
            "VIEW_FRANCHISE", "ADD_MANAGER", "ADD_MEMBER", "ADD_SENDER",
            "VIEW_SENDER", "VIEW_SETTINGS", "MANAGE_SETTINGS", "CREATE_CAMPAIGN", "VIEW_CAMPAIGN",
            "MANAGE_TEAM", "VIEW_TEAM", "MANAGE_CONTACT", "VIEW_CONTACT", "VIEW_ANALYTICS",
            "VIEW_ASSETS", "ADD_ASSETS", "VIEW_TEMPLATE", "MANAGE_TEMPLATE",
            "CHANGE_ISOLATION_MODEL", "VIEW_DOMAIN"
        ]


        
    if ui_role == "MANAGER":
        return action in [
            "ADD_MEMBER", "VIEW_SENDER", "VIEW_SETTINGS", "MANAGE_SETTINGS",
            "CREATE_CAMPAIGN", "VIEW_CAMPAIGN", "VIEW_TEAM",
            "MANAGE_CONTACT", "VIEW_CONTACT", "VIEW_ANALYTICS",
            "VIEW_ASSETS", "ADD_ASSETS", "VIEW_TEMPLATE", "MANAGE_TEMPLATE"
        ]

        
    if ui_role == "MEMBER":
        return action in [
            "VIEW_CAMPAIGN", "VIEW_SENDER", "VIEW_TEAM", "VIEW_CONTACT", "VIEW_ANALYTICS",
            "VIEW_ASSETS", "VIEW_TEMPLATE"
        ]

        
    return False

def require_permission(action: str):
    """
    Dependency generator for FastAPI endpoints.
    """
    def permission_checker(jwt_payload: JWTPayload = Depends(verify_jwt_token)):
        if not can(jwt_payload, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied."
            )
        return jwt_payload
    return permission_checker
