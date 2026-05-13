"""
AUDIT LOG SERVICE
Phase 1.5 / 7.6 — Auth Security + Repository Architecture

Public-facing wrapper around AuditRepository.
Any route that needs to emit an audit event calls this module.

PRIVACY RULE: Never log PII (email bodies, CSV content, passwords).
Only log metadata: who did what, when, on which record.

Supported action names (extend as needed):
    auth.login                  auth.logout          auth.signup
    auth.password_reset_request auth.password_reset_complete
    auth.captcha_blocked        auth.rate_limit_blocked
    contact.import              contact.delete       contact.restore
    campaign.create             campaign.send        campaign.pause   campaign.cancel
    template.create             template.delete
    tenant.plan_change          tenant.upgrade
"""
from typing import Optional
from datetime import datetime, timedelta, timezone
from repositories.audit_repository import AuditRepository


async def calculate_retention_expiry(tenant_id: str) -> Optional[str]:
    """Calculates the expiry timestamp for an audit log based on the tenant's plan."""
    from utils.supabase_client import db
    try:
        # Fetch tenant's plan info
        res = db.client.table("tenants").select("plan_id").eq("id", tenant_id).execute()
        plan_id = "free"
        if res.data and len(res.data) > 0:
            first_row = res.data[0]
            if isinstance(first_row, dict):
                plan_id = first_row.get("plan_id", "free")
        
        # Mapping plan_id to retention days
        # Defaulting to 7 days if unknown
        retention_map = {
            "free": 7,
            "starter": 30,
            "pro": 90,
            "enterprise": 365
        }
        
        plan_id_str = str(plan_id or "free").lower()
        days = retention_map.get(plan_id_str, 7)
        expiry = datetime.now(timezone.utc) + timedelta(days=days)
        return expiry.isoformat()
    except Exception:
        # If plan fetch fails, default to conservative 7 days
        return (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()


async def write_log(
    tenant_id: str,
    action: str,
    *,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    metadata: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    """
    Convenience wrapper — writes an immutable audit log entry.
    Also triggers automated security alerts for critical events.
    """
    from utils.supabase_client import db
    
    # Calculate expiry based on retention policy
    expires_at = await calculate_retention_expiry(tenant_id)
    
    audit_repo = AuditRepository(db.client)
    audit_repo.insert_log(
        tenant_id=tenant_id,
        action=action,
        user_id=user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        metadata=metadata,
        ip_address=ip_address,
        user_agent=user_agent,
        expires_at=expires_at
    )
    
    # [AUDIT FIX 11] Automated Security Alerting
    try:
        await _process_security_alerts(
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            metadata=metadata
        )
    except Exception:
        pass # Alerting failure should not block the main flow


async def _process_security_alerts(tenant_id: str, user_id: Optional[str], action: str, metadata: Optional[dict]) -> None:
    """Detects critical patterns in audit logs and triggers notifications."""
    from utils.notification_rules import notify_admins
    
    # 1. Critical Deletion Alert (>1000 items)
    if action in ["contact.bulk_delete", "contact.delete_all"]:
        count = (metadata or {}).get("count", 0)
        if count > 1000:
            await notify_admins(
                tenant_id=tenant_id,
                sender_id="system", # System-generated alert
                event_type="security_alert",
                title="🚨 Critical Security Alert: Bulk Deletion",
                message=f"A large bulk deletion was performed. {count:,} contacts were removed.",
                data={"action": action, "count": count, "performed_by": user_id}
            )

    # 2. Potential Compromise: Suspicious Login (Placeholder for more complex logic)
    # For now, we alert if a login occurs on a known suspicious action or high frequency.
    if action == "auth.suspicious_activity":
        reason = (metadata or {}).get("reason", "Unknown")
        await notify_admins(
            tenant_id=tenant_id,
            sender_id="system",
            event_type="security_alert",
            title="⚠️ Suspicious Activity Detected",
            message=f"Anomalous behavior detected for user session: {reason}",
            data=metadata
        )
