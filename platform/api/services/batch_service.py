"""
Batch Service Layer
Manages import batch lifecycle: creation, listing, deletion.

Batch Status Flow:
  'processing' → 'completed' (success) or 'failed' (error)
"""
import uuid
import logging
from typing import Dict, List
from utils.supabase_client import db

logger = logging.getLogger("email_engine.batches")


class BatchService:
    @staticmethod
    def create_batch(tenant_id: str, file_name: str, total_rows: int, imported_count: int) -> str:
        """
        Create a new import batch record (status = 'processing').
        Returns the generated batch_id.
        """
        batch_id = str(uuid.uuid4())

        db.client.table("import_batches").insert({
            "id": batch_id,
            "tenant_id": tenant_id,
            "file_name": file_name,
            "total_rows": total_rows,
            "imported_count": imported_count,
            "status": "processing"
        }).execute()

        return batch_id

    @staticmethod
    def list_batches(tenant_id: str) -> List[Dict]:
        """
        List all import batches for a tenant, newest first.
        """
        import json as json_lib
        result = db.client.table("import_batches")\
            .select("id, file_name, total_rows, imported_count, failed_count, errors, status, created_at")\
            .eq("tenant_id", tenant_id)\
            .order("created_at", desc=True)\
            .execute()

        batches = result.data or []
        for b in batches:
            if "errors" in b and b["errors"]:
                if isinstance(b["errors"], str):
                    try:
                        b["errors"] = json_lib.loads(b["errors"])
                    except Exception:
                        b["errors"] = []
                elif not isinstance(b["errors"], list):
                    b["errors"] = []
            else:
                b["errors"] = []
        return batches

    @staticmethod
    def delete_batch(tenant_id: str, batch_id: str) -> int:
        """
        Delete all contacts belonging to a batch, then delete the batch record.
        Returns deleted contact count.
        """
        # 1. Delete contacts with this batch_id (tenant-scoped)
        contact_result = db.client.table("contacts")\
            .delete()\
            .eq("tenant_id", tenant_id)\
            .eq("import_batch_id", batch_id)\
            .execute()

        deleted_count = len(contact_result.data) if contact_result.data else 0

        # 2. Delete the batch record itself
        db.client.table("import_batches")\
            .delete()\
            .eq("tenant_id", tenant_id)\
            .eq("id", batch_id)\
            .execute()

        logger.info(f"[BATCH_DELETED] tenant={tenant_id} batch={batch_id} contacts_removed={deleted_count}")
        return deleted_count

    @staticmethod
    def recalc_batch_counts(tenant_id: str, batch_id: str) -> None:
        """
        Recalculate imported_count for a batch from current contacts.
        Keeps failed_count/errors untouched (they reflect original import issues).
        """
        try:
            count_res = db.client.table("contacts")\
                .select("id", count="exact")\
                .eq("tenant_id", tenant_id)\
                .eq("import_batch_id", batch_id)\
                .execute()
            imported_count = count_res.count or 0
            db.client.table("import_batches")\
                .update({"imported_count": imported_count})\
                .eq("tenant_id", tenant_id)\
                .eq("id", batch_id)\
                .execute()
            logger.info(f"[BATCH_RECALC] tenant={tenant_id} batch={batch_id} imported_count={imported_count}")
        except Exception as e:
            logger.warning(f"[BATCH_RECALC_FAIL] tenant={tenant_id} batch={batch_id} error={e}")
