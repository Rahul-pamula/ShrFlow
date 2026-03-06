from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import pandas as pd
import io
import uuid
import asyncio
import re
import random
from contextlib import asynccontextmanager
from typing import Optional
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

# Structured logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Import route modules
from fastapi.staticfiles import StaticFiles
from routes import campaigns, webhooks, auth, onboarding, contacts, templates, assets, password_reset, billing

# Rate limiter — shared instance backed by Redis for multi-tenant scaling
from utils.rate_limiter import limiter

# ── Scheduler — runs inside the API process, no extra terminal needed ─────
def _spintax(text: str) -> str:
    pattern = r'\{([^{}]+)\}'
    while re.search(pattern, text):
        text = re.sub(pattern, lambda m: random.choice(m.group(1).split('|')), text)
    return text

def _merge(text: str, contact: dict) -> str:
    return re.sub(r'\{\{(\w+)(?:\|([^}]*))?\}\}',
        lambda m: str(contact.get(m.group(1), m.group(2) or '') or ''), text)

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
                logger.info(f"[{cid}] Dispatching scheduled campaign '{camp['name']}'")
                try:
                    # Snapshot
                    db.client.table("campaign_snapshots").insert({
                        "id": str(uuid.uuid4()), "campaign_id": cid,
                        "body_snapshot": camp.get("body_html", ""),
                        "subject_snapshot": camp.get("subject", ""),
                        "created_at": now_iso,
                    }).execute()
                    # Mark sending
                    db.client.table("campaigns").update({"status": "sending", "updated_at": now_iso}).eq("id", cid).execute()
                    await redis_client.set_campaign_status(cid, "SENDING")
                    # Audience
                    target = camp.get("audience_target") or "all"
                    q = db.client.table("contacts").select("id, email, first_name, last_name").eq("tenant_id", tid)
                    if target.startswith("batch:"):
                        q = q.eq("import_batch_id", target.split("batch:", 1)[1])
                    contacts = q.execute().data or []
                    if not contacts:
                        db.client.table("campaigns").update({"status": "draft"}).eq("id", cid).execute()
                        continue
                    # Build tasks
                    dispatch_rows, tasks = [], []
                    for c in contacts:
                        did = str(uuid.uuid4())
                        html = _merge(_spintax(camp.get("body_html", "")), c)
                        subj = _merge(_spintax(camp.get("subject", "")), c)
                        dispatch_rows.append({"id": did, "campaign_id": cid, "subscriber_id": c["id"], "status": "PENDING", "created_at": now_iso, "updated_at": now_iso})
                        tasks.append({"dispatch_id": did, "campaign_id": cid, "tenant_id": tid, "recipient_email": c["email"], "recipient_id": c["id"], "subject": subj, "body_html": html})
                    for i in range(0, len(dispatch_rows), 1000):
                        db.client.table("campaign_dispatch").insert(dispatch_rows[i:i+1000]).execute()
                    await mq_client.publish_tasks(tasks)
                    logger.info(f"[{cid}] ✅ {len(tasks)} tasks queued")
                except Exception as e:
                    logger.error(f"[{cid}] Dispatch failed: {e}")
        except Exception as e:
            logging.getLogger("scheduler").error(f"Scheduler poll error: {e}")
        await asyncio.sleep(POLL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: launch background scheduler. Shutdown: cancel it."""
    task = asyncio.create_task(_run_scheduler())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


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

# Mount static files directory for assets
# The directory "assets" will be served at /static/assets
os.makedirs("assets", exist_ok=True)
app.mount("/static/assets", StaticFiles(directory="assets"), name="assets")

# CRITICAL: Add CORS middleware BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers AFTER middleware
app.include_router(webhooks.router)
app.include_router(campaigns.router)
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(contacts.router)
app.include_router(templates.router)
app.include_router(assets.router)
app.include_router(billing.router)
app.include_router(password_reset.router)  # Phase 1.5 — forgot/reset password

# Phase 4 — Events activity feed
from routes import events
app.include_router(events.router)

from routes import unsubscribe
app.include_router(unsubscribe.router)

from routes import tracking
app.include_router(tracking.router)

from routes import events as events_router
app.include_router(events_router.router)

from routes import analytics
app.include_router(analytics.router)


class ContactCreate(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    custom_fields: Optional[dict] = {}

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

from utils.supabase_client import db

@app.post("/fields")
async def create_field(name: str, field_type: str, project_id: str = "default-project"):
    return db.create_custom_field(project_id, name, field_type)

@app.get("/fields")
async def get_fields(project_id: str = "default-project"):
    return db.get_custom_fields(project_id)

@app.post("/contacts/upload")
async def upload_contacts(file: UploadFile = File(...), project_id: str = "default-project"):
    """
    Project 1: Data & Contact Management
    Elite Normalization Engine
    - Multi-tenant isolated (via project_id)
    - Bulk persistent storage in Supabase
    """
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format")

    contents = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        # 1. Normalization
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

        if 'email' not in df.columns:
            raise HTTPException(status_code=400, detail="Missing required column: 'email'")

        df = df[df['email'].str.contains('@', na=False)]
        records = df.to_dict(orient='records')

        # 2. Persist to DB
        db.bulk_insert_contacts(project_id, records)

        return {
            "status": "success",
            "count": len(df),
            "message": f"Successfully ingested {len(df)} contacts."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@app.post("/test-send")
async def test_send(recipient_email: str, subject: str = "Test Email", body: str = "<h1>Hello!</h1>"):
    """
    Project 3: Test-Send Bypass
    Quickly insert a task for immediate processing by the worker.
    """
    trace_id = str(uuid.uuid4())
    
    # Extract domain and ISP
    domain = recipient_email.split('@')[-1] if '@' in recipient_email else 'unknown'
    isp = 'gmail' if 'gmail' in domain else 'outlook' if 'outlook' in domain or 'hotmail' in domain else 'yahoo' if 'yahoo' in domain else 'other'
    
    task = {
        "trace_id": trace_id,
        "recipient_email": recipient_email,
        "recipient_domain": domain,
        "recipient_isp": isp,
        "status": "pending",
        "payload_rendered": f"<html><body><h1>{subject}</h1>{body}<p>Trace: {trace_id}</p></body></html>"
    }
    
    result = db.client.table("email_tasks").insert(task).execute()
    
    return {
        "status": "queued",
        "trace_id": trace_id,
        "message": "Task created. Worker will pick it up shortly."
    }
