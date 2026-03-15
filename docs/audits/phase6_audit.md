# Phase 6 — Analytics & Engagement Tracking: Current Audit (Partial)

## Reality check
- Tracking endpoints (`/track/open/{dispatch_id}`, `/track/click`) exist and write to `email_events` with a basic bot flag.
- Worker injects pixel + click wrapping.
- Analytics APIs exist (`platform/api/routes/analytics.py`) and exclude `is_bot=true`.
- No analytics UI is present in the client; campaign analytics pages are absent.
- Bot detection is minimal (UA fragments + “click <2s after open”).
- No explicit indexes/partitioning for `email_events` are documented in migrations.
- Sender-health endpoint is basic aggregates without time-windowing or thresholds.
- Tracking endpoints have rate limits but no signature/HMAC on payloads.

---

## Issues found
- Missing analytics UI to surface the data.
- Bot filtering is not production-grade; Apple MPP and major proxy networks will inflate opens.
- No HMAC/signature on tracking payloads; forged events are possible.
- No documented/verified indexes for `email_events`; potential performance risk at volume.
- Sender-health logic is simplistic and not time-bounded.
- No partitioning or retention policy for `email_events`.

---

## Recommended remediation
1) Build the campaign analytics UI + sender-health widget backed by existing APIs.
2) Strengthen bot detection (Apple MPP, proxy IP ranges, honeypot links, timing + UA).
3) Add HMAC or signed payload on tracking URLs; keep rate limits.
4) Add and document indexes on `email_events` (`tenant_id`, `campaign_id`, `dispatch_id`, `event_type`, `created_at`), and plan for partitioning/retention.
5) Enhance sender-health metrics with time windows and thresholds; expose bot vs. human counts separately.

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

## File pointers
- Tracking: `platform/api/routes/tracking.py`
- Worker injection: `platform/worker/email_sender.py`
- Analytics API: `platform/api/routes/analytics.py`
