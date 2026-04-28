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
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

# Import notification service
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'api'))
from services.notification_service import notify_campaign_completed, notify_bounce_alert

# Database engine for raw SQL (FOR UPDATE SKIP LOCKED)
from utils.db_engine import get_conn, execute

logger = logging.getLogger(__name__)

def process_spintax(text: str) -> str:
    if not text:
        return ""
    pattern = r"\{([^{}]+)\}"
    def replace_spintax(match):
        return random.choice(match.group(1).split("|"))
    while re.search(pattern, text):
        text = re.sub(pattern, replace_spintax, text)
    return text

def process_merge_tags(text: str, contact: dict) -> str:
    if not text:
        return ""
    pattern = r"\{\{(\w+)(?:\|([^}]+))?\}\}"
    def replace_tag(match):
        field = match.group(1)
        fallback = match.group(2) or ""
        return str(contact.get(field, fallback) or fallback)
    return re.sub(pattern, replace_tag, text)

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
        self._smtp_lock = asyncio.Lock()

        # Batch dispatch update buffer
        self._dispatch_buffer: list[dict] = []
        self._dispatch_batch_size = int(os.getenv("DISPATCH_BATCH_SIZE", "20"))
        self._buffer_lock = asyncio.Lock()

    @staticmethod
    def _is_ses_recipient_verification_error(error: Exception) -> bool:
        message = str(error).lower()
        return (
            "email address is not verified" in message
            or "identities failed the check" in message
        )

    async def _buffer_dispatch_update(self, dispatch_id: str, campaign_id: str, recipient_id: str, message_id: str | None) -> None:
        """Immediately update the campaign_dispatch row after a successful send."""
        try:
            self.db.table("campaign_dispatch").upsert(
                [{
                    "id": dispatch_id,
                    "campaign_id": campaign_id,
                    "subscriber_id": recipient_id,
                    "status": "DISPATCHED",
                    "ses_message_id": message_id,
                    "external_msg_id": message_id,
                    "sent_at": "now()",
                    "updated_at": "now()",
                }],
                on_conflict="id",
            ).execute()
            logger.info(f"[DISPATCH] Updated dispatch row {dispatch_id} → DISPATCHED")
            # Check if this was the last task for the campaign
            await self._check_campaign_completion(campaign_id)
        except Exception as e:
            logger.error(f"[DISPATCH] Failed to update dispatch row {dispatch_id}: {e}")


    async def _flush_dispatch_buffer(self) -> None:
        """Flush buffered dispatch updates to Supabase in a single upsert."""
        if not self._dispatch_buffer:
            return
        batch = self._dispatch_buffer[:]
        self._dispatch_buffer.clear()
        try:
            self.db.table("campaign_dispatch").upsert(
                [{**row, "sent_at": "now()", "updated_at": "now()"} for row in batch],
                on_conflict="id",
            ).execute()
            logger.info(f"[BATCH] Flushed {len(batch)} dispatch updates to DB.")
        except Exception as e:
            logger.error(f"[BATCH] Batch dispatch flush failed: {e} — rows lost: {len(batch)}")

    async def flush_all(self) -> None:
        """Flush any remaining buffered rows. Call on graceful shutdown."""
        async with self._buffer_lock:
            await self._flush_dispatch_buffer()

    async def _get_smtp_client(self):
        if self.smtp_client and self.smtp_client.is_connected:
            return self.smtp_client

        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_user = os.getenv("SMTP_USERNAME")
        smtp_pass = os.getenv("SMTP_PASSWORD")

        if not (smtp_host and smtp_user and smtp_pass):
            logger.warning("SMTP credentials missing in environment.")
            return None

        try:
            logger.info(f"Connecting to SMTP {smtp_host}:{smtp_port}...")
            self.smtp_client = aiosmtplib.SMTP(
                hostname=smtp_host, 
                port=smtp_port, 
                use_tls=(smtp_port == 465),
                start_tls=(smtp_port == 587)
            )
            await asyncio.wait_for(self.smtp_client.connect(), timeout=10)
            
            logger.info(f"Logging in as {smtp_user}...")
            await asyncio.wait_for(self.smtp_client.login(smtp_user, smtp_pass), timeout=10)
            logger.info("SMTP persistent connection established.")
            return self.smtp_client
        except Exception as e:
            logger.error(f"Failed to establish SMTP connection: {e}")
            self.smtp_client = None
            return None

    async def process_message(self, message: aio_pika.abc.AbstractIncomingMessage, holding_exchange, dlq_exchange):
        async with message.process(ignore_processed=True):
            task_id = None
            task_row = None   # Must be initialized — exception handler references it
            jitter = 0.1
            try:
                payload = json.loads(message.body.decode())
                task_id = payload.get("task_id")
                attempt = payload.get("attempt", 1)

                if not task_id:
                    await message.ack()
                    return

                # Convert to UUID once — all asyncpg queries use this typed object
                task_uuid = uuid.UUID(task_id)

                # 1. Atomic Fetch & Lock
                async with get_conn() as conn:
                    async with conn.transaction():
                        task_row = await conn.fetchrow("""
                            SELECT
                                t.id, t.campaign_id, t.snapshot_id, t.dispatch_id,
                                t.tenant_id, t.contact_id, t.recipient_email, t.recipient_domain,
                                t.status, t.retry_count,
                                c.id         AS c_id,
                                c.email      AS c_email,
                                c.first_name AS c_first_name,
                                c.last_name  AS c_last_name,
                                tn.company_name, tn.business_address
                            FROM email_tasks t
                            JOIN contacts c  ON t.contact_id      = c.id
                            JOIN tenants  tn ON t.tenant_id::uuid  = tn.id
                            WHERE t.id = $1
                              AND t.status NOT IN ('sent', 'processing', 'failed')
                            FOR UPDATE SKIP LOCKED
                        """, task_uuid)

                        if not task_row:
                            await message.ack()
                            return

                        await conn.execute("""
                            UPDATE email_tasks
                            SET status = 'processing', retry_count = $2
                            WHERE id = $1
                        """, task_uuid, attempt - 1)

                campaign_id     = task_row["campaign_id"]    # uuid.UUID from asyncpg
                tenant_id       = task_row["tenant_id"]      # str  (text column)
                dispatch_id     = task_row["dispatch_id"]    # uuid.UUID from asyncpg
                recipient_email = task_row["recipient_email"]
                domain_name     = recipient_email.split("@")[-1].lower()

                # 2. Kill Switch Check
                pause_mode = "NONE"
                try:
                    pause_mode = await self.redis_client.get("control:global:mode") or "NONE"
                except Exception:
                    try:
                        res = self.db.table("delivery_controls").select("pause_mode").eq("id", "global").execute()
                        pause_mode = res.data[0]["pause_mode"] if res.data else "NONE"
                    except Exception:
                        pause_mode = "NONE"

                if pause_mode == "HARD":
                    logger.warning(f"[{task_id}] HARD KILL SWITCH ACTIVE. Requeueing.")
                    await execute("UPDATE email_tasks SET status = 'pending' WHERE id = $1", task_uuid)
                    await message.nack(requeue=True)
                    return

                # 3. Adaptive Throttling & Jitter
                from services.reputation_engine import ReputationEngine
                rep_engine = ReputationEngine(self.redis_client, self.db)
                throttle = await rep_engine.get_throttle_limit(task_row["recipient_domain"])
                base_delay = 0.2 / max(throttle.get("factor", 1.0), 0.01)
                if domain_name == "gmail.com":
                    base_delay *= 1.5
                jitter = random.gauss(base_delay, base_delay * 0.4)
                await asyncio.sleep(max(0.01, jitter))

                # 4. Routing
                from services.reputation_engine import RoutingEngine
                router = RoutingEngine(self.db, self.redis_client)
                provider = await router.get_best_provider(str(campaign_id), domain_name)

                # 5. Pre-Send Kill Switch Re-check
                try:
                    final_pause = await self.redis_client.get("control:global:mode") or "NONE"
                    if final_pause == "HARD":
                        await execute("UPDATE email_tasks SET status = 'pending' WHERE id = $1", task_uuid)
                        await message.nack(requeue=True)
                        return
                except Exception:
                    pass

                # 6. ISP Rate Cap (10/sec per domain)
                try:
                    isp_key = f"rl:isp:{domain_name}:marketing"
                    current_isp_rate = await self.redis_client.incr(isp_key)
                    if current_isp_rate == 1:
                        await self.redis_client.expire(isp_key, 1)
                    if current_isp_rate > 10:
                        await execute("UPDATE email_tasks SET status = 'pending' WHERE id = $1", task_uuid)
                        await message.nack(requeue=True)
                        return
                except Exception:
                    pass  # Redis failure → proceed without rate cap

                # 7. Render Content from Snapshot
                snap_res = self.db.table("campaign_snapshots") \
                    .select("body_snapshot, subject_snapshot") \
                    .eq("id", str(task_row["snapshot_id"])) \
                    .execute()
                if not snap_res.data:
                    raise ValueError("Snapshot not found")

                contact_data = {
                    "id":         str(task_row["c_id"]),
                    "email":      task_row["c_email"],
                    "first_name": task_row["c_first_name"],
                    "last_name":  task_row["c_last_name"],
                }
                body_html = process_merge_tags(process_spintax(snap_res.data[0]["body_snapshot"]), contact_data)
                subject   = process_merge_tags(process_spintax(snap_res.data[0]["subject_snapshot"]), contact_data)

                body_html = _inject_email_footer(body_html, contact_data["id"], str(campaign_id), self.unsub_secret)
                body_html = _inject_tracking_pixel(body_html, str(dispatch_id), self.tracking_secret)

                # 8. Build From Address from Campaign Sender Identity (not recipient domain!)
                smtp_host = os.getenv("SMTP_HOST", "email-smtp.ap-southeast-2.amazonaws.com")
                smtp_port = int(os.getenv("SMTP_PORT", "587"))
                smtp_user = os.getenv("SMTP_USERNAME")
                smtp_pass = os.getenv("SMTP_PASSWORD")

                from_display = f"Email Engine <noreply@{domain_name}>"
                try:
                    camp_res = self.db.table("campaigns") \
                        .select("from_name, from_prefix, domain_id") \
                        .eq("id", str(campaign_id)) \
                        .execute()
                    if camp_res.data:
                        camp = camp_res.data[0]
                        dom_res = self.db.table("domains") \
                            .select("domain_name") \
                            .eq("id", str(camp["domain_id"])) \
                            .execute()
                        sender_domain = dom_res.data[0]["domain_name"] if dom_res.data else "mail.example.com"
                        from_display = f"{camp['from_name']} <{camp['from_prefix']}@{sender_domain}>"
                except Exception as fe:
                    logger.warning(f"[{task_id}] Could not fetch sender identity: {fe}")

                # 9. Build MIME Message
                msg = MIMEMultipart("alternative")
                msg["Subject"]    = subject
                msg["From"]       = from_display
                msg["To"]         = recipient_email
                msg["Message-ID"] = f"<{dispatch_id}@emailengine.app>"
                msg.attach(MIMEText(re.sub(r'<[^>]+>', '', body_html), "plain"))
                msg.attach(MIMEText(body_html, "html"))

                # 10. Send via persistent SMTP connection (reuse TLS session → ~1s per email)
                if not smtp_host or not smtp_user or not smtp_pass:
                    logger.warning(f"[{task_id}] SMTP not configured — simulating send to {recipient_email}")
                else:
                    async with self._smtp_lock:  # Serialize sends on shared connection
                        client = await self._get_smtp_client()
                        if client:
                            await client.send_message(msg)
                        else:
                            # Fallback to one-shot if persistent connect fails
                            await aiosmtplib.send(
                                msg,
                                hostname=smtp_host,
                                port=smtp_port,
                                start_tls=True,
                                username=smtp_user,
                                password=smtp_pass,
                            )

                # 11. Atomic Success Update
                async with get_conn() as conn:
                    async with conn.transaction():
                        await conn.execute(
                            "UPDATE email_tasks SET status = 'sent', is_sent = TRUE, sent_at = $2 WHERE id = $1",
                            task_uuid,
                            datetime.now(timezone.utc),   # asyncpg needs datetime object, not ISO string
                        )

                await self._buffer_dispatch_update(str(dispatch_id), str(campaign_id), str(task_row["c_id"]), None)
                await message.ack()
                logger.info(f"[{task_id}] ✅ Sent to {recipient_email} via {smtp_host} (jitter: {jitter:.2f}s)")

            except Exception as e:
                err_str = str(e)
                logger.error(f"[{task_id}] ❌ Error: {err_str}")
                try:
                    if task_id and task_row:
                        task_uuid_err = uuid.UUID(task_id)
                        # Mark email_task as failed
                        await execute(
                            "UPDATE email_tasks SET status = 'failed', last_error = $2 WHERE id = $1",
                            task_uuid_err, err_str[:500],
                        )
                        # Also mark campaign_dispatch as FAILED so dashboard shows it
                        self.db.table("campaign_dispatch").upsert([{
                            "id": str(task_row["dispatch_id"]),
                            "campaign_id": str(task_row["campaign_id"]),
                            "subscriber_id": str(task_row["c_id"]),
                            "status": "FAILED",
                            "error_log": err_str[:500],
                            "updated_at": "now()",
                        }], on_conflict="id").execute()
                        # Check if this was the last task — mark campaign as 'sent' if so
                        await self._check_campaign_completion(str(task_row["campaign_id"]))
                except Exception as db_err:
                    logger.warning(f"[{task_id}] Could not mark task as failed in DB: {db_err}")
                await message.ack()

    async def _check_campaign_completion(self, campaign_id: str):
        try:
            remaining = self.db.table("campaign_dispatch").select("id", count="exact").eq("campaign_id", campaign_id).in_("status", ["PENDING", "PROCESSING"]).execute()
            if (remaining.count or 0) == 0:
                self.db.table("campaigns").update({"status": "sent"}).eq("id", campaign_id).execute()
                camp_info = self.db.table("campaigns").select("name, tenant_id").eq("id", campaign_id).execute()
                if camp_info.data:
                    t_id = camp_info.data[0]["tenant_id"]
                    sent = self.db.table("campaign_dispatch").select("id", count="exact").eq("campaign_id", campaign_id).eq("status", "DISPATCHED").execute()
                    failed = self.db.table("campaign_dispatch").select("id", count="exact").eq("campaign_id", campaign_id).eq("status", "FAILED").execute()
                    t_info = self.db.table("tenants").select("email").eq("id", t_id).execute()
                    if t_info.data and t_info.data[0].get("email"):
                        await notify_campaign_completed(t_info.data[0]["email"], camp_info.data[0].get("name"), sent.count or 0, failed.count or 0, campaign_id)
        except Exception as e:
            logger.warning(f"[{campaign_id}] Completion check failed: {e}")
