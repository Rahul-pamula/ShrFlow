"""
Campaign Scheduler — Standalone Process (Phase 5.7 Hardening)

Runs as a DEDICATED process — NOT inside the API.

CRITICAL FIX: Uses a Redis distributed lock (SET NX EX 90) to guarantee
only ONE instance of the scheduler fires at any time, even if:
  - You run multiple API replicas
  - This process is accidentally started twice
  - Docker Swarm / k8s restarts the process during a poll cycle

Without this lock, running 2 API replicas (or this process + the embedded
scheduler) fires every scheduled campaign TWICE.

Start with:
  python platform/worker/scheduler.py

Environment variable to disable the unsafe embedded scheduler in FastAPI:
  ENABLE_EMBEDDED_CAMPAIGN_SCHEDULER=false
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

POLL_INTERVAL = int(os.getenv("SCHEDULER_POLL_INTERVAL", "60"))  # seconds

# ── Lock config ────────────────────────────────────────────────────────
# The lock TTL must be longer than POLL_INTERVAL to cover slow dispatch cycles.
# Set to 90s: if this process crashes mid-poll, the lock expires and another
# instance can take over within 90s.
SCHEDULER_LOCK_KEY = "scheduler:global:lock"
SCHEDULER_LOCK_TTL = 90  # seconds
SCHEDULER_INSTANCE_ID = str(uuid.uuid4())  # unique ID for this process instance

# ── Path bootstrap ─────────────────────────────────────────────────────
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../api"))

from utils.rabbitmq_client import mq_client
from services.campaign_dispatch_service import (
    claim_scheduled_campaign,
    fetch_contacts_for_target,
    queue_campaign_dispatch,
)


# ── Redis lock helpers ─────────────────────────────────────────────────

async def _acquire_lock(r) -> bool:
    """
    Try to acquire the distributed scheduler lock using Redis SET NX EX.

    SET NX (set if not exists) + EX (expiry in seconds) is atomic — this is
    the standard pattern for distributed locks in Redis. Only one instance
    across all processes/replicas can hold this key at a time.

    Returns True if this instance acquired the lock, False if another holds it.
    """
    # SET key value NX EX ttl
    # Returns True if key was set (we got the lock), None if it already existed
    result = await r.set(
        SCHEDULER_LOCK_KEY,
        SCHEDULER_INSTANCE_ID,
        nx=True,   # Only set if Not eXists
        ex=SCHEDULER_LOCK_TTL,
    )
    return result is True


async def _release_lock(r) -> None:
    """
    Release the lock — only if WE own it (Lua script for atomicity).
    This prevents accidentally releasing a lock acquired by a different instance
    if our lock expired and another instance re-acquired it while we were slow.
    """
    lua_script = """
    if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
    else
        return 0
    end
    """
    try:
        await r.eval(lua_script, 1, SCHEDULER_LOCK_KEY, SCHEDULER_INSTANCE_ID)
    except Exception as e:
        logger.warning(f"[LOCK] Failed to release lock: {e}")


async def _get_redis():
    """Connect to Redis and return a client. Raises on failure."""
    import redis.asyncio as redis_lib
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    return redis_lib.from_url(redis_url, decode_responses=True)


# ── Core dispatch logic ────────────────────────────────────────────────

async def dispatch_campaign(db: Client, campaign: dict, redis_client=None):
    """Dispatch a scheduled campaign after atomically claiming it via DB CAS."""
    campaign_id = campaign["id"]
    tenant_id   = campaign["tenant_id"]

    # DB-level optimistic lock: only succeeds if status is still 'scheduled'
    if not claim_scheduled_campaign(db, campaign_id, tenant_id):
        logger.info(f"[{campaign_id}] Skip — already claimed by another instance.")
        return

    logger.info(f"[{campaign_id}] Dispatching campaign: '{campaign['name']}'")

    contacts, _ = fetch_contacts_for_target(
        supabase=db,
        tenant_id=tenant_id,
        target=campaign.get("audience_target") or "all",
        exclude_suppressed=True,
    )

    if not contacts:
        logger.warning(f"[{campaign_id}] No contacts — reverting to draft.")
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

    # Best-effort Redis status update for workers
    if redis_client:
        try:
            await redis_client.set(
                f"tenant:{tenant_id}:campaign:{campaign_id}:status",
                "SENDING",
                ex=60 * 60 * 24,  # 24h TTL
            )
        except Exception as e:
            logger.warning(f"[{campaign_id}] Redis status update skipped: {e}")

    logger.info(f"[{campaign_id}] ✅ {dispatch_result['dispatched']} tasks published to RabbitMQ.")


# ── Heartbeat ──────────────────────────────────────────────────────────

async def _write_heartbeat(r) -> None:
    """
    Write a heartbeat key to Redis so monitoring can detect a dead scheduler.
    Key: scheduler:heartbeat  — expires in 2× POLL_INTERVAL seconds.
    If the key disappears, the scheduler process has stalled or crashed.
    """
    try:
        await r.set(
            "scheduler:heartbeat",
            datetime.now(timezone.utc).isoformat(),
            ex=POLL_INTERVAL * 2,
        )
    except Exception as e:
        logger.warning(f"[HEARTBEAT] Failed to write: {e}")


# ── Maintenance tasks ──────────────────────────────────────────────────

async def _check_monthly_summary(db: Client, r) -> None:
    """On the 1st of each month, email all tenants their usage summary."""
    now = datetime.now(timezone.utc)
    if now.day != 1:
        return

    flag = f"monthly_summary:{now.year}:{now.month}"
    try:
        already = await r.get(flag)
        if already:
            return
        await r.set(flag, "1", ex=35 * 24 * 3600)
    except Exception:
        return  # If Redis is down, skip silently

    logger.info("📊 Monthly 1st — Sending usage summaries to all tenants")

    try:
        from services.notification_service import notify_monthly_summary
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
                contacts_count = (
                    db.table("contacts").select("id", count="exact")
                    .eq("tenant_id", tenant["id"]).execute()
                )
                campaigns_count = (
                    db.table("campaigns").select("id", count="exact")
                    .eq("tenant_id", tenant["id"]).eq("status", "sent").execute()
                )
                await notify_monthly_summary(
                    tenant_email=tenant["email"],
                    emails_sent=tenant.get("emails_sent_this_cycle", 0),
                    email_limit=plan.get("max_monthly_emails", 1000),
                    contacts_count=contacts_count.count or 0,
                    campaigns_count=campaigns_count.count or 0,
                    plan_name=plan.get("name", "Free"),
                    month_label=month_label,
                )
            except Exception as e:
                logger.warning(f"Monthly summary failed for {tenant['id']}: {e}")
    except Exception as e:
        logger.error(f"Monthly summary run failed: {e}")


async def _empty_old_exports(db: Client) -> None:
    """Delete export files older than 24h to save storage."""
    try:
        from datetime import timedelta
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        res = (
            db.table("jobs")
            .select("id, tenant_id, error_log")
            .eq("type", "csv_export")
            .lt("updated_at", cutoff)
            .execute()
        )
        if not res.data:
            return

        files_to_remove = []
        for job in res.data:
            file_path = None
            try:
                meta = json.loads(job.get("error_log") or "{}")
                url = meta.get("result_url") if isinstance(meta, dict) else None
                if url:
                    parsed = urlparse(url)
                    if "/exports/" in parsed.path:
                        file_path = parsed.path.split("/exports/", 1)[1].split("?", 1)[0]
            except Exception:
                file_path = None

            if not file_path:
                file_path = f"{job['tenant_id']}/export_{job['id']}.csv.gz"

            files_to_remove.append(file_path)
            db.table("jobs").delete().eq("id", job["id"]).execute()

        db.storage.from_("exports").remove(files_to_remove)
        logger.info(f"🧹 Cleaned up {len(files_to_remove)} old export files.")
    except Exception as e:
        logger.error(f"Export cleanup failed: {e}")


# ── Main scheduler loop ────────────────────────────────────────────────

async def run_scheduler():
    """
    Main poll loop with distributed Redis lock.

    Flow each iteration:
      1. Try to acquire Redis lock (SET NX EX 90)
      2. If we get it → run the full poll cycle
      3. If we don't → another instance is running → skip and sleep
      4. Write heartbeat so monitoring can detect stalls
      5. Release the lock (only if we own it)
      6. Sleep POLL_INTERVAL seconds
    """
    db: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    )

    # Force HTTP/1.1 to avoid stale HTTP/2 ConnectionTerminated errors
    _http1 = httpx.Client(transport=httpx.HTTPTransport(http2=False), timeout=30.0)
    db.postgrest.session = _http1

    try:
        r = await _get_redis()
    except Exception as e:
        logger.critical(f"[SCHEDULER] Cannot connect to Redis — distributed lock unavailable: {e}")
        logger.critical("[SCHEDULER] ABORTING: Running without a lock risks double-scheduling campaigns.")
        return

    logger.info(
        f"📅 Scheduler started — instance={SCHEDULER_INSTANCE_ID[:8]} "
        f"poll={POLL_INTERVAL}s lock_ttl={SCHEDULER_LOCK_TTL}s"
    )

    # Connect RabbitMQ once at startup
    try:
        await mq_client.connect()
        logger.info("✅ RabbitMQ connected.")
    except Exception as e:
        logger.error(f"RabbitMQ connection failed: {e}")

    while True:
        lock_acquired = False
        try:
            # ── Acquire distributed lock ───────────────────────────────
            lock_acquired = await _acquire_lock(r)

            if not lock_acquired:
                logger.debug(
                    "[LOCK] Another scheduler instance holds the lock — skipping this cycle."
                )
                await _write_heartbeat(r)
                await asyncio.sleep(POLL_INTERVAL)
                continue

            logger.debug(f"[LOCK] Lock acquired by instance {SCHEDULER_INSTANCE_ID[:8]}")

            # ── Poll for due campaigns ─────────────────────────────────
            now_iso = datetime.now(timezone.utc).isoformat()
            res = (
                db.table("campaigns")
                .select("*")
                .eq("status", "scheduled")
                .lte("scheduled_at", now_iso)
                .is_("is_archived", "false")
                .execute()
            )

            due: List[Dict] = res.data or []

            if due:
                logger.info(f"🗓  {len(due)} campaign(s) due — dispatching now")
                for campaign in due:
                    try:
                        await dispatch_campaign(db, campaign, redis_client=r)
                    except Exception as e:
                        logger.error(f"[{campaign['id']}] Dispatch error: {e}")
            else:
                logger.debug("No campaigns due this cycle.")

            # ── Maintenance ────────────────────────────────────────────
            await _check_monthly_summary(db, r)
            await _empty_old_exports(db)

        except Exception as e:
            logger.error(f"Scheduler poll error: {e}")

        finally:
            # Always write heartbeat and release lock before sleeping
            await _write_heartbeat(r)
            if lock_acquired:
                await _release_lock(r)
                logger.debug(f"[LOCK] Lock released by instance {SCHEDULER_INSTANCE_ID[:8]}")

        await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    asyncio.run(run_scheduler())
