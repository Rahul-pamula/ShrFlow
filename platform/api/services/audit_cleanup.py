"""
Audit Log Cleanup Service
Phase 1.5 — Lifecycle Management

Responsible for purging expired audit logs based on the `expires_at` field.
This script is designed to be run as a background task (e.g. via Celery or Cron).
"""
import logging
from datetime import datetime, timezone
from utils.supabase_client import db

logger = logging.getLogger("audit_cleanup")

async def purge_expired_logs() -> int:
    """
    Finds and deletes audit logs that have passed their retention period.
    Returns the number of logs purged.
    """
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Identify logs that are expired
        # Note: We use the 'expires_at' field added in the lifecycle strategy
        res = db.client.table("audit_logs")\
            .delete()\
            .lt("expires_at", now_iso)\
            .execute()
        
        purged_count = len(res.data) if res.data else 0
        
        if purged_count > 0:
            logger.info(f"Successfully purged {purged_count} expired audit logs.")
        
        return purged_count

    except Exception as e:
        logger.error(f"Failed to purge expired audit logs: {e}")
        return 0

if __name__ == "__main__":
    import asyncio
    asyncio.run(purge_expired_logs())
