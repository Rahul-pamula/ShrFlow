"""
Campaign Scheduler — Phase 4
Runs as a background service alongside the email worker.
Every 60 seconds it checks Supabase for campaigns that have a
`scheduled_at` in the past and a `status` of 'scheduled'.
When found, it triggers the send pipeline (dispatch records + RabbitMQ).
Start with: python platform/worker/scheduler.py
"""

import asyncio
import os
import uuid
import logging
import re
import random
from datetime import datetime, timezone
from typing import List, Dict

from dotenv import load_dotenv
from supabase import create_client, Client

# Load env from repo root
env_path = os.path.join(os.path.dirname(__file__), "../../.env")
load_dotenv(dotenv_path=env_path)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [SCHEDULER] %(levelname)s — %(message)s"
)
logger = logging.getLogger(__name__)

POLL_INTERVAL = 60  # seconds

# ── Broker import ──────────────────────────────────────────────────────
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../api"))
from utils.rabbitmq_client import mq_client


# ── Text processing (mirror of campaigns.py) ───────────────────────────
def process_spintax(text: str) -> str:
    if not text:
        return ""
    pattern = r'\{([^{}]+)\}'
    def _replace(m):
        return random.choice(m.group(1).split("|"))
    while re.search(pattern, text):
        text = re.sub(pattern, _replace, text)
    return text


def process_merge_tags(text: str, contact: dict) -> str:
    if not text:
        return ""
    pattern = r'\{\{(\w+)(?:\|([^}]+))?\}\}'
    def _replace(m):
        field = m.group(1)
        fallback = m.group(2) or ""
        return str(contact.get(field, fallback) or fallback)
    return re.sub(pattern, _replace, text)


# ── Core dispatch logic ────────────────────────────────────────────────
async def dispatch_campaign(db: Client, campaign: dict):
    """Mirror of send_campaign in campaigns.py — called by scheduler without JWT."""
    campaign_id = campaign["id"]
    tenant_id   = campaign["tenant_id"]

    logger.info(f"[{campaign_id}] Dispatching scheduled campaign: '{campaign['name']}'")

    # 1. Snapshot
    snapshot_id = str(uuid.uuid4())
    db.table("campaign_snapshots").insert({
        "id": snapshot_id,
        "campaign_id": campaign_id,
        "body_snapshot": campaign.get("body_html", ""),
        "subject_snapshot": campaign.get("subject", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    # 2. Mark as sending in DB
    db.table("campaigns").update({
        "status": "sending",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", campaign_id).execute()

    # 3. Set Redis status so worker will process (best-effort)
    try:
        from utils.redis_client import redis_client
        await redis_client.set_campaign_status(campaign_id, "SENDING")
    except Exception as e:
        logger.warning(f"[{campaign_id}] Redis update skipped: {e}")

    # 4. Fetch audience
    audience_target = campaign.get("audience_target") or "all"
    query = db.table("contacts").select("id, email, first_name, last_name").eq("tenant_id", tenant_id)

    if audience_target.startswith("batch:"):
        batch_id = audience_target.split("batch:", 1)[1]
        query = query.eq("import_batch_id", batch_id)

    contacts_res = query.execute()
    contacts: List[Dict] = contacts_res.data or []

    if not contacts:
        logger.warning(f"[{campaign_id}] No contacts found — aborting.")
        db.table("campaigns").update({"status": "draft"}).eq("id", campaign_id).execute()
        return

    # 5. Build dispatch records + RabbitMQ tasks
    dispatch_records = []
    tasks = []

    for contact in contacts:
        dispatch_id = str(uuid.uuid4())
        html = process_merge_tags(process_spintax(campaign.get("body_html", "")), contact)
        subject = process_merge_tags(process_spintax(campaign.get("subject", "")), contact)

        dispatch_records.append({
            "id": dispatch_id,
            "campaign_id": campaign_id,
            "subscriber_id": contact["id"],
            "status": "PENDING",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })

        tasks.append({
            "dispatch_id": dispatch_id,
            "campaign_id": campaign_id,
            "tenant_id": tenant_id,
            "recipient_email": contact["email"],
            "recipient_id": contact["id"],
            "subject": subject,
            "body_html": html,
        })

    # Batch-insert dispatch rows (Supabase limit is 1000 per request)
    CHUNK = 1000
    for i in range(0, len(dispatch_records), CHUNK):
        db.table("campaign_dispatch").insert(dispatch_records[i:i+CHUNK]).execute()

    # 6. Publish to RabbitMQ
    await mq_client.publish_tasks(tasks)
    logger.info(f"[{campaign_id}] ✅ {len(tasks)} tasks published to RabbitMQ.")


# ── Monthly summary notifier ───────────────────────────────────────────
async def _check_monthly_summary(db: Client):
    """On the 1st of each month, email all tenants their usage summary."""
    now = datetime.now(timezone.utc)
    if now.day != 1:
        return
    
    # Use Redis to ensure this only fires once per month
    try:
        import redis.asyncio as redis_lib
        r = redis_lib.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
        flag = f"monthly_summary:{now.year}:{now.month}"
        already = await r.get(flag)
        if already:
            return
        await r.set(flag, "1", ex=35*24*3600)
    except Exception:
        return  # If Redis is down, skip silently
    
    logger.info("📊 Monthly 1st — Sending usage summaries to all tenants")
    
    from services.notification_service import notify_monthly_summary
    
    # Get previous month label
    prev_month = now.month - 1 or 12
    prev_year = now.year if now.month > 1 else now.year - 1
    month_label = datetime(prev_year, prev_month, 1).strftime("%B %Y")
    
    tenants = db.table("tenants").select(
        "id, email, emails_sent_this_cycle, plans(name, max_monthly_emails)"
    ).execute()
    
    for tenant in (tenants.data or []):
        if not tenant.get("email"):
            continue
        try:
            plan = tenant.get("plans") or {}
            contacts_count = db.table("contacts").select("id", count="exact").eq("tenant_id", tenant["id"]).execute()
            campaigns_count = db.table("campaigns").select("id", count="exact").eq("tenant_id", tenant["id"]).eq("status", "sent").execute()
            
            await notify_monthly_summary(
                tenant_email=tenant["email"],
                emails_sent=tenant.get("emails_sent_this_cycle", 0),
                email_limit=plan.get("max_monthly_emails", 1000),
                contacts_count=contacts_count.count or 0,
                campaigns_count=campaigns_count.count or 0,
                plan_name=plan.get("name", "Free"),
                month_label=month_label
            )
        except Exception as e:
            logger.warning(f"Monthly summary failed for {tenant['id']}: {e}")


# ── Main scheduler loop ────────────────────────────────────────────────
async def run_scheduler():
    db: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    )
    logger.info(f"📅 Scheduler started — polling every {POLL_INTERVAL}s")

    while True:
        try:
            now_iso = datetime.now(timezone.utc).isoformat()

            # Find campaigns due to be sent
            res = db.table("campaigns") \
                .select("*") \
                .eq("status", "scheduled") \
                .lte("scheduled_at", now_iso) \
                .is_("is_archived", "false") \
                .execute()

            due: List[Dict] = res.data or []

            if due:
                logger.info(f"🗓  {len(due)} campaign(s) due — dispatching now")
                for campaign in due:
                    try:
                        await dispatch_campaign(db, campaign)
                    except Exception as e:
                        logger.error(f"[{campaign['id']}] Dispatch failed: {e}")
            else:
                logger.debug("No campaigns due.")

            # Phase 7: Monthly summary check
            await _check_monthly_summary(db)

        except Exception as e:
            logger.error(f"Scheduler error: {e}")

        await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    asyncio.run(run_scheduler())

