# Phase 6: Analytics & Engagement Tracking — Technical Audit

## Overview
Phase 6 enables the platform to track recipient interactions (opens and clicks) with dispatched email campaigns. It introduces a high-concurrency event ingestion API, database schema for event storage, python worker modifications for payload injection, and frontend dashboards for data visualization. This audit covers the implementation status, technical architecture, resolved issues, and pending optimizations.

---

## 1. Database Schema
### `email_events` Table
**Status: Implemented ✅**
The primary storage for all interaction events. It is designed to handle high write-throughput during campaign deployment.

**Columns:**
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key)
- `campaign_id` (UUID, Foreign Key)
- `dispatch_id` (UUID, Foreign Key)
- `subscriber_id` (UUID, Foreign Key)
- `contact_id` (UUID, Foreign Key - Alias for subscriber)
- `event_type` (TEXT - 'open', 'click', 'bounce', 'spam')
- `url` (TEXT - Nullable, stores destination for clicks)
- `user_agent` (TEXT)
- `ip_address` (TEXT)
- `is_bot` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)

**Indexes Implemented:**
- `idx_email_events_tenant`
- `idx_email_events_campaign`
- `idx_email_events_dispatch`
- `idx_email_events_subscriber`

---

## 2. Backend API (`tracking.py`)
### `GET /track/open/{encoded_payload}`
**Status: Implemented ✅**
- Decodes Base64 payload containing `dispatch_id`.
- Records `open` event in the database asynchronously via `BackgroundTasks`.
- Returns a 1x1 transparent GIF with `image/gif` content type.
- **Cache Headers:** `Cache-Control: no-cache, no-store, must-revalidate` applied to prevent Apple/Gmail proxy caching.

### `GET /track/click`
**Status: Implemented ✅**
- Expects a `d` query parameter containing a Base64 JSON payload (`dispatch_id`, `url`).
- Records `click` event asynchronously.
- Issues `HTTP 307 Temporary Redirect` to the original URL.
- Preserves external query parameters (UTM tags) by appending them to the destination URL.

### Bot Detection Engine
**Status: Implemented ✅**
- `_is_bot()` function cross-references `User-Agent` against known crawler fragments (`bot`, `crawler`, `spider`, `googleimageproxy`).
- **Timing Correlation:** If a `click` event occurs less than 2 seconds after an `open` event for the same `dispatch_id`, the click is flagged as `is_bot = true` (assumed security scanner pre-fetch).

---

## 3. Python Worker Modifications (`email_sender.py`)
### Payload Injection
**Status: Implemented ✅**
- Worker generates a Base64-encoded JSON payload for each recipient containing: `{"dispatch_id": "uuid", "campaign_id": "uuid", "tenant_id": "uuid", "recipient_email": "email", "url": "optional"}`.
- **Pixel Injection:** Injects `<img src="{API_BASE_URL}/track/open/{payload}" />` before the closing `</body>` tag.
- **URL Wrapping:** Uses regex/BeautifulSoup to find all `<a href="...">` tags and replaces the `href` with `{API_BASE_URL}/track/click?d={payload}`.

### SMTP Dispatch
**Status: Implemented ✅**
- Continues to utilize AWS SES (`aiosmtplib`) for actual delivery, ensuring high deliverability.

---

## 4. Analytics Data Aggregation (`analytics.py`)
### `GET /analytics/campaigns/{id}`
**Status: Implemented ✅**
- Aggregates data from `campaign_dispatch` and `email_events`.
- Calculates: Total Delivered, Unique Opens, Open Rate, Unique Clicks, Click Rate, Bounce Rate.
- Filters out events where `is_bot = true`.

### `GET /analytics/campaigns/{id}/recipients`
**Status: Implemented ✅**
- Provides exact subscriber-level interaction data.
- Supports filtering by `status` (all, opened, clicked, bounced).

### `GET /analytics/sender-health`
**Status: Implemented ✅**
- Calculates account-wide reputation metrics: Total Sent, Average Open Rate, Global Bounce Rate.

---

## 5. Frontend UI
### Campaign Dashboard (`/campaigns/[id]/analytics`)
**Status: Implemented ✅**
- Displays KPI constraint cards (Opens, Clicks, Delivers).
- Renders the recipient interaction list dynamically.

### Global Dashboard
**Status: Implemented ✅**
- Displays the "Sender Health & Deliverability" widget based on live tenant data.

---

## Known Issues & Resolutions During Phase 6

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| **Campaign Stuck in "Sending"** | Worker attempted to update non-existent `updated_at` column in `campaigns` table. | Removed `updated_at` from the worker's SQL update query. |
| **Silent Tracking Failure** | `campaigns!inner(tenant_id)` PostgREST join failed silently in `tracking.py`, resulting in unrecorded events. | Split the logic into two plain SQL queries (fetch dispatch, then fetch campaign) and added explicit error logging. |
| **Ngrok Browser Warnings** | Opening tracking links locally triggered Ngrok's anti-phishing warning screen (HTTP 6024), preventing the API from receiving the request. | Instructed user to manually bypass the warning screen for testing. Issue will resolve automatically upon production deployment. |
| **Gmail Image Proxy Blocking** | Emails landing in Spam caused Gmail to proxy/cache the tracking pixel without hitting the API. | Instructed user to mark as "Not Spam" and test direct link clicks to verify API pipeline. |
| **Uvicorn API Crash** | `ModuleNotFoundError: No module named 'redis'` inside terminal. | Terminal was executing global python. Forced execution via `.venv/bin/uvicorn`. |

---

## Pending Roadmap (Phase 7 / Phase 6.5)

1. **Schedule Delays (Phase 7):** Currently, the frontend `scheduled_at` date is saved to the database, but the Python worker pulls everything from RabbitMQ immediately. A delay mechanism (RabbitMQ Delayed Message Plugin or Celery Beat) needs to be implemented.
2. **Honeypot Links (Phase 6.5):** Inject invisible `display:none` links via the Python worker to trap sophisticated bots that bypass the 2-second timing check.
3. **Database Partitioning (Phase 6.5):** As the platform scales, `email_events` should be partitioned by month to maintain index performance.
4. **Actionable Segments (Phase 6.5):** UI feature to "Create Segment" directly from the Opened/Clicked recipient list in the Campaign Analytics view.
5. **Domain Verification (Phase 7):** Moving away from generic AWS SES domains to tenant-specific verified sending domains (SPF/DKIM/DMARC) to improve baseline deliverability and minimize Gmail spam folder placement.
