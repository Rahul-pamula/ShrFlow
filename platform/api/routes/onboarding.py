"""
ONBOARDING ROUTES
Progressive Tenant Onboarding System

Features:
- Get onboarding status
- Update basic tenant info
- Update compliance data
- Update intent/context
- Complete onboarding (activate tenant)
"""

from fastapi import APIRouter, HTTPException, Header, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from utils.jwt_middleware import require_authenticated_user, JWTPayload
from utils.permissions import require_permission

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])



# === Pydantic Models ===

class OnboardingStatusResponse(BaseModel):
    """Current onboarding progress"""
    tenant_id: str
    status: str
    completed_stages: List[str]
    next_stage: Optional[str]
    required_stages: List[str]
    optional_stages: List[str]
    current_data: Optional[dict] = None


class BasicInfoRequest(BaseModel):
    """Stage 2: Basic tenant profile"""
    organization_name: str = Field(..., min_length=1, max_length=200)
    country: str = Field(..., min_length=2, max_length=2)  # ISO country code
    timezone: str = Field(default="UTC")


class ComplianceRequest(BaseModel):
    """Stage 3: Business address (REQUIRED for sending)"""
    address_line1: str = Field(..., min_length=1, max_length=200)
    address_line2: Optional[str] = Field(None, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: str = Field(..., min_length=2, max_length=2)
    zip: str = Field(..., min_length=1, max_length=20)


class IntentRequest(BaseModel):
    """Stage 4: Business context (optional)"""
    business_type: Optional[str] = Field(None, pattern="^(ecommerce|saas|agency|nonprofit|other)$")
    primary_channel: Optional[str] = Field(None, pattern="^(marketing|transactional|both)$")
    tools_used: Optional[List[str]] = None
    audience_size: Optional[str] = None


class OnboardingResponse(BaseModel):
    """Generic onboarding update response"""
    status: str
    next_stage: Optional[str]
    message: str


# === Helper Functions ===

# Deprecated header helper removed. derive tenant_id from JWT authority.



# === Routes ===

@router.get("/status", response_model=OnboardingStatusResponse)
async def get_onboarding_status(jwt_payload: JWTPayload = Depends(require_permission("analytics:view"))):

    """
    Get current onboarding progress for a tenant.
    
    Returns:
    - Current tenant status
    - Completed stages
    - Next recommended stage
    """
    from utils.supabase_client import db
    tenant_id = jwt_payload.tenant_id

    
    # Get tenant
    tenant_result = db.client.table("tenants").select("*").eq("id", tenant_id).execute()
    
    if not tenant_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    tenant = tenant_result.data[0]
    
    # Get onboarding progress
    progress_result = db.client.table("onboarding_progress").select("*").eq(
        "tenant_id", tenant_id
    ).execute()
    
    if not progress_result.data:
        # Create progress record if it doesn't exist
        db.client.table("onboarding_progress").insert({
            "tenant_id": tenant_id,
            "stage_basic_info": False,
            "stage_compliance": False,
            "stage_intent": False
        }).execute()
        
        progress = {
            "stage_basic_info": False,
            "stage_compliance": False,
            "stage_intent": False
        }
    else:
        progress = progress_result.data[0]
    
    # Determine completed stages
    completed_stages = []
    if progress.get("stage_basic_info"):
        completed_stages.append("basic_info")
    if progress.get("stage_compliance"):
        completed_stages.append("compliance")
    if progress.get("stage_intent"):
        completed_stages.append("intent")
    
    # Determine next stage
    next_stage = None
    if not progress.get("stage_basic_info"):
        next_stage = "basic_info"
    elif not progress.get("stage_compliance"):
        next_stage = "compliance"
    elif not progress.get("stage_intent"):
        next_stage = "intent"
    else:
        next_stage = "complete"
    
    # Check for pending invites for this user's email
    invite_data = None
    try:
        inv_res = db.client.table("team_invitations")\
            .select("*, tenants(company_name)")\
            .eq("email", jwt_payload.email)\
            .eq("status", "pending")\
            .execute()
        
        if inv_res.data:
            invite = inv_res.data[0]
            invite_data = {
                "id": invite["id"],
                "token": invite["token"],
                "role": invite["role"],
                "workspace_name": invite.get("tenants", {}).get("company_name") or "Your Team",
                "inviter_id": invite.get("inviter_id")
            }
    except Exception as e:
        print(f"DEBUG: Failed to check invites during onboarding status: {e}")

    return OnboardingStatusResponse(
        tenant_id=tenant_id,
        status=tenant["status"],
        completed_stages=completed_stages,
        next_stage=next_stage,
        required_stages=["basic_info", "compliance"],
        optional_stages=["intent"],
        current_data={
            "workspace_name": tenant.get("workspace_name") or tenant.get("company_name") or "",
            "organization_name": tenant.get("organization_name") or "",
            "user_role": tenant.get("user_role") or "",
            "pending_invite": invite_data
        }
    )


@router.put("/basic-info", response_model=OnboardingResponse)
async def update_basic_info(
    request: BasicInfoRequest,
    jwt_payload: JWTPayload = Depends(require_permission("settings:update"))
):

    """
    Stage 2: Update basic tenant profile.
    
    Required fields:
    - organization_name
    - country
    - timezone (optional, defaults to UTC)
    """
    from utils.supabase_client import db
    
    # Get tenant_id from JWT (authoritative)
    tenant_id = jwt_payload.tenant_id
    
    try:
        # Update tenant
        db.client.table("tenants").update({
            "organization_name": request.organization_name,
            "country": request.country,
            "timezone": request.timezone,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", tenant_id).execute()
        
        # Update progress
        db.client.table("onboarding_progress").update({
            "stage_basic_info": True,
            "basic_info_completed_at": datetime.utcnow().isoformat()
        }).eq("tenant_id", tenant_id).execute()
        
        return OnboardingResponse(
            status="success",
            next_stage="compliance",
            message="Basic info saved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update basic info: {str(e)}"
        )


@router.put("/compliance", response_model=OnboardingResponse)
async def update_compliance(
    request: ComplianceRequest,
    jwt_payload: JWTPayload = Depends(require_permission("settings:update"))
):

    """
    Stage 3: Update business address (REQUIRED for sending emails).
    
    This data is used for:
    - Email footer compliance (CAN-SPAM, GDPR)
    - Legal requirements
    """
    from utils.supabase_client import db
    
    # Get tenant_id from JWT (authoritative)
    tenant_id = jwt_payload.tenant_id
    
    try:
        # Update tenant
        db.client.table("tenants").update({
            "business_address_line1": request.address_line1,
            "business_address_line2": request.address_line2,
            "business_city": request.city,
            "business_state": request.state,
            "business_country": request.country,
            "business_zip": request.zip,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", tenant_id).execute()
        
        # Update progress
        db.client.table("onboarding_progress").update({
            "stage_compliance": True,
            "compliance_completed_at": datetime.utcnow().isoformat()
        }).eq("tenant_id", tenant_id).execute()
        
        return OnboardingResponse(
            status="success",
            next_stage="intent",
            message="Compliance data saved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update compliance data: {str(e)}"
        )


@router.put("/intent", response_model=OnboardingResponse)
async def update_intent(
    request: IntentRequest,
    jwt_payload: JWTPayload = Depends(require_permission("settings:update"))
):

    """
    Stage 4: Update business context (optional).
    
    This helps us understand:
    - What type of business you run
    - Your primary use case
    - What tools you currently use
    - Your audience size
    """
    from utils.supabase_client import db
    tenant_id = jwt_payload.tenant_id

    
    try:
        # Build metadata
        metadata = {}
        if request.tools_used:
            metadata["tools_used"] = request.tools_used
        if request.audience_size:
            metadata["audience_size"] = request.audience_size
        
        # Update tenant
        update_data = {
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if request.business_type:
            update_data["business_type"] = request.business_type
        if request.primary_channel:
            update_data["primary_channel"] = request.primary_channel
        if metadata:
            update_data["metadata"] = metadata
        
        db.client.table("tenants").update(update_data).eq("id", tenant_id).execute()
        
        # Update progress
        db.client.table("onboarding_progress").update({
            "stage_intent": True,
            "intent_completed_at": datetime.utcnow().isoformat()
        }).eq("tenant_id", tenant_id).execute()
        
        return OnboardingResponse(
            status="success",
            next_stage="complete",
            message="Intent data saved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Access denied."
        )



@router.post("/complete", response_model=OnboardingResponse)
async def complete_onboarding(jwt_payload: JWTPayload = Depends(require_permission("settings:update"))):

    """
    Complete onboarding and activate tenant.
    
    Requirements:
    - Basic info must be completed
    - Compliance data must be completed
    - Intent is optional
    
    After activation:
    - Tenant status changes to 'active'
    - User can access all features
    - Email sending is enabled
    """
    from utils.supabase_client import db
    
    # Get tenant_id from JWT (authoritative)
    tenant_id = jwt_payload.tenant_id
    
    print(f"DEBUG: Completing onboarding for tenant_id: {tenant_id}", flush=True)
    
    if not tenant_id:
        print("ERROR: No tenant_id found in token", flush=True)
        raise HTTPException(status_code=400, detail="Tenant ID not found in token")

    # We trust the frontend flow here. If they reached this endpoint, they are done.
    # Legacy 'onboarding_progress' checks removed to support new flow.
    
    try:
        # Activate tenant
        print("DEBUG: Updating tenant status to active...", flush=True)
        response = db.client.table("tenants").update({
            "status": "active",
            "onboarding_completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", tenant_id).execute()
        print(f"DEBUG: Tenant update response: {response}", flush=True)
        
        # Try to mark onboarding_progress as complete (legacy, optional)
        try:
            print("DEBUG: Attempting to update legacy onboarding_progress...", flush=True)
            db.client.table("onboarding_progress").update({
                "completed_at": datetime.utcnow().isoformat()
            }).eq("tenant_id", tenant_id).execute()
        except Exception as e:
            print(f"DEBUG: Legacy table update failed (ignoring): {e}", flush=True)
            pass # Ignore if table/record doesn't exist

        
        return OnboardingResponse(
            status="success",
            next_stage=None,
            message="Onboarding completed! Your account is now active."
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR: Failed to complete onboarding: {e}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Access denied."
        )

"""
New Onboarding Endpoints for 4-Step Flow
"""

from pydantic import BaseModel
from typing import List

# === New Pydantic Models ===

class WorkspaceRequest(BaseModel):
    """Step 1: Workspace setup"""
    workspace_name: str
    user_role: str


class UseCaseRequest(BaseModel):
    """Step 2: Primary use case"""
    primary_use_case: str


class IntegrationsRequest(BaseModel):
    """Step 3: Integration sources"""
    integration_sources: List[str]


class ScaleRequest(BaseModel):
    """Step 4: Expected scale"""
    expected_scale: str


# === New Routes ===

@router.post("/workspace")
async def save_workspace(
    request: WorkspaceRequest,
    user: JWTPayload = Depends(require_permission("settings:update"))
):

    """Save workspace name and user role"""
    from utils.supabase_client import db
    
    try:
        # Update tenant with workspace info (syncing both workspace_name and company_name)
        db.client.table("tenants").update({
            "workspace_name": request.workspace_name,
            "company_name": request.workspace_name,
            "organization_name": request.workspace_name,
            "user_role": request.user_role,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user.tenant_id).execute()
        
        return {"status": "success", "message": "Workspace info saved"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Access denied."
        )



@router.post("/use-case")
async def save_use_case(
    request: UseCaseRequest,
    user: JWTPayload = Depends(require_permission("settings:update"))
):

    """Save primary use case"""
    from utils.supabase_client import db
    
    try:
        db.client.table("tenants").update({
            "primary_use_case": request.primary_use_case,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user.tenant_id).execute()
        
        return {"status": "success", "message": "Use case saved"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Access denied."
        )



@router.post("/integrations")
async def save_integrations(
    request: IntegrationsRequest,
    user: JWTPayload = Depends(require_permission("settings:update"))
):

    """Save integration sources"""
    from utils.supabase_client import db
    
    try:
        db.client.table("tenants").update({
            "integration_sources": request.integration_sources,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user.tenant_id).execute()
        
        return {"status": "success", "message": "Integrations saved"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Access denied."
        )



@router.post("/scale")
async def save_scale(
    request: ScaleRequest,
    user: JWTPayload = Depends(require_permission("settings:update"))
):

    """Save expected scale"""
    from utils.supabase_client import db
    
    try:
        db.client.table("tenants").update({
            "expected_scale": request.expected_scale,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user.tenant_id).execute()
        
        return {"status": "success", "message": "Scale info saved"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Access denied."
        )

