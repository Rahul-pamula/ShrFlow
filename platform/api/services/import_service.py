"""
Import Service
Handles async CSV import processing, called via FastAPI BackgroundTasks.
Runs inside the API process — no separate worker required.
"""
import asyncio
import json
import logging

from services.contact_service import ContactService
from utils.supabase_client import db

logger = logging.getLogger("email_engine.import")


async def process_csv_import(
    job_id: str,
    tenant_id: str,
    batch_id: str,
    contacts: list,
) -> None:
    """
    Process a CSV import job entirely inside the API process.
    Progress is streamed to the `jobs` table so the frontend can poll.
    """
    # ── Deduplicate within the uploaded file ──────────────────────────────
    seen: set = set()
    unique_contacts = []
    for c in contacts:
        email = (c.get("email") or "").strip().lower()
        if not email or email in seen:
            continue
        seen.add(email)
        unique_contacts.append(c)

    total = len(unique_contacts)
    skipped_duplicates = len(contacts) - total

    logger.info(
        f"[{job_id}] CSV import started: {total} unique contacts "
        f"({skipped_duplicates} in-file duplicates skipped)."
    )

    # ── Mark job as processing ────────────────────────────────────────────
    db.client.table("jobs").update({
        "status": "processing",
        "progress": 0,
        "total_items": total,
        "updated_at": "now()",
    }).eq("id", job_id).execute()

    # ── Process in chunks so the UI sees incremental progress ────────────
    chunk_size = 50
    success = 0
    failed = 0
    total_new = 0
    total_updated = 0
    total_skipped_dup = skipped_duplicates
    errors = []

    for i in range(0, total, chunk_size):
        chunk = unique_contacts[i: i + chunk_size]
        try:
            res = ContactService.bulk_upsert(tenant_id, chunk, import_batch_id=batch_id)
            success          += res.get("success", 0)
            failed           += res.get("failed", 0)
            total_new        += res.get("new", 0) or 0
            total_updated    += res.get("updated", 0) or 0
            total_skipped_dup += res.get("skipped_duplicates", 0) or 0
            errors.extend(res.get("errors", []))
        except Exception as e:
            failed += len(chunk)
            errors.append({"error": str(e), "chunk": "batch failure"})

        # Stream progress to DB
        processed = min(i + chunk_size, total)
        progress = int((processed / total) * 100) if total else 100
        db.client.table("jobs").update({
            "progress": progress,
            "processed_items": processed,
            "updated_at": "now()",
        }).eq("id", job_id).execute()

        # Yield to the event loop so the API stays responsive
        await asyncio.sleep(0.05)

    # ── Finalise job ──────────────────────────────────────────────────────
    batch_status = "completed" if (success > 0 or failed == 0) else "failed"

    db.client.table("jobs").update({
        "status": batch_status,
        "progress": 100,
        "processed_items": total,
        "failed_items": failed,
        "error_log": json.dumps(errors[:50]),
        "updated_at": "now()",
    }).eq("id", job_id).execute()

    # ── Finalise batch record ─────────────────────────────────────────────
    db.client.table("import_batches").update({
        "imported_count": success,
        "failed_count": failed,
        "errors": json.dumps(errors),
        "status": batch_status,
    }).eq("id", batch_id).eq("tenant_id", tenant_id).execute()

    logger.info(f"[{job_id}] CSV import finished: {success} ok, {failed} failed.")
