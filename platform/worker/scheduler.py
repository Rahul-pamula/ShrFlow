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
import httpx
import json
from urllib.parse import urlparse
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
from services.campaign_dispatch_service import (
    claim_scheduled_campaign,
    fetch_contacts_for_target,
    queue_campaign_dispatch,
)


# ── Core dispatch logic ────────────────────────────────────────────────
async def dispatch_campaign(db: Client, campaign: dict):
    """Dispatch a scheduled campaign after atomically claiming it."""
    campaign_id = campaign["id"]
    tenant_id   = campaign["tenant_id"]

    if not claim_scheduled_campaign(db, campaign_id, tenant_id):
        logger.info(f"[{campaign_id}] Skip dispatch; another scheduler instance already claimed it.")
        return

    logger.info(f"[{campaign_id}] Dispatching scheduled campaign: '{campaign['name']}'")
    contacts, _ = fetch_contacts_for_target(
        supabase=db,
        tenant_id=tenant_id,
        target=campaign.get("audience_target") or "all",
        exclude_suppressed=True,
    )

    if not contacts:
        logger.warning(f"[{campaign_id}] No contacts found — aborting.")
        db.table("campaigns").update({"status": "draft"}).eq("id", campaign_id).execute()
        return

    try:
        dispatch_result = await queue_campaign_dispatch(
            supabase=db,
            mq_client=mq_client,
            campaign=campaign,
            tenant_id=tenant_id,
            contacts=contacts,
            redis_client=None,
            mark_campaign_sending=False,
            touch_scheduled_at=False,
        )
    except ValueError as exc:
        logger.error(f"[{campaign_id}] Dispatch failed: {exc}")
        db.table("campaigns").update({"status": "draft"}).eq("id", campaign_id).execute()
        return

    # Best-effort Redis update for workers.
    try:
        from utils.redis_client import redis_client
        await redis_client.set_campaign_status(campaign_id, "SENDING")
    except Exception as e:
        logger.warning(f"[{campaign_id}] Redis update skipped: {e}")

    logger.info(f"[{campaign_id}] ✅ {dispatch_result['dispatched']} tasks published to RabbitMQ.")


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


async def _empty_old_exports(db: Client):
    """Delete export files older than 24h to save DB storage"""
    try:
        from datetime import timedelta
        twenty_four_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        res = (
            db.table("jobs")
            .select("id, tenant_id, error_log")
            .eq("type", "csv_export")
            .lt("updated_at", twenty_four_hours_ago)
            .execute()
        )
        if res.data:
            files_to_remove = []
            for job in res.data:
                # Try to infer the exact storage path from the signed URL stored in error_log
                file_path = None
                try:
                    meta = json.loads(job.get("error_log") or "{}")
                    url = meta.get("result_url") if isinstance(meta, dict) else None
                    if url:
                        parsed = urlparse(url)
                        # Supabase signed URLs usually contain "/storage/v1/object/sign/exports/<path>"
                        if "/exports/" in parsed.path:
                            file_path = parsed.path.split("/exports/", 1)[1].split("?", 1)[0]
                except Exception:
                    file_path = None

                if not file_path:
                    # Fallback to the default non-batch naming pattern
                    file_path = f"{job['tenant_id']}/export_{job['id']}.csv.gz"

                files_to_remove.append(file_path)
                db.table("jobs").delete().eq("id", job["id"]).execute()

            db.storage.from_("exports").remove(files_to_remove)
            logger.info(f"🧹 Cleaned up {len(files_to_remove)} old export files.")
    except Exception as e:
        logger.error(f"Cleanup of exports failed: {e}")


# ── Main scheduler loop ────────────────────────────────────────────────
async def run_scheduler():
    db: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    )
    # Force HTTP/1.1 to avoid stale HTTP/2 ConnectionTerminated errors
    _http1 = httpx.Client(transport=httpx.HTTPTransport(http2=False), timeout=30.0)
    db.postgrest.session = _http1
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
            
            # Garbage Collection: Export buckets
            await _empty_old_exports(db)

        except Exception as e:
            logger.error(f"Scheduler error: {e}")

        await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    asyncio.run(run_scheduler())
