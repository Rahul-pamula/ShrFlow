"""
Domain Verification API Routes
Interfaces directly with AWS SES via boto3 to generate DKIM/SPF DNS records.
Includes a mock-fallback for local testing if AWS keys aren't in .env.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict, Any, cast
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os
import uuid
import json

from utils.jwt_middleware import require_active_tenant, JWTPayload
from utils.permissions import require_permission, can
from utils.supabase_client import db
from services.plan_service import PlanService
from services.audit_service import write_log

router = APIRouter(prefix="/domains", tags=["Domains"])

class AddDomainRequest(BaseModel):
    domain_name: str

def get_ses_client():
    """Returns a boto3 SES client, or None if in mock mode."""
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    region = os.getenv("AWS_REGION", "us-east-1")
    
    if not access_key or not secret_key:
        return None # Mock mode for local testing without an AWS account

    return boto3.client(
        'ses',
        region_name=region,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key
    )

@router.get("/")
async def list_domains(
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("domains:view"))
):
    """List all domains for the active tenant (or parent tenant if franchise)"""
    
    target_tenant_id = tenant_id
    if jwt_payload.workspace_type == "FRANCHISE":
        t_res = db.client.table("tenants").select("parent_tenant_id").eq("id", tenant_id).single().execute()
        if t_res.data and isinstance(t_res.data, dict):
            parent_id = t_res.data.get("parent_tenant_id")
            if parent_id:
                target_tenant_id = parent_id

    res = db.client.table("domains")\
        .select("id, domain_name, status, created_at, dkim_tokens, mail_from_domain")\
        .eq("tenant_id", target_tenant_id)\
        .order("created_at", desc=True)\
        .execute()
    
    region = os.getenv("AWS_REGION", "us-east-1")
    return {"data": cast(List[Dict[str, Any]], res.data or []), "region": region}

@router.post("/")
async def add_domain(
    body: AddDomainRequest, 
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("domains:add"))
):
    """
    Step 1: Send domain to AWS, get 3 DKIM tokens back.
    If no AWS keys are configured in .env, generates fake tokens for UI testing.
    """
    # Explicit defense-in-depth security check
    if not can(jwt_payload, "domains:add") or jwt_payload.workspace_type == "FRANCHISE":
        raise HTTPException(status_code=403, detail="Franchise workspaces cannot manipulate domains.")

    # Plan Limit Check
    can_add, stats = PlanService.check_domain_limit(tenant_id, 1)
    if not can_add:
        raise HTTPException(
            status_code=403,
            detail=f"Domain limit reached. Your plan allows up to {stats['limit']} domains. Please upgrade to add more domains."
        )

    domain = body.domain_name.strip().lower()
    
    # Check if domain already exists for THIS tenant
    existing = db.client.table("domains").select("id").eq("domain_name", domain).eq("tenant_id", tenant_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Domain is already registered in your workspace.")
        
    # Check if domain already exists GLOBALLLY and is verified
    global_existing = db.client.table("domains")\
        .select("id, tenant_id, status")\
        .eq("domain_name", domain)\
        .eq("status", "verified")\
        .execute()
    
    if global_existing.data:
        # It's already verified by someone else. Offer franchise request.
        ge_data = cast(List[Dict[str, Any]], global_existing.data or [])
        other_tenant_id = cast(str, ge_data[0].get("tenant_id"))
        
        # Get owner email
        owner_res = db.client.table("tenant_users")\
            .select("user_id")\
            .eq("tenant_id", other_tenant_id)\
            .eq("role", "owner")\
            .execute()
        
        owner_email = "the workspace owner"
        owner_data = cast(List[Dict[str, Any]], owner_res.data or [])
        if owner_data:
            user_res = db.client.table("users")\
                .select("email")\
                .eq("id", cast(str, owner_data[0].get("user_id")))\
                .execute()
            user_data = cast(List[Dict[str, Any]], user_res.data or [])
            if user_data:
                owner_email = cast(str, user_data[0].get("email", "the workspace owner"))

        raise HTTPException(
            status_code=409, 
            detail={
                "message": "This domain is already verified by another organization.",
                "owner_email": owner_email,
                "parent_tenant_id": other_tenant_id,
                "domain_id": cast(str, ge_data[0].get("id")),
                "can_request_franchise": True
            }
        )
        
    mail_from = f"bounces.{domain}"
    dkim_tokens = []
    
    ses = get_ses_client()
    if ses:
        try:
            # Tell AWS SES to generate DKIM keys
            dkim_res = ses.verify_domain_dkim(Domain=domain)
            dkim_tokens = dkim_res.get('DkimTokens', [])
            
            # Tell AWS SES we want a custom MAIL FROM (bounces.brand.com)
            ses.set_identity_mail_from_domain(
                Identity=domain,
                MailFromDomain=mail_from,
                BehaviorOnMXFailure='RejectMessage'
            )
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"AWS SES Error: {str(e)}")
    else:
        # MOCK MODE (if no AWS keys configured locally)
        dkim_tokens = [str(uuid.uuid4()).replace("-", ""), str(uuid.uuid4()).replace("-", ""), str(uuid.uuid4()).replace("-", "")]

    # Save to Supabase
    try:
        inserted = db.client.table("domains").insert({
            "tenant_id": tenant_id,
            "domain_name": domain,
            "dkim_tokens": dkim_tokens,
            "mail_from_domain": mail_from,
            "status": "pending"
        }).execute()
        inserted_data = cast(List[Dict[str, Any]], inserted.data or [])
        new_domain_data = inserted_data[0] if inserted_data else {}
        new_domain_id = str(new_domain_data.get("id")) if new_domain_data.get("id") else None

        await write_log(
            tenant_id=tenant_id,
            user_id=jwt_payload.user_id,
            action="domain_added",
            resource_type="domain",
            resource_id=new_domain_id,
            metadata={"domain": domain}
        )
        return {"status": "success", "data": new_domain_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save domain in database: {str(e)}")


@router.post("/{domain_id}/verify")
async def verify_domain(
    domain_id: str, 
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("domains:add"))
):
    """
    Step 2: Tell AWS to check the global DNS to see if the user pasted the tokens correctly.
    """
    # Explicit defense-in-depth security check
    if not can(jwt_payload, "domains:add") or jwt_payload.workspace_type == "FRANCHISE":
        raise HTTPException(status_code=403, detail="Franchise workspaces cannot manipulate domains.")

    # Fetch domain
    res = db.client.table("domains").select("*").eq("id", domain_id).eq("tenant_id", tenant_id).single().execute()
    if not res.data or not isinstance(res.data, dict):
        raise HTTPException(status_code=404, detail="Domain not found")
        
    domain_name = res.data.get("domain_name")
    if not domain_name:
        raise HTTPException(status_code=404, detail="Domain name missing")
    ses = get_ses_client()
    
    new_status = "pending"
    
    if ses:
        try:
            # Check DKIM Status
            dkim_info = ses.get_identity_dkim_attributes(Identities=[domain_name])
            dkim_status = dkim_info['DkimAttributes'].get(domain_name, {}).get('DkimVerificationStatus', 'Pending')
            
            # Check Custom MAIL FROM Status
            mail_from_info = ses.get_identity_mail_from_domain_attributes(Identities=[domain_name])
            mail_from_status = mail_from_info['MailFromDomainAttributes'].get(domain_name, {}).get('MailFromDomainStatus', 'Pending')
            
            if dkim_status == 'Success' and mail_from_status == 'Success':
                new_status = "verified"
            elif dkim_status == 'Failed' or mail_from_status == 'Failed':
                new_status = "failed"
                
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"AWS SES Error: {str(e)}")
    else:
        # MOCK MODE: instantly verify if testing locally
        new_status = "verified"
        
    # Update DB
    updated = db.client.table("domains").update({"status": new_status}).eq("id", domain_id).execute()
    
    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="domain_verified" if new_status == "verified" else "domain_verification_failed",
        resource_type="domain",
        resource_id=domain_id,
        metadata={"status": new_status, "domain": domain_name}
    )
    
    updated_data = cast(List[Dict[str, Any]], updated.data or [])
    return {"status": "success", "verification_status": new_status, "data": updated_data[0] if updated_data else {}}


@router.delete("/{domain_id}")
async def delete_domain(
    domain_id: str, 
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("domains:delete"))
):
    """Delete domain from DB and AWS SES"""
    # Explicit defense-in-depth security check
    if not can(jwt_payload, "domains:delete") or jwt_payload.workspace_type == "FRANCHISE":
        raise HTTPException(status_code=403, detail="You do not have permission to delete domains or franchises cannot manipulate infrastructure.")

    res = db.client.table("domains").select("domain_name").eq("id", domain_id).eq("tenant_id", tenant_id).single().execute()
    if not res.data or not isinstance(res.data, dict):
        raise HTTPException(status_code=404, detail="Domain not found")
        
    domain_name = res.data.get("domain_name")
    if not domain_name:
        raise HTTPException(status_code=404, detail="Domain name missing")

    # 1. PREREQUISITE: Check if domain is assigned to any workspace (Franchise or Main)
    # This prevents breaking the outbound orchestration for assigned tenants.
    usage_res = db.client.table("tenants").select("id, company_name").eq("sending_domain", domain_name).execute()
    if usage_res.data and isinstance(usage_res.data, list) and len(usage_res.data) > 0:
        names = []
        for t in usage_res.data[:3]:
            if isinstance(t, dict) and t.get("company_name"):
                names.append(str(t.get("company_name")))
        workspaces = ", ".join(names)
        raise HTTPException(
            status_code=400, 
            detail=f"Domain cannot be deleted: It is currently assigned to {len(usage_res.data)} workspace(s) (e.g., {workspaces}). Reassign them before deleting."
        )

    # 2. PREREQUISITE: Check if any active campaigns are using this domain
    campaign_usage = db.client.table("campaigns")\
        .select("id")\
        .eq("domain_id", domain_id)\
        .in_("status", ["approved", "scheduled", "sending", "paused"])\
        .execute()
    
    if campaign_usage.data:
        raise HTTPException(
            status_code=400, 
            detail="Domain cannot be deleted: It is currently in use by active or scheduled campaigns."
        )

    ses = get_ses_client()
    
    if ses:
        try:
            ses.delete_identity(Identity=domain_name)
        except ClientError as e:
            pass # ignore if it doesn't exist on AWS anymore
            
    # Use hard delete since schema lacks deleted_at
    db.client.table("domains").delete().eq("id", domain_id).eq("tenant_id", tenant_id).execute()
    
    await write_log(
        tenant_id=tenant_id,
        user_id=jwt_payload.user_id,
        action="domain_removed",
        resource_type="domain",
        resource_id=domain_id,
        metadata={"domain": domain_name}
    )
    
    return {"status": "success", "message": "Domain removed"}
