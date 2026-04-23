import asyncio
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import json
import logging
import httpx
import aio_pika
import uuid
import random
import hmac
import hashlib
import base64
import re

from pathlib import Path
from dotenv import load_dotenv

# Import notification service
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'api'))
from services.notification_service import notify_campaign_completed, notify_bounce_alert

logger = logging.getLogger(__name__)

def _get_api_base() -> str:
    load_dotenv(override=True)
    return os.getenv("API_URL", "http://localhost:8000")

def _get_backend_url() -> str:
    load_dotenv(override=True)
    return os.getenv("BACKEND_URL", "http://localhost:8000")

def _make_unsub_token(contact_id: str, campaign_id: str, unsub_secret: str) -> str:
    payload = f"{contact_id}:{campaign_id}"
    sig = hmac.new(unsub_secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return base64.urlsafe_b64encode(f"{payload}:{sig}".encode()).decode()

def _inject_email_footer(body_html: str, contact_id: str, campaign_id: str, unsub_secret: str, tenant_footer_text=None) -> str:
    token = _make_unsub_token(contact_id, campaign_id, unsub_secret)
    unsub_url = f"{_get_backend_url()}/unsubscribe?token={token}"
    address_text = tenant_footer_text or "Email Engine Inc. &bull; 123 Main Street &bull; City, State 00000 &bull; Country"
    
    footer = f"""
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-family:sans-serif;font-size:12px;color:#9ca3af;">
  <p style="margin:0 0 6px;">You received this email because you subscribed to our mailing list.</p>
  <p style="margin:0 0 6px;">
    <a href="{unsub_url}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
  </p>
  <p style="margin:0;">{address_text}</p>
</div>"""
    if "</body>" in body_html.lower():
        return body_html.replace("</body>", footer + "</body>", 1)
    return body_html + footer

def _inject_tracking_pixel(body_html: str, dispatch_id: str, tracking_secret: str) -> str:
    sig = hmac.new(tracking_secret.encode(), dispatch_id.encode(), hashlib.sha256).hexdigest()
    pixel = f'<img src="{_get_api_base()}/track/open/{dispatch_id}?s={sig}" width="1" height="1" style="display:none;" alt="" />'
    if "</body>" in body_html.lower():
        return body_html.replace("</body>", pixel + "</body>", 1)
    return body_html + pixel

def _wrap_links(body_html: str, dispatch_id: str) -> str:
    return body_html

def _wrap_links_text(body_text: str, dispatch_id: str) -> str:
    return body_text

def _inject_honeypot(body_html: str, dispatch_id: str, tracking_secret: str) -> str:
    hp_dest = "https://example.com/ignore"
    encoded = base64.urlsafe_b64encode(hp_dest.encode()).decode().rstrip("=")
    sig = hmac.new(tracking_secret.encode(), f"{dispatch_id}:{encoded}".encode(), hashlib.sha256).hexdigest()
    link = f'<a href="{_get_api_base()}/track/click?d={dispatch_id}&u={encoded}&s={sig}&hp=1" style="display:none;">.</a>'
    if "</body>" in body_html.lower():
        return body_html.replace("</body>", link + "</body>", 1)
    return body_html + link

class EmailHandler:
    def __init__(self, db, redis_client, queue_name, max_retries, unsub_secret, tracking_secret):
        self.db = db
        self.redis_client = redis_client
        self.queue_name = queue_name
        self.max_retries = max_retries
        self.unsub_secret = unsub_secret
        self.tracking_secret = tracking_secret
        self.smtp_client = None

    async def _get_smtp_client(self):
        if self.smtp_client and self.smtp_client.is_connected:
            return self.smtp_client

        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_user = os.getenv("SMTP_USERNAME")
        smtp_pass = os.getenv("SMTP_PASSWORD")

        if not (smtp_host and smtp_user and smtp_pass):
            return None

        self.smtp_client = aiosmtplib.SMTP(hostname=smtp_host, port=smtp_port, start_tls=True)
        await self.smtp_client.connect()
        await self.smtp_client.login(smtp_user, smtp_pass)
        return self.smtp_client

    async def process_message(self, message: aio_pika.abc.AbstractIncomingMessage, holding_exchange: aio_pika.robust_exchange.RobustExchange):
        async with message.process(ignore_processed=True):
            try:
                payload = json.loads(message.body.decode())
                campaign_id = payload.get("campaign_id")
                dispatch_id = payload.get("dispatch_id")
                recipient_email = payload.get("recipient_email")
                
                # 1. Immediate State Check via Redis
                state_key = f"campaign:{campaign_id}:status"
                state = await self.redis_client.get(state_key)
                
                if state == "CANCELLED":
                    logger.info(f"[{dispatch_id}] Campaign CANCELLED. Silently discarding message for {recipient_email}.")
                    await message.ack()
                    return
                    
                if state == "PAUSED":
                    logger.info(f"[{dispatch_id}] Campaign PAUSED. Routing to parking queue.")
                    new_msg = aio_pika.Message(
                        body=message.body,
                        delivery_mode=aio_pika.DeliveryMode.PERSISTENT
                    )
                    await holding_exchange.publish(new_msg, routing_key="campaign.paused")
                    await message.ack()
                    return

                # 1.5 Bounce Rate Circuit Breaker
                tenant_key_opt = await self.redis_client.get(f"campaign:{campaign_id}:tenant_id")
                if tenant_key_opt:
                    bounce_rate_opt = await self.redis_client.get(f"tenant:{tenant_key_opt}:metrics:rolling_bounce_rate")
                    if bounce_rate_opt:
                        try:
                            bounce_rate = float(bounce_rate_opt)
                            if bounce_rate > 0.05:
                                logger.error(f"[{campaign_id}] 🛑 CIRCUIT BREAKER: Rolling bounce rate is {bounce_rate*100:.1f}%. Auto-pausing campaign.")
                                await self.redis_client.set(state_key, "PAUSED")
                                self.db.table("campaigns").update({"status": "paused"}).eq("id", campaign_id).execute()
                                
                                try:
                                    camp_info = self.db.table("campaigns").select("name, tenant_id").eq("id", campaign_id).execute()
                                    if camp_info.data:
                                        t_id = camp_info.data[0]["tenant_id"]
                                        c_name = camp_info.data[0].get("name", "Unnamed")
                                        t_info = self.db.table("tenants").select("email").eq("id", t_id).execute()
                                        if t_info.data and t_info.data[0].get("email"):
                                            await notify_bounce_alert(t_info.data[0]["email"], bounce_rate, c_name, campaign_id)
                                except Exception as ne:
                                    logger.warning(f"[{campaign_id}] Bounce notification failed: {ne}")
                                
                                new_msg = aio_pika.Message(body=message.body, delivery_mode=aio_pika.DeliveryMode.PERSISTENT)
                                await holding_exchange.publish(new_msg, routing_key="campaign.paused")
                                await message.ack()
                                return
                        except ValueError:
                            pass

                # 2. Database Intent Claim
                worker_uuid = str(uuid.uuid4())
                update_res = self.db.table("campaign_dispatch")\
                    .update({"status": "PROCESSING", "updated_at": "now()", "locked_by": worker_uuid})\
                    .eq("id", dispatch_id)\
                    .eq("status", "PENDING")\
                    .execute()
                    
                if not update_res.data:
                    logger.warning(f"[{dispatch_id}] Skipping: Could not claim row (already processing or processed).")
                    await message.ack()
                    return

                logger.info(f"[{dispatch_id}] Claimed row. Sending to {recipient_email}...")

                # 3. Inject mandatory footer + tracking
                recipient_id = payload.get("recipient_id", "")
                body_html = payload.get("body_html", "")
                
                if body_html and recipient_id:
                    tenant_footer_text = None
                    try:
                        camp_info = self.db.table("campaigns").select("tenant_id").eq("id", campaign_id).execute()
                        if camp_info.data:
                            t_id = camp_info.data[0]["tenant_id"]
                            t_info = self.db.table("tenants").select("company_name, business_address, business_city, business_state, business_zip, business_country").eq("id", t_id).execute()
                            if t_info.data:
                                td = t_info.data[0]
                                parts = []
                                if td.get("company_name"): parts.append(td["company_name"])
                                if td.get("business_address"): parts.append(td["business_address"])
                                city_data = list(filter(bool, [td.get("business_city"), td.get("business_state"), td.get("business_zip")]))
                                city_str = " ".join(city_data)
                                if city_str: parts.append(city_str)
                                if td.get("business_country"): parts.append(td["business_country"])
                                if parts:
                                    tenant_footer_text = " &bull; ".join(parts)
                    except Exception as e:
                        logger.warning(f"[{dispatch_id}] Failed to load dynamic footer formatting: {e}")
                
                    body_html = _inject_email_footer(body_html, recipient_id, campaign_id, self.unsub_secret, tenant_footer_text=tenant_footer_text)
                    body_html = _inject_tracking_pixel(body_html, dispatch_id, self.tracking_secret)
                    body_html = _wrap_links(body_html, dispatch_id)
                    body_html = _inject_honeypot(body_html, dispatch_id, self.tracking_secret)
                    logger.info(f"[{dispatch_id}] Footer + tracking injected for {recipient_email}")

                # 4. Real SMTP Send via AWS SES (or fallback)
                smtp_host     = os.getenv("SMTP_HOST")
                smtp_port     = int(os.getenv("SMTP_PORT", 587))
                smtp_user     = os.getenv("SMTP_USERNAME")
                smtp_pass     = os.getenv("SMTP_PASSWORD")
                smtp_from     = payload.get("from_email") or os.getenv("SMTP_FROM_EMAIL", "noreply@emailengine.app")
                smtp_from_name = payload.get("from_name") or os.getenv("SMTP_FROM_NAME", "Email Engine")
                subject       = payload.get("subject", "(No Subject)")

                message_id = None

                if smtp_host and smtp_user and smtp_pass:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = subject
                    msg["From"]    = f"{smtp_from_name} <{smtp_from}>"
                    msg["To"]      = recipient_email
                    msg["Message-ID"] = f"<{dispatch_id}@emailengine.app>"

                    plain = re.sub(r'<[^>]+>', '', body_html or subject)
                    plain = _wrap_links_text(plain, dispatch_id)
                    msg.attach(MIMEText(plain, "plain"))
                    msg.attach(MIMEText(body_html or f"<p>{subject}</p>", "html"))

                    client = await self._get_smtp_client()
                    if client:
                        await client.send_message(msg)
                    else:
                        # Fallback to ephemeral connection just in case
                        await aiosmtplib.send(
                            msg,
                            hostname=smtp_host,
                            port=smtp_port,
                            username=smtp_user,
                            password=smtp_pass,
                            start_tls=True,
                        )
                    message_id = msg["Message-ID"]
                    logger.info(f"[{dispatch_id}] SMTP sent → {recipient_email} via {smtp_host}")
                else:
                    logger.warning(f"[{dispatch_id}] No SMTP creds — simulating send to {recipient_email}")
                    await asyncio.sleep(random.uniform(0.1, 0.3))
                    message_id = f"sim-{random.randint(100000, 999999)}"

                # 5. Mark DISPATCHED
                self.db.table("campaign_dispatch")\
                    .update({
                        "status": "DISPATCHED",
                        "ses_message_id": message_id,
                        "external_msg_id": message_id,
                        "sent_at": "now()",
                        "updated_at": "now()"
                    })\
                    .eq("id", dispatch_id)\
                    .execute()

                logger.info(f"[{dispatch_id}] Status → DISPATCHED (msg_id={message_id})")

                # 6. Auto-complete campaign
                await self._check_campaign_completion(campaign_id)

                
                await message.ack()

            except Exception as e:
                attempts = int(message.headers.get("attempts", 0) if message.headers else 0)
                logger.error(f"Worker Error processing message (attempt {attempts + 1}/{self.max_retries}): {e}")

                if attempts + 1 < self.max_retries:
                    try:
                        delay = min(2 ** attempts, 30)
                        if delay > 0:
                            await asyncio.sleep(delay)
                        new_msg = aio_pika.Message(
                            body=message.body,
                            headers={"attempts": attempts + 1},
                            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                        )
                        exchange = await message.channel.get_exchange("")
                        await exchange.publish(new_msg, routing_key=self.queue_name)
                        await message.ack()
                        return
                    except Exception as requeue_err:
                        logger.error(f"Retry publish failed: {requeue_err}")

                try:
                    decoded = json.loads(message.body.decode())
                    dispatch_id = decoded.get("dispatch_id")
                    recipient_id = decoded.get("recipient_id")
                    if dispatch_id:
                        self.db.table("campaign_dispatch")\
                            .update({"status": "FAILED", "error_log": str(e), "updated_at": "now()"})\
                            .eq("id", dispatch_id)\
                            .execute()
                    if recipient_id:
                        self.db.table("contacts")\
                            .update({"status": "bounced", "bounce_reason": str(e)})\
                            .eq("id", recipient_id)\
                            .execute()
                        logger.warning(f"[{dispatch_id}] Contact {recipient_id} marked as bounced")
                    
                    # Auto-complete check after failure
                    if campaign_id:
                        await self._check_campaign_completion(campaign_id)
                except Exception as inner_e:
                    logger.error(f"Failed to mark failure in DB: {inner_e}")
                
                if not message.processed:
                    await message.nack(requeue=False)

    async def _check_campaign_completion(self, campaign_id: str):
        try:
            remaining = self.db.table("campaign_dispatch")\
                .select("id", count="exact")\
                .eq("campaign_id", campaign_id)\
                .in_("status", ["PENDING", "PROCESSING"])\
                .execute()
            if (remaining.count or 0) == 0:
                self.db.table("campaigns")\
                    .update({"status": "sent"})\
                    .eq("id", campaign_id)\
                    .execute()
                logger.info(f"[{campaign_id}] All dispatches complete → Campaign marked as SENT")
                
                try:
                    camp_info = self.db.table("campaigns").select("name, tenant_id").eq("id", campaign_id).execute()
                    if camp_info.data:
                        t_id = camp_info.data[0]["tenant_id"]
                        c_name = camp_info.data[0].get("name", "Unnamed")
                        sent_count = self.db.table("campaign_dispatch").select("id", count="exact").eq("campaign_id", campaign_id).eq("status", "DISPATCHED").execute()
                        fail_count = self.db.table("campaign_dispatch").select("id", count="exact").eq("campaign_id", campaign_id).eq("status", "FAILED").execute()
                        total_sent = sent_count.count or 0
                        total_failed = fail_count.count or 0
                        t_info = self.db.table("tenants").select("email").eq("id", t_id).execute()
                        if t_info.data and t_info.data[0].get("email"):
                            await notify_campaign_completed(t_info.data[0]["email"], c_name, total_sent, total_failed, campaign_id)
                except Exception as ne:
                    logger.warning(f"[{campaign_id}] Completion notification failed: {ne}")
        except Exception as e:
            logger.warning(f"[{campaign_id}] Auto-complete check failed: {e}")
