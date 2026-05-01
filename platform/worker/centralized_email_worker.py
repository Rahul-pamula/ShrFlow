import asyncio
import aiosmtplib
import os
import json
import logging
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from dotenv import load_dotenv
import aio_pika
from jinja2 import Environment, FileSystemLoader, select_autoescape

# Load environment variables from repo root
ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ROOT_ENV, override=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] SystemWorker: %(message)s")
logger = logging.getLogger(__name__)

# --- Configuration ---
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")
EXCHANGE_NAME = "central_system_exchange"
QUEUE_NAME = "central_system_events"
DLQ_NAME = "central_system_dlq"

# SMTP config for centralized system (Gmail)
SMTP_HOST = os.getenv("SYSTEM_SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SYSTEM_SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SYSTEM_SMTP_USERNAME", "shrmail.app@gmail.com")
SMTP_PASSWORD = os.getenv("SYSTEM_SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("SYSTEM_SMTP_FROM_EMAIL", "shrmail.app@gmail.com")
FROM_NAME = os.getenv("SYSTEM_SMTP_FROM_NAME", "ShrFlow")

# Jinja2 environment setup
TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "api" / "centralized_mail_templates"
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(['html', 'xml'])
)

# Subjects mapping based on task type
SUBJECTS = {
    "reset_password": "Reset your ShrFlow password",
    "verify_email": "Verify your ShrFlow account",
    "verify_otp": "Your Verification Code — ShrFlow",
    "team_invite": "You've been invited to join a Workspace!",
    "access_request": "Action Required: New Workspace Access Request",
    "sender_verification": "Verify your sender address — ShrFlow",
    "campaign_review": "📋 Campaign Review Requested — Action Required",
}

# SSL context for RabbitMQ (amqps://) connections
# Production: full cert verification (default). Dev: set AMQP_SKIP_TLS_VERIFY=true to bypass.
_SKIP_TLS = os.getenv("AMQP_SKIP_TLS_VERIFY", "false").lower() == "true"
ssl_context = ssl.create_default_context()
if _SKIP_TLS:
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    logger.warning("⚠️  AMQP_SKIP_TLS_VERIFY=true — TLS cert verification DISABLED (dev-only mode)")

async def setup_queues(channel: aio_pika.robust_channel.RobustChannel):
    """Declare main exchange, main queue, and DLX (Dead Letter Exchange)."""
    exchange = await channel.declare_exchange(EXCHANGE_NAME, aio_pika.ExchangeType.DIRECT, durable=True)
    
    # Declare the DLQ for unrecoverable emails
    dlq_exchange = await channel.declare_exchange("dlq_exchange", aio_pika.ExchangeType.DIRECT, durable=True)
    dlq_queue = await channel.declare_queue(DLQ_NAME, durable=True)
    await dlq_queue.bind(dlq_exchange, routing_key="email.dead")
    
    # Declare main queue with DLX arguments
    queue = await channel.declare_queue(
        QUEUE_NAME,
        durable=True,
        arguments={
            "x-dead-letter-exchange": "dlq_exchange",
            "x-dead-letter-routing-key": "email.dead"
        }
    )
    await queue.bind(exchange, routing_key="email.system")
    return queue

async def send_via_smtp(to_email: str, subject: str, html_content: str):
    """Sends the actual email via the centralized SMTP configuration."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"] = to_email

    # Very basic strip-tags for pure plain-text fallback
    import re
    plain = re.sub(r'<[^>]+>', '', html_content)
    
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    if not SMTP_PASSWORD:
        logger.warning(f"Simulating Central Mailer (No SMTP Pass set). To: {to_email}, Subject: {subject}")
        await asyncio.sleep(0.2)
        return True

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USERNAME,
        password=SMTP_PASSWORD,
        start_tls=True
    )
    return True

async def process_message(message: aio_pika.abc.AbstractIncomingMessage):
    async with message.process(ignore_processed=True):
        try:
            payload = json.loads(message.body.decode())
            task_type = payload.get("type")
            to_email = payload.get("to_email")
            data = payload.get("data", {})
            
            logger.info(f"Processing '{task_type}' email for {to_email}")
            
            if task_type == "raw_html":
                # Bypass Jinja completely for Test Campaigns & Legacy Notifications
                html_content = data.get("html", "")
                subject = data.get("subject", "Email Engine Notification")
            else:
                if task_type not in SUBJECTS:
                    raise ValueError(f"Unknown email task type: {task_type}")

                # 1. Load the corresponding Jinja template
                template_file = f"{task_type}.html"
                template = jinja_env.get_template(template_file)
                
                # 2. Render HTML safely
                html_content = template.render(**data)
                subject = SUBJECTS[task_type]
            
            # 3. Dispatch to SMTP
            await send_via_smtp(to_email, subject, html_content)
            
            logger.info(f"✅ Successfully dispatched '{task_type}' to {to_email}")
            await message.ack()

        except aiosmtplib.errors.SMTPException as smtp_err:
            logger.error(f"SMTP Error dispatching email: {smtp_err}")
            # If the header x-delivery-count goes above 3, route to DLQ
            # But for simplicity, we will just NACK with requeue=false to trigger DLQ instantly
            logger.error("Routing failed message to Dead Letter Queue (DLQ).")
            await message.nack(requeue=False)

        except Exception as e:
            logger.error(f"Critical Worker Error processing message: {e}")
            await message.nack(requeue=False)

async def main():
    logger.info("Starting Centralized System Email Worker...")
    connection = await aio_pika.connect_robust(RABBITMQ_URL, ssl=ssl_context if "amqps" in RABBITMQ_URL else None)
    
    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        
        queue = await setup_queues(channel)
        logger.info(f"Consuming from {QUEUE_NAME}. Listening for system events...")
        
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                await process_message(message)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Central System Worker gracefully shutting down.")
