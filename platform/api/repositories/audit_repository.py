"""
Audit Repository Layer
Phase 7.6 — Repository Architecture

Responsible for writing to the append-only `audit_logs` table.
All writes are INSERT-only. The PostgreSQL trigger (migration 031)
physically blocks UPDATE and DELETE at the DB level.

PRIVACY RULE: Never log PII (email body content, passwords, CSV data).
Only log metadata: who did what, when, on which record.
"""
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("audit_repository")


class AuditRepository:
    def __init__(self, db_client):
        self.db = db_client

    def insert_log(
        self,
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
        Append-only write to audit_logs.
        
        This is the ONLY way audit events should be persisted.
        No other code should call db.client.table('audit_logs') directly.
        
        Sanitization: metadata is passed directly as a dict (Supabase
        handles JSONB serialization). Ensure callers never embed raw
        user input strings without key/value scoping.
        """
        try:
            log_entry = {
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "action": action,  # e.g. "auth.login", "campaign.send"
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

            # Optional fields — only set if provided
            if user_id:
                log_entry["user_id"] = user_id
            if resource_type:
                log_entry["resource_type"] = resource_type
            if resource_id:
                log_entry["resource_id"] = resource_id
            if metadata:
                # Sanitize: ensure metadata is a plain dict, not arbitrary objects
                log_entry["metadata"] = {
                    str(k): str(v) if not isinstance(v, (dict, list, int, float, bool)) else v
                    for k, v in metadata.items()
                }
            if ip_address:
                log_entry["ip_address"] = ip_address
            if user_agent:
                # Truncate user-agent to prevent bloat
                log_entry["user_agent"] = str(user_agent)[:512]

            self.db.table("audit_logs").insert(log_entry).execute()

        except Exception as e:
            # Audit log failures MUST NOT crash the main application.
            # The trigger prevents corruption; we catch application errors silently.
            logger.error(f"[AUDIT LOG ERROR] Failed to write audit log (action={action}): {e}")
