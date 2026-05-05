from fastapi import Header, HTTPException, status, Depends
from jose import JWTError, jwt
from typing import Optional, List, Dict
import os
from .database import db

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

class JWTPayload:
    def __init__(self, user_id: str, tenant_id: str, email: str, role: str, workspace_type: str, tenant_status: str, onboarding_required: bool, token_version: int = 1, isolation_model: str = "team"):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.email = email
        self.role = role
        self.workspace_type = workspace_type
        self.tenant_status = tenant_status
        self.onboarding_required = onboarding_required
        self.token_version = token_version
        self.isolation_model = isolation_model

ROLE_PERMISSIONS = {
    "OWNER": ["template:view", "template:manage"],
    "ADMIN": ["template:view", "template:manage"],
    "CREATOR": ["template:view", "template:manage"],
    "VIEWER": ["template:view"]
}

def verify_jwt_token(authorization: str = Header(..., alias="Authorization")) -> JWTPayload:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header required")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid format")
    
    token = parts[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        tenant_id = payload.get("tenant_id")
        email = payload.get("email")
        
        if not all([user_id, tenant_id, email]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

        # Simplified check for the microservice (could be offloaded to gateway later)
        # For now, we trust the JWT but we can add DB checks if needed.
        
        return JWTPayload(
            user_id=user_id,
            tenant_id=tenant_id,
            email=email,
            role=payload.get("role", "VIEWER").upper(),
            workspace_type=payload.get("workspace_type", "MAIN"),
            tenant_status=payload.get("tenant_status", "active"),
            onboarding_required=payload.get("onboarding_required", False),
            token_version=payload.get("token_version", 1),
            isolation_model=payload.get("isolation_model", "team")
        )
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

def require_active_tenant(jwt_payload: JWTPayload = Depends(verify_jwt_token)) -> str:
    if jwt_payload.tenant_status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return jwt_payload.tenant_id

def require_permission(action: str):
    def permission_checker(jwt_payload: JWTPayload = Depends(verify_jwt_token)):
        permissions = ROLE_PERMISSIONS.get(jwt_payload.role, [])
        if action not in permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing permission: {action}")
        return jwt_payload
    return permission_checker
