import asyncio
import aio_pika
import json
import logging
import os
import ssl
from dotenv import load_dotenv

# We need the API's services to reuse the ContactService logic
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))
from services.contact_service import ContactService
from utils.supabase_client import db

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] BG_Worker: %(message)s")
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")
EXCHANGE_NAME = "background_exchange"
QUEUE_NAME = "background_tasks"

# Fix: macOS Python 3.13 SSL — bypass cert verification for CloudAMQP
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

async def process_csv_import(job_id: str, tenant_id: str, batch_id: str, contacts: list):
    """Processes a CSV import batch and streams progress to DB."""
    total = len(contacts)
    logger.info(f"[{job_id}] Started CSV import with {total} contacts.")
    
    # Update Job status to processing
    db.client.table("jobs").update({
        "status": "processing",
        "progress": 0,
        "updated_at": "now()"
    }).eq("id", job_id).execute()

    # Process in chunks of 50 to update UI progress quickly
    chunk_size = 50
    success = 0
    failed = 0
    errors = []

    for i in range(0, total, chunk_size):
        chunk = contacts[i:i+chunk_size]
        
        # We mimic `ContactService.bulk_upsert` logic directly here to count successes safely
        # since bulk_upsert does all-at-once. For a really large file, streaming is better.
        try:
            res = ContactService.bulk_upsert(tenant_id, chunk, import_batch_id=batch_id)
            success += res.get("success", 0)
            failed += res.get("failed", 0)
            errors.extend(res.get("errors", []))
        except Exception as e:
            failed += len(chunk)
            errors.append({"error": str(e), "chunk": "batch failure"})

        # Calculate and update progress
        processed = min(i + chunk_size, total)
        progress = int((processed / total) * 100)
        
        db.client.table("jobs").update({
            "progress": progress,
            "processed_items": processed,
            "updated_at": "now()"
        }).eq("id", job_id).execute()
        
        # Tiny sleep to ensure DB syncs and UI can poll progress
        await asyncio.sleep(0.05)

    # Wrap up Job
    batch_status = "completed" if success > 0 or failed == 0 else "failed"
    db.client.table("jobs").update({
        "status": batch_status,
        "progress": 100,
        "processed_items": total,
        "failed_items": failed,
        "error_log": json.dumps(errors[:50]),  # Store top 50 errors only
        "updated_at": "now()"
    }).eq("id", job_id).execute()

    # Update Batch record
    db.client.table("import_batches").update({
        "imported_count": success,
        "failed_count": failed,
        "errors": json.dumps(errors),
        "status": batch_status
    }).eq("id", batch_id).eq("tenant_id", tenant_id).execute()

    logger.info(f"[{job_id}] Finished CSV import: {success} ok, {failed} failed.")

async def process_message(message: aio_pika.abc.AbstractIncomingMessage):
    async with message.process(ignore_processed=True):
        try:
            payload = json.loads(message.body.decode())
            task_type = payload.get("task_type")
            job_id = payload.get("job_id")
            
            if task_type == "csv_import":
                await process_csv_import(
                    job_id=job_id,
                    tenant_id=payload.get("tenant_id"),
                    batch_id=payload.get("batch_id"),
                    contacts=payload.get("contacts", [])
                )
            else:
                logger.warning(f"Unknown task type: {task_type}")
                
            await message.ack()
        except Exception as e:
            logger.error(f"Error processing background task: {e}")
            if not message.processed:
                await message.nack(requeue=False)

async def main():
    logger.info("Starting Background Jobs Worker...")
    connection = await aio_pika.connect_robust(RABBITMQ_URL, ssl=ssl_context)
    
    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        
        exchange = await channel.declare_exchange(EXCHANGE_NAME, aio_pika.ExchangeType.DIRECT, durable=True)
        queue = await channel.declare_queue(QUEUE_NAME, durable=True)
        await queue.bind(exchange, routing_key="task.process")
        
        logger.info(f"Listening on queue {QUEUE_NAME}...")
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
