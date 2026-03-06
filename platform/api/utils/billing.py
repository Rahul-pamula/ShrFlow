from fastapi import HTTPException
from utils.supabase_client import db

def check_can_send_campaign(tenant_id: str, audience_size: int):
    """
    Validates if a tenant has enough quota to send a campaign of `audience_size`.
    Returns True if allowed, or raises an HTTPException if quota is exceeded.
    """
    # 1. Fetch Tenant's current billing cycle info and Plan ID
    tenant_res = db.client.table("tenants").select(
        "plan_id, emails_sent_this_cycle"
    ).eq("id", tenant_id).execute()
    
    if not tenant_res.data:
        raise HTTPException(status_code=404, detail="Tenant billing profile not found")
        
    tenant = tenant_res.data[0]
    plan_id = tenant.get("plan_id")
    emails_sent = tenant.get("emails_sent_this_cycle") or 0
    
    # Defaults to our 'Free' plan UUID if malformed
    if not plan_id:
        plan_id = '11111111-1111-1111-1111-111111111111'
        
    # 2. Fetch Plan limits
    plan_res = db.client.table("plans").select("name, max_monthly_emails").eq("id", plan_id).execute()
    
    if not plan_res.data:
        raise HTTPException(status_code=500, detail="Configured billing plan not found in database")
        
    plan = plan_res.data[0]
    max_emails = plan.get("max_monthly_emails") or 1000
    plan_name = plan.get("name")
    
    # 3. Quota Enforcement Logic
    if (emails_sent + audience_size) > max_emails:
        raise HTTPException(
            status_code=403, 
            detail={
                "code": "QUOTA_EXCEEDED",
                "message": f"Monthly limit reached. Your {plan_name} plan allows {max_emails:,} emails/month. You have sent {emails_sent:,}. Sending this campaign ({audience_size:,} recipients) would exceed your limit.",
                "current_usage": emails_sent,
                "plan_limit": max_emails,
                "plan_name": plan_name
            }
        )
        
    return True
