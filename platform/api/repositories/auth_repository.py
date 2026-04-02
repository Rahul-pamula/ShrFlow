"""
Auth Repository Layer
Phase 7.6 — Repository Architecture

Isolates all raw DB interactions related to tenant provisioning,
join requests, email verification tokens, and workspace management.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone


class AuthRepository:
    def __init__(self, db_client):
        self.db = db_client

    # ── Tenants ─────────────────────────────────────────────────────────────

    def get_tenant_by_id(self, tenant_id: str) -> Optional[Dict[str, Any]]:
        result = self.db.table("tenants").select("*").eq("id", tenant_id).execute()
        return result.data[0] if result.data else None

    def create_tenant(self, tenant_data: Dict[str, Any]) -> None:
        self.db.table("tenants").insert(tenant_data).execute()

    def get_tenant_user_link(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Return the primary (oldest) workspace a user belongs to."""
        result = (
            self.db.table("tenant_users")
            .select("tenant_id, role, isolation_model")
            .eq("user_id", user_id)
            .order("joined_at")
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def get_tenant_user_by_tenant(self, user_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
        result = (
            self.db.table("tenant_users")
            .select("role, isolation_model")
            .eq("user_id", user_id)
            .eq("tenant_id", tenant_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def create_tenant_user(self, tenant_user_data: Dict[str, Any]) -> None:
        self.db.table("tenant_users").insert(tenant_user_data).execute()

    def get_all_tenant_workspaces(self, user_id: str) -> List[Dict[str, Any]]:
        result = (
            self.db.table("tenant_users")
            .select("tenant_id, role, isolation_model")
            .eq("user_id", user_id)
            .execute()
        )
        return result.data or []

    def get_tenants_by_ids(self, tenant_ids: List[str]) -> List[Dict[str, Any]]:
        result = self.db.table("tenants").select("id, company_name, status").in_("id", tenant_ids).execute()
        return result.data or []

    # ── Onboarding ──────────────────────────────────────────────────────────

    def create_onboarding_progress(self, tenant_id: str) -> None:
        self.db.table("onboarding_progress").insert({
            "tenant_id": tenant_id,
            "stage_basic_info": False,
            "stage_compliance": False,
            "stage_intent": False,
            "started_at": datetime.now(timezone.utc).isoformat()
        }).execute()

    # ── Join Requests ────────────────────────────────────────────────────────

    def get_join_request(self, user_id: str) -> Optional[Dict[str, Any]]:
        result = (
            self.db.table("join_requests")
            .select("tenant_id, status")
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def create_join_request(self, user_id: str, tenant_id: str) -> None:
        self.db.table("join_requests").insert({
            "user_id": user_id,
            "tenant_id": tenant_id,
            "status": "pending",
            "risk_score": "Low Risk"
        }).execute()

    # ── Team Invitations ─────────────────────────────────────────────────────

    def get_pending_invite(self, email: str) -> Optional[Dict[str, Any]]:
        result = (
            self.db.table("team_invitations")
            .select("tenant_id")
            .eq("email", email)
            .execute()
        )
        return result.data[0] if result.data else None

    # ── Email Verification Tokens ─────────────────────────────────────────────

    def create_email_verification_token(self, user_id: str, token: str, expires_at: str) -> None:
        self.db.table("email_verification_tokens").insert({
            "user_id": user_id,
            "token": token,
            "expires_at": expires_at,
        }).execute()

    # ── Domains (Enterprise JIT) ──────────────────────────────────────────────

    def get_verified_domain_tenant(self, domain: str) -> Optional[str]:
        res = (
            self.db.table("domains")
            .select("tenant_id")
            .eq("domain_name", domain)
            .eq("status", "verified")
            .execute()
        )
        if res.data:
            return res.data[0]["tenant_id"]
        return None

    # ── Workspace owners (for JIT notification) ───────────────────────────────

    def get_workspace_owner_ids(self, tenant_id: str) -> List[str]:
        res = (
            self.db.table("tenant_users")
            .select("user_id")
            .eq("tenant_id", tenant_id)
            .in_("role", ["owner", "admin"])
            .execute()
        )
        return [r["user_id"] for r in (res.data or [])]

    def get_users_emails_by_ids(self, user_ids: List[str]) -> List[str]:
        res = self.db.table("users").select("email").in_("id", user_ids).execute()
        return [u["email"] for u in (res.data or []) if u.get("email")]

    # ── Rollback helpers ──────────────────────────────────────────────────────

    def hard_delete_user(self, user_id: str) -> None:
        """Emergency rollback only — delete user if provisioning fails mid-way."""
        self.db.table("tenant_users").delete().eq("user_id", user_id).execute()
        self.db.table("users").delete().eq("id", user_id).execute()

    def hard_delete_tenant(self, tenant_id: str) -> None:
        """Emergency rollback only."""
        self.db.table("tenants").delete().eq("id", tenant_id).execute()
