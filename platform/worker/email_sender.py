import asyncio
import os
import logging
import ssl
import httpx
import aio_pika
import redis.asyncio as redis
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

from handlers.email_handler import EmailHandler

# SSL context for RabbitMQ (amqps://) connections
_SKIP_TLS = os.getenv("AMQP_SKIP_TLS_VERIFY", "false").lower() == "true"
ssl_context = ssl.create_default_context()
if _SKIP_TLS:
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    import logging as _log; _log.getLogger("email_engine").warning(
        "⚠️  AMQP_SKIP_TLS_VERIFY=true — TLS cert verification DISABLED (dev-only mode)"
    )

# Load environment variables from repo root
ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ROOT_ENV, override=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] Worker: %(message)s")
logger = logging.getLogger(__name__)

# --- Configuration ---
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")
PREFETCH_COUNT = int(os.getenv("WORKER_PREFETCH_COUNT", "10"))
MAX_RETRIES = int(os.getenv("WORKER_MAX_RETRIES", "3"))
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
UNSUB_SECRET = os.getenv("UNSUBSCRIBE_SECRET", "dev-unsub-secret-change-in-production")
TRACKING_SECRET = os.getenv("TRACKING_SECRET", "dev-tracking-secret")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in environment")

# Initialize Clients
redis_client = redis.from_url(REDIS_URL, decode_responses=True)
db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
_http1 = httpx.Client(transport=httpx.HTTPTransport(http2=False), timeout=30.0)
db.postgrest.session = _http1

# RabbitMQ settings
EXCHANGE_NAME = "campaign_exchange"
QUEUE_NAME = "bulk_email_queue"
HOLDING_EXCHANGE = "holding_exchange"
PARKING_QUEUE = "paused_parking_queue"
TTL_MS = 60000

async def setup_queues(channel: aio_pika.robust_channel.RobustChannel) -> tuple:
    main_exchange = await channel.declare_exchange(EXCHANGE_NAME, aio_pika.ExchangeType.DIRECT, durable=True)
    main_queue = await channel.declare_queue(QUEUE_NAME, durable=True)
    await main_queue.bind(main_exchange, routing_key="email.send")
    
    holding_exchange = await channel.declare_exchange(HOLDING_EXCHANGE, aio_pika.ExchangeType.DIRECT, durable=True)
    parking_queue = await channel.declare_queue(
        PARKING_QUEUE,
        durable=True,
        arguments={
            "x-message-ttl": TTL_MS,
            "x-dead-letter-exchange": EXCHANGE_NAME,
            "x-dead-letter-routing-key": "email.send"
        }
    )
    await parking_queue.bind(holding_exchange, routing_key="campaign.paused")
    
    return main_queue, holding_exchange

async def main():
    logger.info("Starting State-Aware Email Worker...")
    connection = await aio_pika.connect_robust(RABBITMQ_URL, ssl=ssl_context)
    
    handler = EmailHandler(
        db=db,
        redis_client=redis_client,
        queue_name=QUEUE_NAME,
        max_retries=MAX_RETRIES,
        unsub_secret=UNSUB_SECRET,
        tracking_secret=TRACKING_SECRET
    )

    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=PREFETCH_COUNT)
        
        main_queue, holding_exchange = await setup_queues(channel)
        logger.info(f"Consuming from {QUEUE_NAME}. Waiting for messages...")
        
        async with main_queue.iterator() as queue_iter:
            async for message in queue_iter:
                await handler.process_message(message, holding_exchange)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker gracefully shutting down.")
