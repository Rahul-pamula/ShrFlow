import json
import logging
import os
# pyrefly: ignore [missing-import]
import aio_pika
from datetime import datetime, timezone
from typing import Optional

# Setup logger
logger = logging.getLogger("email_service")
# Ensure debug logs are captured
logger.setLevel(logging.DEBUG)

# RabbitMQ Configuration
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
EXCHANGE_NAME = "central_system_exchange"
QUEUE_NAME = "central_system_events"
ROUTING_KEY = "email.system"

# Global connection state to avoid re-connecting every time
_connection: Optional[aio_pika.RobustConnection] = None
_channel: Optional[aio_pika.RobustChannel] = None

# --- Link Configuration ---
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")

async def _get_channel() -> aio_pika.RobustChannel:
    """Singleton channel manager."""
    global _connection, _channel
    if _connection is None or _connection.is_closed:
        print("DEBUG: Connecting to RabbitMQ...", flush=True)
        _connection = await aio_pika.connect_robust(RABBITMQ_URL)
    
    if _channel is None or _channel.is_closed:
        print("DEBUG: Opening RabbitMQ channel...", flush=True)
        _channel = await _connection.channel()
        # Quality of Service: prefetch 10 messages
        await _channel.set_qos(prefetch_count=10)
        
    return _channel

async def publish_system_email(task_type: str, to_email: str, data: dict) -> bool:
    """Push an email payload to RabbitMQ instantly, returning True immediately."""
    print(f"DEBUG: publish_system_email called for {to_email} (Type: {task_type})", flush=True)
    try:
        print(f"DEBUG: [EMAIL QUEUE] Attempting to publish {task_type} to {to_email}", flush=True)
        channel = await _get_channel()
        print("DEBUG: [EMAIL QUEUE] Channel acquired", flush=True)
        
        # Bypass Pyre Type Errors dynamically
        declare_exchange_func = getattr(channel, "declare_exchange")
        exchange = await declare_exchange_func(EXCHANGE_NAME, aio_pika.ExchangeType.DIRECT, durable=True)
        print(f"DEBUG: [EMAIL QUEUE] Exchange {EXCHANGE_NAME} declared", flush=True)
        
        # Declare the Dead Letter Exchange (DLX) first
        dlx_exchange = await channel.declare_exchange("dlq_exchange", aio_pika.ExchangeType.DIRECT, durable=True)
        
        declare_queue_func = getattr(channel, "declare_queue")
        queue = await declare_queue_func(
            QUEUE_NAME, 
            durable=True,
            arguments={
                "x-dead-letter-exchange": "dlq_exchange",
                "x-dead-letter-routing-key": "email.dead"
            }
        )
        print(f"DEBUG: [EMAIL QUEUE] Queue {QUEUE_NAME} declared", flush=True)
        
        bind_func = getattr(queue, "bind")
        await bind_func(exchange, routing_key=ROUTING_KEY)
        print("DEBUG: [EMAIL QUEUE] Queue bound to exchange", flush=True)

        message_body = json.dumps({
            "type": task_type,
            "to_email": to_email,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        publish_func = getattr(exchange, "publish")
        await publish_func(
            aio_pika.Message(
                body=message_body.encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            ),
            routing_key=ROUTING_KEY
        )
        print(f"DEBUG: [EMAIL QUEUE] Published {task_type} for {to_email}", flush=True)
        return True

    except Exception as e:
        print(f"DEBUG: [EMAIL QUEUE ERROR] Failed to publish: {str(e)}", flush=True)
        logger.exception(f"Failed to publish system email to {to_email}")
        return False

async def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Send a 6-digit OTP for email verification."""
    print(f"DEBUG: send_otp_email called for {to_email} with code {otp_code}", flush=True)
    return await publish_system_email("verify_otp", to_email, {"otp_code": otp_code})

async def send_welcome_email(to_email: str, full_name: str) -> bool:
    """Send a welcome email after registration/verification."""
    return await publish_system_email("welcome", to_email, {"full_name": full_name})

async def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """Send a password reset link."""
    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    return await publish_system_email("password_reset", to_email, {
        "reset_token": reset_token,
        "reset_url": reset_url
    })

async def send_team_invite(to_email: str, inviter_name: str, workspace_name: str, token: str) -> bool:
    """Send a team invitation email."""
    invite_url = f"{FRONTEND_URL}/team/join?token={token}"
    return await publish_system_email("team_invite", to_email, {
        "inviter_name": inviter_name,
        "workspace_name": workspace_name,
        "token": token,
        "invite_url": invite_url
    })

async def send_raw_html(to_email: str, subject: str, html_content: str) -> bool:
    """Send raw HTML content (used for test emails)."""
    return await publish_system_email("raw_html", to_email, {
        "subject": subject,
        "html_content": html_content
    })

async def send_campaign_review_notification(
    to_email: str, 
    creator_name: str, 
    campaign_name: str, 
    campaign_id: str, 
    creator_role: str, 
    workspace_name: str
) -> bool:
    """Notify admins that a campaign needs review."""
    review_url = f"{FRONTEND_URL}/campaigns/{campaign_id}/review"
    return await publish_system_email("campaign_review", to_email, {
        "creator_name": creator_name,
        "campaign_name": campaign_name,
        "campaign_id": campaign_id,
        "creator_role": creator_role,
        "workspace_name": workspace_name,
        "review_url": review_url
    })

async def send_sender_verification(to_email: str, token: str) -> bool:
    """Send a verification email for a new sender identity."""
    verify_url = f"{FRONTEND_URL}/infrastructure?verify_token={token}"
    return await publish_system_email("sender_verification", to_email, {
        "token": token,
        "verify_url": verify_url
    })

async def send_access_request_notification(to_email: str, requester_email: str, workspace_name: str) -> bool:
    """Notify owner of an access request."""
    admin_url = f"{FRONTEND_URL}/team/requests"
    return await publish_system_email("access_request", to_email, {
        "requester_email": requester_email,
        "workspace_name": workspace_name,
        "admin_url": admin_url
    })

async def send_email_verification(to_email: str, verify_token: str) -> bool:
    """Send a verification email during signup or password reset flow."""
    verify_url = f"{FRONTEND_URL}/verify-email?token={verify_token}"
    return await publish_system_email("verify_email", to_email, {
        "verify_token": verify_token,
        "verify_url": verify_url
    })

async def send_franchise_request_email(
    to_email: str, 
    requester_email: str, 
    domain_name: str, 
    request_id: str, 
    token: str,
    requested_workspace_name: Optional[str] = None
) -> bool:
    """Notify domain owner of a new franchise request."""
    # API URL for direct actions, Frontend URL for dashboard view
    API_URL = os.getenv("API_URL", "http://localhost:8000").rstrip("/")
    approve_url = f"{API_URL}/team/franchise-requests/{request_id}/approve?token={token}"
    reject_url = f"{API_URL}/team/franchise-requests/{request_id}/reject?token={token}"
    dashboard_url = f"{FRONTEND_URL}/settings/franchises"
    
    return await publish_system_email("franchise_request", to_email, {
        "requester_email": requester_email,
        "domain_name": domain_name,
        "approve_url": approve_url,
        "reject_url": reject_url,
        "dashboard_url": dashboard_url,
        "requested_workspace_name": requested_workspace_name or f"{domain_name} Franchise"
    })
