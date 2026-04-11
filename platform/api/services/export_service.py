"""
Export Service
Handles async CSV export processing, called via FastAPI BackgroundTasks.
"""
import asyncio
import logging

from services.contact_service import ContactService
from utils.supabase_client import db

logger = logging.getLogger("email_engine.export")

async def process_csv_export(job_id: str, tenant_id: str, batch_id: str = None) -> None:
    """
    Process a CSV export job inside the API process.
    Updates the `jobs` table with progress and finally sets the result URL.
    """
    logger.info(f"[{job_id}] CSV export started for tenant {tenant_id}")

    # Mark job as processing
    db.client.table("jobs").update({
        "status": "processing",
        "progress": 10,
        "updated_at": "now()",
    }).eq("id", job_id).execute()

    try:
        # Yield to allow HTTP response to return
        await asyncio.sleep(0.1)

        import gzip
        
        # 1. Fetch CSV data
        csv_data = ContactService.export_contacts(tenant_id, batch_id=batch_id)
        
        # 2. Compress the data with gzip
        csv_bytes = gzip.compress(csv_data.encode('utf-8'))

        db.client.table("jobs").update({
            "progress": 50,
            "updated_at": "now()",
        }).eq("id", job_id).execute()

        # 3. Ensure bucket exists
        try:
            db.client.storage.get_bucket("exports")
        except Exception:
            try:
                db.client.storage.create_bucket("exports", public=False)
            except Exception as e:
                logger.warning(f"Bucket exports might already exist or failed to create: {e}")

        # 4. Upload to Supabase Storage as .gz
        file_name = f"{tenant_id}/export_batch_{batch_id}_{job_id}.csv.gz" if batch_id else f"{tenant_id}/export_{job_id}.csv.gz"
        
        res = db.client.storage.from_("exports").upload(
            file_name, 
            csv_bytes,
            {"content-type": "application/gzip", "upsert": "true"}
        )

        db.client.table("jobs").update({
            "progress": 80,
            "updated_at": "now()",
        }).eq("id", job_id).execute()

        # 4. Create signed URL valid for 24 hours (86400 seconds)
        signed_url_res = db.client.storage.from_("exports").create_signed_url(file_name, 86400)
        
        # signed_url_res contains {'signedURL': '...'}
        download_url = signed_url_res.get("signedURL") or signed_url_res.get("signedUrl")
        
        if not download_url:
            raise Exception("Failed to generate signed URL")

        # 5. Finalise job with the URL stored in error_log for simplicity
        import json
        db.client.table("jobs").update({
            "status": "completed",
            "progress": 100,
            "error_log": json.dumps({"result_url": download_url}),
            "updated_at": "now()",
        }).eq("id", job_id).execute()

        logger.info(f"[{job_id}] CSV export finished successfully.")

    except Exception as e:
        logger.error(f"[{job_id}] CSV export failed: {e}")
        import json
        db.client.table("jobs").update({
            "status": "failed",
            "progress": 100,
            "error_log": json.dumps([{"error": str(e)}]),
            "updated_at": "now()",
        }).eq("id", job_id).execute()
    finally:
        try:
            from utils.redis_client import redis_client
            await redis_client.client.delete(f"tenant:{tenant_id}:export_running")
        except Exception as e:
            logger.error(f"Failed to clear export lock: {e}")
