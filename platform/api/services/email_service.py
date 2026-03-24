"""
EMAIL SERVICE
Phase 1.5 — Auth Security
Handles pushing centralized transactional emails to the RabbitMQ queue (Queue-First Architecture).
"""

import os
import json
import logging
import aio_pika

logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")
QUEUE_NAME = "central_system_events"
EXCHANGE_NAME = "central_system_exchange"
APP_URL = os.getenv("APP_URL", "http://localhost:3000")

from typing import Optional, Any

# Global connection to reuse
_rabbitmq_pool: Optional[Any] = None

async def _get_channel() -> Any:
    global _rabbitmq_pool
    if _rabbitmq_pool is None or getattr(_rabbitmq_pool, "is_closed", True):
        import ssl
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        _rabbitmq_pool = await aio_pika.connect_robust(RABBITMQ_URL, ssl=ssl_context if "amqps" in RABBITMQ_URL else None)
    
    # Use getattr to bypass strict type checkers when aio_pika isn't resolved locally
    channel_coro = getattr(_rabbitmq_pool, "channel")
    return await channel_coro()


async def publish_system_email(task_type: str, to_email: str, data: dict) -> bool:
    """Push an email payload to RabbitMQ instantly, returning True immediately."""
    try:
        channel = await _get_channel()
        
        # Bypass Pyre Type Errors dynamically
        declare_exchange_func = getattr(channel, "declare_exchange")
        exchange = await declare_exchange_func(EXCHANGE_NAME, aio_pika.ExchangeType.DIRECT, durable=True)
        
        declare_queue_func = getattr(channel, "declare_queue")
        queue = await declare_queue_func(
            QUEUE_NAME, 
            durable=True,
            arguments={
                "x-dead-letter-exchange": "dlq_exchange",
                "x-dead-letter-routing-key": "email.dead"
            }
        )
        
        bind_func = getattr(queue, "bind")
        await bind_func(exchange, routing_key="email.system")

        payload = {
            "type": task_type,
            "to_email": to_email,
            "data": data
        }
        
        message = aio_pika.Message(
            body=json.dumps(payload).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT
        )
        
        await exchange.publish(message, routing_key="email.system")
        logger.info(f"[EMAIL QUEUE] Enqueued '{task_type}' email for {to_email}")
        return True
    except Exception as e:
        logger.error(f"[EMAIL QUEUE ERROR] Failed to push '{task_type}' email for {to_email}: {e}")
        return False


async def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    # Build proper urls using APP_URL just like old implementation
    reset_url = f"{APP_URL}/reset-password?token={reset_token}"
    return await publish_system_email("reset_password", to_email, {"reset_url": reset_url})


async def send_email_verification(to_email: str, verify_token: str) -> bool:
    verify_url = f"{APP_URL}/verify-email?token={verify_token}"
    return await publish_system_email("verify_email", to_email, {"verify_url": verify_url})


async def send_team_invite(to_email: str, inviter_name: str, workspace_name: str, invite_token: str) -> bool:
    invite_url = f"{APP_URL}/team/join?token={invite_token}"
    return await publish_system_email("team_invite", to_email, {
        "inviter_name": inviter_name,
        "workspace_name": workspace_name,
        "invite_url": invite_url
    })


async def send_access_request_notification(to_email: str, requester_email: str, workspace_name: str) -> bool:
    admin_url = f"{APP_URL}/settings/team/requests"
    return await publish_system_email("access_request", to_email, {
        "requester_email": requester_email,
        "workspace_name": workspace_name,
        "admin_url": admin_url
    })

async def send_sender_verification(to_email: str, token: str) -> bool:
    verify_url = f"{APP_URL}/senders/confirm?token={token}"
    return await publish_system_email("sender_verification", to_email, {"verify_url": verify_url})

async def send_raw_html(to_email: str, subject: str, html_content: str) -> bool:
    """Generic passthrough for legacy notification services and test campaigns."""
    return await publish_system_email("raw_html", to_email, {
        "subject": subject,
        "html": html_content
    })
