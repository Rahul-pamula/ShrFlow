"""
Domain Verification API Routes
Interfaces directly with AWS SES via boto3 to generate DKIM/SPF DNS records.
Includes a mock-fallback for local testing if AWS keys aren't in .env.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os
import uuid
import json

from utils.jwt_middleware import require_active_tenant, JWTPayload
from utils.permissions import require_permission
from utils.supabase_client import db

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
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_DOMAIN"))
):
    """List all domains for the active tenant"""
    res = db.client.table("domains")\
        .select("id, domain_name, status, created_at")\
        .eq("tenant_id", tenant_id)\
        .order("created_at", desc=True)\
        .execute()
    return {"data": res.data}

@router.post("/")
async def add_domain(
    body: AddDomainRequest, 
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("ADD_DOMAIN"))
):
    """
    Step 1: Send domain to AWS, get 3 DKIM tokens back.
    If no AWS keys are configured in .env, generates fake tokens for UI testing.
    """
    domain = body.domain_name.strip().lower()
    
    # Check if domain already exists for THIS tenant
    existing = db.client.table("domains").select("id").eq("domain_name", domain).eq("tenant_id", tenant_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Domain is already registered in your workspace.")
        
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
        return {"status": "success", "data": inserted.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save domain in database: {str(e)}")


@router.post("/{domain_id}/verify")
async def verify_domain(
    domain_id: str, 
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("ADD_DOMAIN"))
):
    """
    Step 2: Tell AWS to check the global DNS to see if the user pasted the tokens correctly.
    """
    # Fetch domain
    res = db.client.table("domains").select("*").eq("id", domain_id).eq("tenant_id", tenant_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Domain not found")
        
    domain_name = res.data["domain_name"]
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
    return {"status": "success", "verification_status": new_status, "data": updated.data[0]}


@router.delete("/{domain_id}")
async def delete_domain(
    domain_id: str, 
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("ADD_DOMAIN"))
):
    """Delete domain from DB and AWS SES"""
    res = db.client.table("domains").select("domain_name").eq("id", domain_id).eq("tenant_id", tenant_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Domain not found")
        
    domain_name = res.data["domain_name"]
    ses = get_ses_client()
    
    if ses:
        try:
            ses.delete_identity(Identity=domain_name)
        except ClientError as e:
            pass # ignore if it doesn't exist on AWS anymore
            
    db.client.table("domains").delete().eq("id", domain_id).eq("tenant_id", tenant_id).execute()
    return {"status": "success", "message": "Domain removed"}
