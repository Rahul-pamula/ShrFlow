from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from utils.supabase_client import db
from utils.jwt_middleware import require_active_tenant

router = APIRouter(prefix="/billing", tags=["billing"])

class UpgradeRequest(BaseModel):
    plan_id: str

@router.get("/plan")
async def get_current_plan(tenant_id: str = Depends(require_active_tenant)):
    """Fetch the tenant's current plan and usage stats."""
    
    tenant_res = db.client.table("tenants").select(
        "plan_id, emails_sent_this_cycle, billing_cycle_start, plans(name, price_monthly, max_monthly_emails, max_contacts, allow_custom_domain)"
    ).eq("id", tenant_id).execute()
    
    if not tenant_res.data:
        raise HTTPException(status_code=404, detail="Tenant billing profile not found")
        
    tenant = tenant_res.data[0]
    
    # In case of missing relation (fallback to free)
    if not tenant.get("plans"):
        tenant["plans"] = {
            "name": "Free",
            "price_monthly": 0,
            "max_monthly_emails": 1000,
            "max_contacts": 500,
            "allow_custom_domain": False
        }
        
    # Get current contact count
    contacts_res = db.client.table("contacts").select("id", count="exact").eq("tenant_id", tenant_id).execute()
    contacts_count = contacts_res.count if hasattr(contacts_res, 'count') else 0
        
    return {
        "plan_id": tenant.get("plan_id"),
        "plan_details": tenant["plans"],
        "usage": {
            "emails_sent_this_cycle": tenant.get("emails_sent_this_cycle") or 0,
            "contacts_used": contacts_count,
            "billing_cycle_start": tenant.get("billing_cycle_start")
        }
    }

@router.post("/upgrade")
async def simulate_upgrade(request: UpgradeRequest, tenant_id: str = Depends(require_active_tenant)):
    """
    Simulates a Stripe upgrade flow for MVP Phase 7 testing.
    Instantly updates the database to the requested plan ID with a 100% discount.
    """
    # 1. Verify plan exists
    plan_res = db.client.table("plans").select("name").eq("id", request.plan_id).execute()
    if not plan_res.data:
        raise HTTPException(status_code=404, detail="Invalid Plan ID")
        
    plan_name = plan_res.data[0]["name"]
    
    # 2. Complete mock upgrade
    db.client.table("tenants").update({
        "plan_id": request.plan_id
    }).eq("id", tenant_id).execute()
    
    return {
        "status": "success",
        "message": f"Successfully upgraded to the {plan_name} plan. MVP 100% discount applied."
    }
