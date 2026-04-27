from typing import Dict, Tuple, Optional, List
from utils.supabase_client import db
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class PlanService:
    @staticmethod
    def get_tenant_plan_details(tenant_id: str) -> Dict:
        """Fetch plan details and current usage for a tenant."""
        res = db.client.table("tenants")\
            .select("id, plan_id, emails_sent_this_cycle, plans!tenants_plan_id_fkey(*)")\
            .eq("id", tenant_id)\
            .single()\
            .execute()
        
        if not res.data:
            return {}
        
        tenant_data = res.data
        plan = tenant_data.get("plans", {})
        
        # Fallback for Free plan if missing
        if not plan:
            plan = {
                "name": "Free",
                "max_contacts": 500,
                "max_monthly_emails": 1000,
                "max_users": 1,
                "max_domains": 1,
                "features": {"automation": False, "api": False, "advanced_analytics": False, "team_members": False}
            }
            
        return {
            "plan": plan,
            "usage": {
                "emails_sent": tenant_data.get("emails_sent_this_cycle", 0)
            }
        }

    @staticmethod
    def check_contact_limit(tenant_id: str, additional_count: int = 0) -> Tuple[bool, Dict]:
        """Check if tenant can add more contacts."""
        # Current contacts count
        contacts_res = db.client.table("contacts")\
            .select("id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .execute()
        current_contacts = contacts_res.count or 0
        
        plan_details = PlanService.get_tenant_plan_details(tenant_id)
        max_contacts = plan_details["plan"].get("max_contacts", 500)
        
        can_add = (current_contacts + additional_count) <= max_contacts
        
        return can_add, {
            "current": current_contacts,
            "limit": max_contacts,
            "available": max(0, max_contacts - current_contacts),
            "requested": additional_count
        }

    @staticmethod
    def check_user_limit(tenant_id: str, additional_count: int = 0) -> Tuple[bool, Dict]:
        """Check if tenant can invite/add more users."""
        # Current users count
        users_res = db.client.table("tenant_users")\
            .select("id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .execute()
        current_users = users_res.count or 0
        
        # Also count pending invitations that are NOT expired
        now = datetime.now(timezone.utc).isoformat()
        invites_res = db.client.table("team_invitations")\
            .select("id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .eq("status", "pending")\
            .gt("expires_at", now)\
            .execute()
        pending_invites = invites_res.count or 0
        
        total_users = current_users + pending_invites
        
        plan_details = PlanService.get_tenant_plan_details(tenant_id)
        max_users = plan_details["plan"].get("max_users", 1)
        
        # -1 means unlimited
        if max_users == -1:
            return True, {
                "current": total_users,
                "used": total_users,
                "limit": -1, 
                "available": -1,
                "remaining": -1
            }
            
        can_add = (total_users + additional_count) <= max_users
        
        recommended_plan = None
        if not can_add:
            recommended_plan = PlanService.suggest_plan_for_team(total_users + additional_count)

        return can_add, {
            "current": total_users,
            "used": total_users,
            "limit": max_users,
            "available": max(0, max_users - total_users),
            "remaining": max(0, max_users - total_users),
            "requested": additional_count,
            "recommended_plan": recommended_plan
        }

    @staticmethod
    def suggest_plan_for_team(required_users: int) -> Optional[Dict]:
        """Suggest a plan based on the number of required seats."""
        if required_users <= 3:
            return {"name": "Starter", "limit": 3, "price": "₹799"}
        elif required_users <= 50:
            return {"name": "Pro", "limit": 50, "price": "₹2499"}
        else:
            return {"name": "Enterprise", "limit": 500, "price": "₹9999"}

    @staticmethod
    def check_domain_limit(tenant_id: str, additional_count: int = 0) -> Tuple[bool, Dict]:
        """Check if tenant can add more domains."""
        domains_res = db.client.table("domains")\
            .select("id", count="exact")\
            .eq("tenant_id", tenant_id)\
            .execute()
        current_domains = domains_res.count or 0
        
        plan_details = PlanService.get_tenant_plan_details(tenant_id)
        max_domains = plan_details["plan"].get("max_domains", 1)
        
        if max_domains == -1:
            return True, {"current": current_domains, "limit": -1, "available": -1}
            
        can_add = (current_domains + additional_count) <= max_domains
        
        return can_add, {
            "current": current_domains,
            "limit": max_domains,
            "available": max(0, max_domains - current_domains),
            "requested": additional_count
        }

    @staticmethod
    def check_email_limit(tenant_id: str, additional_count: int = 0) -> Tuple[bool, Dict]:
        """Check if tenant has remaining email quota for the current cycle."""
        plan_details = PlanService.get_tenant_plan_details(tenant_id)
        current_sent = plan_details["usage"]["emails_sent"]
        max_emails = plan_details["plan"].get("max_monthly_emails", 1000)
        
        if max_emails == -1:
            return True, {"current": current_sent, "limit": -1, "available": -1}
            
        can_send = (current_sent + additional_count) <= max_emails
        
        return can_send, {
            "current": current_sent,
            "limit": max_emails,
            "available": max(0, max_emails - current_sent),
            "requested": additional_count
        }

    @staticmethod
    def has_feature(tenant_id: str, feature_name: str) -> bool:
        """Check if the tenant's plan includes a specific feature."""
        plan_details = PlanService.get_tenant_plan_details(tenant_id)
        features = plan_details["plan"].get("features", {})
        return features.get(feature_name, False)
