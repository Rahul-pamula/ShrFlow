from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx
import httpcore
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import asyncio
from contextlib import asynccontextmanager
import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timezone

ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ROOT_ENV, override=True)

# Structured logging
import logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Import route modules
from fastapi.staticfiles import StaticFiles
from routes import campaigns, webhooks, auth, onboarding, contacts, templates, assets, password_reset, billing, settings, domains, team, senders, infrastructure, notifications, account

# Rate limiter — shared instance backed by Redis for multi-tenant scaling
from utils.rate_limiter import limiter

from services.campaign_dispatch_service import (
    claim_scheduled_campaign,
    fetch_contacts_for_target,
    queue_campaign_dispatch,
)

# IMPORTANT: Set ENABLE_EMBEDDED_CAMPAIGN_SCHEDULER=false in production.
# Use the standalone platform/worker/scheduler.py with Redis distributed lock instead.
# Running BOTH simultaneously will double-schedule every campaign.
ENABLE_EMBEDDED_CAMPAIGN_SCHEDULER = os.getenv("ENABLE_EMBEDDED_CAMPAIGN_SCHEDULER", "false").lower() == "true"

async def _run_scheduler():
    """Polls every 60 s for campaigns due to be sent and dispatches them."""
    from utils.supabase_client import db
    from utils.rabbitmq_client import mq_client
    from utils.redis_client import redis_client
    import logging
    logger = logging.getLogger("scheduler")
    POLL = 60
    logger.info("📅 Campaign scheduler started (embedded in API)")
    while True:
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            res = db.client.table("campaigns").select("*") \
                .eq("status", "scheduled").lte("scheduled_at", now_iso) \
                .is_("is_archived", "false").execute()
            for camp in (res.data or []):
                cid, tid = camp["id"], camp["tenant_id"]
                if not claim_scheduled_campaign(db.client, cid, tid, now_iso):
                    logger.info(f"[{cid}] Skip embedded scheduler dispatch; campaign already claimed.")
                    continue
                logger.info(f"[{cid}] Dispatching scheduled campaign '{camp['name']}'")
                try:
                    contacts, _ = fetch_contacts_for_target(
                        supabase=db.client,
                        tenant_id=tid,
                        target=camp.get("audience_target") or "all",
                        exclude_suppressed=True,
                    )
                    if not contacts:
                        db.client.table("campaigns").update({"status": "draft"}).eq("id", cid).execute()
                        continue
                    dispatch_result = await queue_campaign_dispatch(
                        supabase=db.client,
                        mq_client=mq_client,
                        campaign=camp,
                        tenant_id=tid,
                        contacts=contacts,
                        redis_client=redis_client,
                        mark_campaign_sending=False,
                        touch_scheduled_at=False,
                    )
                    logger.info(f"[{cid}] ✅ {dispatch_result['dispatched']} tasks queued")
                except Exception as e:
                    logger.error(f"[{cid}] Dispatch failed: {e}")
        except Exception as e:
            if "Server disconnected" in str(e):
                logging.getLogger("scheduler").warning("Supabase connection dropped. Retrying in 5s...")
                await asyncio.sleep(5)
                continue
            logging.getLogger("scheduler").error(f"Scheduler poll error: {e}")
        await asyncio.sleep(POLL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: launch background scheduler + connect RabbitMQ + init asyncpg pool. Shutdown: close all."""
    from utils.rabbitmq_client import mq_client
    from utils.db_engine import init_pool, close_pool
    import logging
    startup_logger = logging.getLogger("api_startup")

    # 1. asyncpg connection pool (required for RLS)
    try:
        await init_pool()
        startup_logger.info("asyncpg pool ready.")
    except Exception as e:
        startup_logger.error(f"asyncpg pool init failed: {e}")

    # 2. RabbitMQ
    try:
        await mq_client.connect()
        startup_logger.info("RabbitMQ connected and queues declared on startup.")
    except Exception as e:
        startup_logger.error(f"Failed to connect to RabbitMQ on startup: {e}")

    task = None
    if ENABLE_EMBEDDED_CAMPAIGN_SCHEDULER:
        logging.getLogger("api_startup").warning(
            "⚠️  Embedded scheduler is ENABLED. This is safe only in single-replica dev mode. "
            "In production, use platform/worker/scheduler.py with Redis distributed lock instead."
        )
        task = asyncio.create_task(_run_scheduler())

    yield

    if task is not None:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    await close_pool()
    startup_logger.info("asyncpg pool closed.")


# ── App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Email Engine API",
    description="Ultimate Email Marketing Platform",
    version="1.5.0",
    lifespan=lifespan,
)

# Add rate limit exceeded handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── HTTP/2 stale-connection retry middleware ─────────────────────────────────
# Supabase closes idle HTTP/2 connections. When the pool reuses a dead stream,
# httpx raises RemoteProtocolError. We catch it here and retry ONCE — from the
# user's perspective the request just works on the first try.
@app.middleware("http")
async def retry_on_connection_error(request: Request, call_next):
    try:
        return await call_next(request)
    except (httpx.RemoteProtocolError, httpcore.RemoteProtocolError):
        logging.getLogger("email_engine").warning(
            f"[retry] Stale HTTP/2 connection on {request.url.path} — retrying once"
        )
        try:
            return await call_next(request)
        except Exception as e:
            logging.getLogger("email_engine").error(f"[retry] Second attempt also failed: {e}")
            return JSONResponse(status_code=503, content={"detail": "Service temporarily unavailable. Please try again."})

# Mount static files directory for assets
# The directory "uploads" will be served at /uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CRITICAL: Add CORS middleware BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("FRONTEND_URL", "http://localhost:3000").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers AFTER middleware
app.include_router(webhooks.router)
app.include_router(campaigns.router)
app.include_router(auth.router)
app.include_router(account.router)
app.include_router(onboarding.router)
app.include_router(contacts.router)

# Phase 13 — Template Service (Microservice Decomposition)
# This domain is currently being extracted to platform/services/template_service
app.include_router(templates.router)
app.include_router(assets.router)
app.include_router(billing.router)
app.include_router(settings.router)  # Phase 8 — Account Settings
app.include_router(domains.router)   # Phase 8C — Domain Verification
app.include_router(team.router)      # Phase 9 — Team Workspaces (Enterprise RBAC)
app.include_router(senders.router)   # Phase 10 — Anti-Spoofing
app.include_router(infrastructure.router)
app.include_router(password_reset.router)
app.include_router(notifications.router)

# Phase 4 — Events activity feed
from routes import events
app.include_router(events.router)

from routes import unsubscribe
app.include_router(unsubscribe.router)

from routes import tracking
app.include_router(tracking.router)

from routes import analytics
app.include_router(analytics.router)


@app.get("/health")
async def health_check():
    """Health check endpoint — monitored by company IT for uptime alerts."""
    from utils.supabase_client import db
    db_status = "unknown"
    try:
        db.client.table("tenants").select("id").limit(1).execute()
        db_status = "connected"
    except Exception:
        db_status = "error"
    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "version": "1.5.0",
        "db": db_status,
    }
