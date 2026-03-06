# Phase 4 — Campaign Orchestration

> **Verification Status: ✅ VERIFIED**
> **Last Verified:** March 3, 2026
>
> | Component | Status | Verification Method |
> |-----------|--------|---------------------|
> | **Campaign CRUD** | ✅ | Verified `routes/campaigns.py` POST/GET/PATCH/DELETE endpoints |
> | **Campaign Wizard (4-Step UI)** | ✅ | Verified `CampaignWizard/` components Step1–Step4 |
> | **Pre-Send Checklist** | ✅ | Verified `Step4Review.tsx` validation logic |
> | **Scheduled Sending** | ✅ | Verified `POST /campaigns/{id}/schedule`, embedded scheduler in `main.py` |
> | **Pause / Resume / Cancel** | ✅ | Verified `campaigns.py` multi-action endpoints and Redis integration |
> | **Draft Delete / Archive** | ✅ | Verified `DELETE /campaigns/{id}` conditional logic and `is_archived` column |
> | **Send Test Email** | ✅ | Verified `POST /campaigns/{id}/test` endpoint and modal UI |
> | **State Persistence** | ✅ | Verified `localStorage` draft saving in wizard |

---

## Overview

Phase 4 builds the **Campaign Orchestration layer** — the full lifecycle of creating, reviewing, scheduling, sending, and managing email campaigns. It connects the user-facing wizard UI to the backend delivery pipeline via a clean REST API and Redis-assisted state management.

**Tech Stack:** FastAPI (Python) · Supabase (PostgreSQL) · Redis (Upstash) · Next.js (React) · RabbitMQ · `lucide-react`

---

## Campaign Lifecycle

```
User fills wizard (4 steps)
         │
         ▼
  POST /campaigns/ → creates draft
         │
    ┌────┴────────────┐
    │                 │
 Send Now         Schedule Later
    │                 │
    ▼                 ▼
POST /send      POST /schedule
    │           (saves scheduled_at,
    │            sets status='scheduled')
    │                 │
    ▼                 ▼ (scheduler polls every 60s)
 RabbitMQ ←──── Embedded AsyncIO Scheduler
    │                (in main.py lifespan)
    ▼
  Worker (email_sender.py)
  picks up jobs, injects footer,
  sends via SMTP, updates DB
    │
    ▼
Campaign status → 'sent' (auto, when last email dispatched)
```

---

## Campaign Wizard (4 Steps)

### Step 1 — Details
**Component:** `CampaignWizard/Steps/Step1Details.tsx`

| Field | Validation |
|-------|------------|
| `Campaign Name` | Required, non-empty |
| `Subject Line` | Required, non-empty |

Progress is auto-saved to `localStorage` as a draft.

### Step 2 — Audience
**Component:** `CampaignWizard/Steps/Step2Audience.tsx`

| Selection | What It Does |
|-----------|-------------|
| **All Contacts** | Sends to every contact in the tenant's database |
| **Specific Import Batch** | Filters by `import_batch_id` — useful for targeting one CSV upload |

### Step 3 — Content
**Component:** `CampaignWizard/Steps/Step3Content.tsx`

- User can compose HTML from scratch or select a saved **Template**.
- If a template is selected, it pre-fills the HTML editor.
- Supports **Spintax** `{Hello|Hi|Hey}` and **Merge Tags** `{{first_name}}`.

### Step 4 — Review & Launch
**Component:** `CampaignWizard/Steps/Step4Review.tsx`

Two sub-sections:
1. **Pre-Send Checklist** — 4 checks (name, subject, content, audience). Launch button is disabled until all pass.
2. **Send Mode Selector:**
   - ⚡ **Send Now** — immediately calls `POST /campaigns/{id}/send`
   - 📅 **Schedule for Later** — shows datetime picker, calls `POST /campaigns/{id}/schedule`

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/campaigns/` | JWT | Create new campaign (status: draft) |
| `GET` | `/campaigns/` | JWT | List all non-archived campaigns |
| `GET` | `/campaigns/{id}` | JWT | Get single campaign |
| `PATCH` | `/campaigns/{id}` | JWT | Update campaign fields |
| `DELETE` | `/campaigns/{id}` | JWT | Delete draft OR archive sent campaign |
| `POST` | `/campaigns/{id}/send` | JWT | Immediately launch campaign |
| `POST` | `/campaigns/{id}/schedule` | JWT | Schedule campaign for future time |
| `POST` | `/campaigns/{id}/pause` | JWT | Pause active campaign via Redis |
| `POST` | `/campaigns/{id}/resume` | JWT | Resume paused campaign |
| `POST` | `/campaigns/{id}/cancel` | JWT | Cancel campaign (or mark as sent if already complete) |
| `POST` | `/campaigns/{id}/test` | JWT | Send a test preview email |
| `GET` | `/campaigns/{id}/dispatch` | JWT | Get all per-recipient dispatch records |

---

## State Machine

```
            ┌──────────────┐
            │    DRAFT     │
            └──────┬───────┘
                   │ POST /send or /schedule
       ┌───────────┴──────────────┐
       │                          │
       ▼                          ▼
  ┌─────────┐              ┌──────────────┐
  │ SENDING │              │  SCHEDULED   │ ← scheduler picks up at scheduled_at
  └────┬────┘              └──────────────┘
       │
  ┌────┴──────────────────────────┐
  │               │               │
  ▼               ▼               ▼
┌──────┐      ┌────────┐    ┌──────────┐
│ SENT │      │ PAUSED │    │CANCELLED │
└──────┘      └───┬────┘    └──────────┘
                  │ POST /resume
              ┌───▼────┐
              │SENDING │
              └────────┘
```

**Redis is the source of truth for live state** (SENDING / PAUSED / CANCELLED). Supabase is updated for persistence and queries.

---

## Delete vs Archive Logic

| Campaign Status | Action | Why |
|----------------|--------|-----|
| `draft` | **Permanently deleted** from DB | No emails sent → no analytics impact |
| `sent`, `sending`, `paused`, `cancelled` | **Archived** (`is_archived = true`) | Unsubscribe links in sent emails must remain valid (CAN-SPAM) |

Archived campaigns are **hidden** from the campaign list (`GET /campaigns/` filters `is_archived = false`) but remain in the database.

---

## Scheduled Sending

```
POST /campaigns/{id}/schedule
  └── Validates: status must be 'draft' or 'scheduled'
  └── Validates: scheduled_at must be in the future
  └── Updates: status = 'scheduled', scheduled_at saved as UTC ISO-8601

Background Scheduler (runs inside API process via asyncio lifespan):
  └── Polls Supabase every 60 seconds
  └── Query: status='scheduled' AND scheduled_at <= NOW() AND is_archived=false
  └── For each found campaign: dispatches to RabbitMQ (identical to /send flow)
  └── No extra terminal needed — starts with uvicorn
```

---

## Database Schema — New Columns Added in Phase 4

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `campaigns` | `status` | TEXT | Lifecycle state (draft/scheduled/sending/sent/paused/cancelled) |
| `campaigns` | `scheduled_at` | TIMESTAMPTZ | When to send (for scheduled mode) |
| `campaigns` | `audience_target` | TEXT | `'all'` or `'batch:<uuid>'` |
| `campaigns` | `is_archived` | BOOLEAN | Soft-delete for sent campaigns |
| `campaign_dispatch` | `status` | TEXT | Per-recipient status (PENDING/PROCESSING/DISPATCHED/FAILED/CANCELLED) |
| `campaign_dispatch` | `ses_message_id` | TEXT | SES/SMTP response ID |
| `campaign_dispatch` | `error_log` | TEXT | Failure reason if status=FAILED |
| `campaign_snapshots` | `body_snapshot` | TEXT | Frozen HTML at time of send |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CampaignWizard (Step1 → Step2 → Step3 → Step4)      │   │
│  │  Campaign List Page  │  Campaign Detail Page          │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ JWT Bearer Token
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  FASTAPI (Backend API)                        │
│  ┌───────────────────┐  ┌──────────────────────────────┐    │
│  │  routes/campaigns │  │  Async Scheduler (lifespan)  │    │
│  │  POST /send       │  │  Polls every 60s             │    │
│  │  POST /schedule   │  │  Triggers /send pipeline     │    │
│  │  POST /pause etc. │  └─────────────┬────────────────┘    │
│  └────────┬──────────┘                │                      │
│           │                           │                      │
│           └──────────────┬────────────┘                      │
│                          │ publish_tasks()                    │
└──────────────────────────┼────────────────────────────────── ┘
                           │
           ┌───────────────┴────────────┐
           │                            │
           ▼                            ▼
  ┌──────────────┐            ┌──────────────────┐
  │   RABBITMQ   │            │   REDIS (Upstash) │
  │  (CloudAMQP) │            │   Campaign State  │
  └──────┬───────┘            │  SENDING/PAUSED   │
         │                    └──────────────────┘
         ▼
  ┌──────────────────┐
  │  email_sender.py │ ← Python Worker (Terminal 3)
  │  (Worker)        │
  │  - Reads queue   │
  │  - Injects footer│
  │  - Sends SMTP    │
  │  - Updates DB    │
  └──────────────────┘
```

---

## Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `routes/campaigns.py` | All campaign API endpoints | ~450 |
| `main.py` | App + embedded async scheduler | ~240 |
| `platform/worker/email_sender.py` | Delivery worker | ~225 |
| `CampaignWizard/Steps/Step1Details.tsx` | Name + Subject inputs | ~80 |
| `CampaignWizard/Steps/Step2Audience.tsx` | Audience selector | ~120 |
| `CampaignWizard/Steps/Step3Content.tsx` | HTML editor + template picker | ~180 |
| `CampaignWizard/Steps/Step4Review.tsx` | Checklist + Send/Schedule | ~260 |
| `app/campaigns/page.tsx` | Campaigns list with Delete/Archive | ~300 |
| `app/campaigns/[id]/page.tsx` | Campaign detail + Pause/Cancel | ~280 |
