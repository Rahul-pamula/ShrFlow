from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta, timezone
from utils.supabase_client import db
from utils.jwt_middleware import require_active_tenant, JWTPayload
from utils.permissions import require_permission

router = APIRouter(prefix="/billing", tags=["billing"])

# ─── Static plan ordering for upgrade/downgrade direction ───────────────────
PLAN_PRICE_ORDER = {
    "11111111-1111-1111-1111-111111111111": 0,   # Free      ₹0
    "22222222-2222-2222-2222-222222222222": 1,   # Starter   ₹799
    "33333333-3333-3333-3333-333333333333": 2,   # Pro       ₹2,499
    "44444444-4444-4444-4444-444444444444": 3,   # Enterprise ₹9,999
}

class ChangePlanRequest(BaseModel):
    plan_id: str


def _get_tenant_billing(tenant_id: str) -> dict:
    """Fetch tenant with plan details and scheduled plan."""
    res = db.client.table("tenants").select(
        "plan_id, emails_sent_this_cycle, billing_cycle_start, billing_cycle_end, "
        "scheduled_plan_id, scheduled_plan_effective_at, "
        "plans!tenants_plan_id_fkey(id, name, price_monthly, max_monthly_emails, max_contacts, max_users, max_domains, allow_custom_domain)"
    ).eq("id", tenant_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Tenant billing profile not found")
    return res.data[0]


def _get_plan(plan_id: str) -> dict:
    res = db.client.table("plans").select(
        "id, name, price_monthly, max_monthly_emails, max_contacts, max_users, max_domains, allow_custom_domain"
    ).eq("id", plan_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    return res.data[0]


@router.get("/plan")
async def get_current_plan(
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_BILLING"))
):
    """
    Returns current plan, usage stats, all available plans, and any scheduled downgrade.
    """
    tenant = _get_tenant_billing(tenant_id)

    # Fallback if plan relation missing
    plan_details = tenant.get("plans") or {
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "Free", "price_monthly": 0,
        "max_monthly_emails": 1000, "max_contacts": 500,
        "allow_custom_domain": False,
    }

    # Contact count
    contacts_res = db.client.table("contacts").select("id", count="exact").eq("tenant_id", tenant_id).execute()
    contacts_count = contacts_res.count if hasattr(contacts_res, "count") else 0

    # Scheduled downgrade plan details (if any)
    scheduled_plan = None
    if tenant.get("scheduled_plan_id"):
        sp_res = db.client.table("plans").select(
            "id, name, price_monthly, max_monthly_emails, max_contacts"
        ).eq("id", tenant["scheduled_plan_id"]).execute()
        if sp_res.data:
            scheduled_plan = sp_res.data[0]

    # All plans (for pricing table)
    all_plans_res = db.client.table("plans").select(
        "id, name, price_monthly, max_monthly_emails, max_contacts, max_users, max_domains, allow_custom_domain"
    ).order("price_monthly").execute()

    # Compute billing_cycle_end if missing
    billing_cycle_end = tenant.get("billing_cycle_end")
    if not billing_cycle_end and tenant.get("billing_cycle_start"):
        start = datetime.fromisoformat(tenant["billing_cycle_start"].replace("Z", "+00:00"))
        billing_cycle_end = (start + timedelta(days=30)).isoformat()

    return {
        "plan_id": tenant.get("plan_id"),
        "plan_details": plan_details,
        "billing_cycle_start": tenant.get("billing_cycle_start"),
        "billing_cycle_end": billing_cycle_end,
        "scheduled_plan": scheduled_plan,
        "scheduled_plan_effective_at": tenant.get("scheduled_plan_effective_at"),
        "usage": {
            "emails_sent_this_cycle": tenant.get("emails_sent_this_cycle") or 0,
            "contacts_used": contacts_count,
        },
        "all_plans": all_plans_res.data if all_plans_res.data else [],
    }


@router.post("/change-plan")
async def change_plan(
    request: ChangePlanRequest, 
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_BILLING"))
):
    """
    Industry-standard plan change logic:
    - UPGRADE   (higher price) → immediate, limits update now
    - DOWNGRADE (lower price)  → scheduled for end of billing period
    - SAME PLAN                → 400 error
    """
    if request.plan_id not in PLAN_PRICE_ORDER:
        raise HTTPException(status_code=404, detail="Invalid plan ID")

    tenant = _get_tenant_billing(tenant_id)
    new_plan = _get_plan(request.plan_id)
    current_plan_id = tenant.get("plan_id", "11111111-1111-1111-1111-111111111111")

    if current_plan_id == request.plan_id:
        raise HTTPException(status_code=400, detail="You are already on this plan.")

    current_tier = PLAN_PRICE_ORDER.get(current_plan_id, 0)
    new_tier = PLAN_PRICE_ORDER[request.plan_id]

    if new_tier > current_tier:
        # ── UPGRADE: immediate ──────────────────────────────────────────────
        # Reset billing cycle from today, clear any pending scheduled downgrade
        now = datetime.now(timezone.utc)
        cycle_end = (now + timedelta(days=30)).isoformat()

        db.client.table("tenants").update({
            "plan_id": request.plan_id,
            "billing_cycle_start": now.isoformat(),
            "billing_cycle_end": cycle_end,
            "scheduled_plan_id": None,
            "scheduled_plan_effective_at": None,
            "emails_sent_this_cycle": 0,  # reset usage counter on upgrade
        }).eq("id", tenant_id).execute()

        return {
            "status": "upgraded",
            "plan_name": new_plan["name"],
            "effective": "immediately",
            "next_billing_date": cycle_end,
            "message": (
                f"Successfully upgraded to {new_plan['name']}. "
                f"Your new limits ({new_plan['max_contacts']:,} contacts, "
                f"{new_plan['max_monthly_emails']:,} emails/mo) are active now."
            ),
        }

    else:
        # ── DOWNGRADE: scheduled for end of current billing period ──────────
        billing_cycle_end = tenant.get("billing_cycle_end")
        if not billing_cycle_end and tenant.get("billing_cycle_start"):
            start = datetime.fromisoformat(tenant["billing_cycle_start"].replace("Z", "+00:00"))
            billing_cycle_end = (start + timedelta(days=30)).isoformat()

        if not billing_cycle_end:
            billing_cycle_end = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()

        db.client.table("tenants").update({
            "scheduled_plan_id": request.plan_id,
            "scheduled_plan_effective_at": billing_cycle_end,
        }).eq("id", tenant_id).execute()

        # Format the date nicely for the message
        effective_dt = datetime.fromisoformat(billing_cycle_end.replace("Z", "+00:00"))
        effective_str = effective_dt.strftime("%B %d, %Y")

        return {
            "status": "downgrade_scheduled",
            "plan_name": new_plan["name"],
            "effective": billing_cycle_end,
            "message": (
                f"Downgrade to {new_plan['name']} scheduled for {effective_str}. "
                f"You keep your current plan until then. "
                f"You can cancel this downgrade at any time before {effective_str}."
            ),
        }


@router.post("/cancel-downgrade")
async def cancel_downgrade(
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_BILLING"))
):
    """Cancel a pending scheduled downgrade. The tenant stays on their current plan."""
    tenant = _get_tenant_billing(tenant_id)

    if not tenant.get("scheduled_plan_id"):
        raise HTTPException(status_code=400, detail="No scheduled downgrade to cancel.")

    db.client.table("tenants").update({
        "scheduled_plan_id": None,
        "scheduled_plan_effective_at": None,
    }).eq("id", tenant_id).execute()

    return {
        "status": "cancelled",
        "message": "Scheduled downgrade cancelled. You will remain on your current plan.",
    }


# ── Legacy endpoint: keep for backwards compatibility ────────────────────────
@router.post("/upgrade")
async def legacy_upgrade(
    request: ChangePlanRequest, 
    tenant_id: str = Depends(require_active_tenant),
    jwt_payload: JWTPayload = Depends(require_permission("VIEW_BILLING"))
):
    """Deprecated. Use POST /billing/change-plan instead."""
    return await change_plan(request, tenant_id=tenant_id, jwt_payload=jwt_payload)
