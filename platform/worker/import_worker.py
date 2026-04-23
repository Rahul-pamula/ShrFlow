import asyncio
import aio_pika
import json
import logging
import os
import ssl
from dotenv import load_dotenv

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))
from utils.supabase_client import db
from handlers.import_handler import ImportHandler

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] ImportWorker: %(message)s")
logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")
EXCHANGE_NAME = "background_exchange"
IMPORT_QUEUE_NAME = os.getenv("IMPORT_QUEUE_NAME", "import_tasks_v4")
ROUTING_KEY = "task.import"

_SKIP_TLS = os.getenv("AMQP_SKIP_TLS_VERIFY", "false").lower() == "true"
ssl_context = ssl.create_default_context()
if _SKIP_TLS:
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

async def main():
    logger.info("Starting Dedicated Import Worker...")
    connection = await aio_pika.connect_robust(RABBITMQ_URL, ssl=ssl_context)
    
    handler = ImportHandler(db=db)

    async def process_message(message: aio_pika.abc.AbstractIncomingMessage):
        async with message.process(ignore_processed=True):
            try:
                payload = json.loads(message.body.decode())
                task_type = payload.get("task_type")
                
                if task_type == "contact_import":
                    await handler.process_contact_import(payload)
                    await message.ack()
                else:
                    logger.warning(f"Unknown task type for import_worker: {task_type}. Moving to DLQ.")
                    await message.nack(requeue=False)
                    
            except Exception as e:
                logger.error(f"Error processing import task: {e}")
                if not message.processed:
                    await message.nack(requeue=False)

    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        
        exchange = await channel.declare_exchange(EXCHANGE_NAME, aio_pika.ExchangeType.DIRECT, durable=True)
        queue = await channel.declare_queue(
            IMPORT_QUEUE_NAME, 
            durable=True,
            arguments={
                "x-dead-letter-exchange": "dead_letter_exchange",
                "x-dead-letter-routing-key": "task.failed"
            }
        )
        await queue.bind(exchange, routing_key="task.import")
        
        logger.info(f"Worker connected and waiting on queue '{IMPORT_QUEUE_NAME}'...")
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
