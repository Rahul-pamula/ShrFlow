import asyncio
import aio_pika
import json
import logging
import os
import ssl
import csv
import io
import time
from dotenv import load_dotenv

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))
from services.contact_service import ContactService
from utils.supabase_client import db
from utils.file_parser import parse_file

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] ImportWorker: %(message)s")
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")
EXCHANGE_NAME = "background_exchange"
QUEUE_NAME = os.getenv("IMPORT_QUEUE_NAME", "import_tasks")

# SSL context for RabbitMQ
_SKIP_TLS = os.getenv("AMQP_SKIP_TLS_VERIFY", "false").lower() == "true"
ssl_context = ssl.create_default_context()
if _SKIP_TLS:
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

async def process_contact_import(payload: dict):
    """
    The robust streaming importer.
    Reads directly from S3, parses in chunks, writes to DB, stores failures.
    """
    job_id = payload["job_id"]
    tenant_id = payload["tenant_id"]
    project_id = payload.get("project_id")
    file_key = payload["file_key"]
    email_col = payload.get("email_col", "email")
    first_name_col = payload.get("first_name_col")
    last_name_col = payload.get("last_name_col")
    custom_mappings = payload.get("custom_mappings", {})

    def get_val(row_dict, col_name):
        """Helper for case-insensitive and whitespace-flexible header mapping."""
        if not col_name: return ""
        # 1. Exact match
        if col_name in row_dict: return row_dict[col_name]
        # 2. Case-insensitive/stripped match
        target = str(col_name).lower().strip()
        for k, v in row_dict.items():
            if str(k).lower().strip() == target:
                return v
        return ""

    logger.info(f"[{job_id}] Starting Robust Contact Import pipeline")

    try:
        # Update Job Status
        db.client.table("import_jobs").update({"status": "processing"}).eq("id", job_id).execute()

        # ── Download file from Supabase Storage ──────────────────────────────
        # The file was uploaded via Supabase signed URL (not boto3).
        # We must use the Supabase Storage SDK to download it — boto3 won't work here.
        logger.info(f"[{job_id}] Downloading file from Supabase Storage: {file_key}")
        try:
            file_bytes = db.client.storage.from_("imports").download(file_key)
        except Exception as dl_err:
            raise Exception(f"Failed to download file from storage: {dl_err}")

        # ── Detect format and parse with Shared Logic ────────────────────────
        # We use the same 'parse_file' logic as the UI preview to ensure 
        # that ghost rows are removed and headers are detected robustly.
        logger.info(f"[{job_id}] Parsing file for processing...")
        df = parse_file(file_bytes, file_key)
        
        # Convert DataFrame to list of dictionaries and handle NaN values for JSON compliance
        df = df.replace({float('nan'): None})
        raw_rows = df.to_dict(orient="records")
        total_rows_actual = len(raw_rows)
        logger.info(f"[{job_id}] Parsed {total_rows_actual} valid data rows (stripped ghost rows)")

        # Estimate total rows from job record
        job_record = db.client.table("import_jobs").select("total_rows").eq("id", job_id).execute()
        total_rows_est = job_record.data[0]["total_rows"] if job_record.data else 0


        chunk_size = 500
        chunk = []
        rejections_buffer = []
        
        processed_rows = 0
        failed_rows = 0
        imported_rows = 0
        errors_for_ui = []
        
        for row_index, row in enumerate(raw_rows, start=1):
            raw_email = get_val(row, email_col)
            normalized_email = str(raw_email).strip().lower() if raw_email else ""

            if not normalized_email:
                # Blank email, consider it a failure/skipped row
                failed_rows += 1
                msg = "Missing or blank email address."
                errors_for_ui.append({
                    "email": "—",
                    "reason": msg,
                    "row": row_index
                })
                rejections_buffer.append({
                    "job_id": job_id,
                    "row_data": row,
                    "error_reason": msg
                })
                
                # Batch rejections to prevent terminal loops
                if len(rejections_buffer) >= chunk_size:
                    db.client.table("import_rejected_rows").insert(rejections_buffer).execute()
                    rejections_buffer = []
                continue
            
            custom_data = {}
            if custom_mappings:
                for custom_key, csv_col_name in custom_mappings.items():
                    val = get_val(row, csv_col_name)
                    if str(val).strip():
                        custom_data[custom_key] = str(val).strip()

            contact = {
                "email": normalized_email,
                "email_domain": ContactService.extract_email_domain(normalized_email),
                "first_name": str(get_val(row, first_name_col)).strip() if first_name_col else "",
                "last_name": str(get_val(row, last_name_col)).strip() if last_name_col else "",
                "custom_fields": custom_data,
                "tenant_id": tenant_id
            }
            
            processed_rows += 1
            chunk.append((row_index, contact, row))
            
            if len(chunk) >= chunk_size:
                imported, current_failed, current_errors = await submit_chunk(tenant_id, chunk, job_id)
                imported_rows += imported
                failed_rows += current_failed
                errors_for_ui.extend(current_errors)
                chunk = []
                
                # Update progress
                db.client.table("import_jobs").update({
                    "processed_rows": imported_rows,
                    "failed_rows": failed_rows,
                }).eq("id", job_id).execute()

        # Push last remaining chunk
        if chunk:
            imported, current_failed, current_errors = await submit_chunk(tenant_id, chunk, job_id)
            imported_rows += imported
            failed_rows += current_failed
            errors_for_ui.extend(current_errors)
        
        if rejections_buffer:
            db.client.table("import_rejected_rows").insert(rejections_buffer).execute()

        # Final Update
        total_processed = imported_rows + failed_rows
        db.client.table("import_jobs").update({
            "status": "completed",
            "processed_rows": total_processed,
            "failed_rows": failed_rows
        }).eq("id", job_id).execute()

        # Update the Batch History table (Legacy 'import_batches')
        # This is where the UI History tab gets its data.
        # We NO LONGER use 'meta' column (it doesn't exist).
        try:
            db.client.table("import_batches").update({
                "status": "completed",
                "imported_count": imported_rows,
                "failed_count": failed_rows,
                "total_rows": total_processed,
                "errors": errors_for_ui[:200] # Store first 200 for UI
            }).eq("id", job_id).execute()
        except Exception as batch_err:
            logger.warning(f"Failed to update import_batches history: {batch_err}")
        
        logger.info(f"[{job_id}] Import Finished! Processed={total_processed}, Success={imported_rows}, Failed={failed_rows}")

        # Clean up: remove file from Supabase Storage after successful import
        try:
            db.client.storage.from_("imports").remove([file_key])
            logger.info(f"[{job_id}] Cleaned up storage file: {file_key}")
        except Exception as cleanup_err:
            logger.warning(f"[{job_id}] Storage cleanup failed (non-critical): {cleanup_err}")

    except Exception as e:
        logger.error(f"[{job_id}] Fatal Error processing file: {str(e)}")
        db.client.table("import_jobs").update({
            "status": "failed",
            "error_message": f"Worker crash: {str(e)}"
        }).eq("id", job_id).execute()

async def submit_chunk(tenant_id: str, chunk: list, job_id: str) -> tuple[int, int, list]:
    """
    Submits a bulk insert and returns (success_count, failed_count, errors_for_ui).
    Logs rejected rows to import_rejected_rows.
    """
    contacts = [item[1] for item in chunk]
    errors_for_ui = []
    
    try:
        # We reuse the ContactService bulk logic which handles duplicates properly
        res = ContactService.bulk_upsert(tenant_id, contacts, import_batch_id=job_id)
        
        # If there are specific errors returned by bulk_upsert, let's log them
        errors = res.get("errors", [])
        if errors:
            rejection_records = []
            for err in errors:
                reason = err.get("reason", "Unknown bulk upsert error") if isinstance(err, dict) else str(err)
                row_raw = err.get("raw", {}) if isinstance(err, dict) else {}
                
                # Format for UI
                errors_for_ui.append({
                    "email": row_raw.get("email", "Unknown"),
                    "reason": reason,
                    "row": "—" # We don't have the original row index easily here
                })

                rejection_records.append({
                    "job_id": job_id,
                    "row_data": err if isinstance(err, dict) else {"raw": str(err)},
                    "error_reason": reason
                })
            db.client.table("import_rejected_rows").insert(rejection_records).execute()

        imported = res.get("success", 0) + res.get("skipped_duplicates", 0)
        failed = res.get("failed", 0)
        return imported, failed, errors_for_ui
    except Exception as e:
        logger.error(f"Chunk failure: {e}")
        # Insert all rows in chunk as failed
        error_records = []
        for (idx, _, raw) in chunk:
            msg = f"Chunk completely failed: {str(e)}"
            errors_for_ui.append({
                "email": raw.get("email", "Unknown"),
                "reason": msg,
                "row": idx
            })
            error_records.append({
                "job_id": job_id,
                "row_data": raw if isinstance(raw, dict) else {"raw": str(raw)},
                "error_reason": msg
            })
        db.client.table("import_rejected_rows").insert(error_records).execute()
        
        return 0, len(chunk), errors_for_ui

async def process_message(message: aio_pika.abc.AbstractIncomingMessage):
    async with message.process(ignore_processed=True):
        try:
            payload = json.loads(message.body.decode())
            task_type = payload.get("task_type")
            
            if task_type == "contact_import":
                await process_contact_import(payload)
                await message.ack()
            else:
                # Let other workers handle it, but wait: since we share a queue, 
                # rejecting without requeueing drops it!
                # If we share the queue with background_worker, we MUST reject WITH requeue?
                # No, standard practice is separate queues if logic is separate.
                # However, they both listen to task.process routing key.
                logger.warning(f"Ignoring task: {task_type}")
                await message.reject(requeue=True)
                
        except Exception as e:
            logger.error(f"Error processing import task: {e}")
            if not message.processed:
                await message.nack(requeue=False) # Dead letter

async def main():
    logger.info("Starting Dedicated Import Worker...")
    connection = await aio_pika.connect_robust(RABBITMQ_URL, ssl=ssl_context)
    
    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        
        exchange = await channel.declare_exchange(EXCHANGE_NAME, aio_pika.ExchangeType.DIRECT, durable=True)
        # Dedicated queue might be better to avoid conflict with legacy worker
        queue = await channel.declare_queue(QUEUE_NAME, durable=True)
        await queue.bind(exchange, routing_key="task.import")
        
        logger.info(f"Worker connected and waiting on queue '{QUEUE_NAME}'...")
        await queue.consume(process_message)
        
        try:
            await asyncio.Future()
        except asyncio.CancelledError:
            pass

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker stopped manually.")
