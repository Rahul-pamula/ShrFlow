# Phase 5 — Delivery Engine

> **Status: ⚠ Partially Complete**  
> **Last Reviewed:** March 15, 2026

## What’s in place today (code-verified)
- Campaign send flow snapshots content and enqueues dispatch tasks. Audience building excludes `bounced` / `unsubscribed` contacts via `fetch_contacts_for_target(..., exclude_suppressed=True)` in `platform/api/services/campaign_dispatch_service.py`.
- Worker lifecycle (RabbitMQ → Redis-aware):
  1) Redis check for `CANCELLED/PAUSED`.  
  2) Bounce-rate circuit breaker (Redis metric) can auto-pause.  
  3) Atomic claim of dispatch row → `PROCESSING`.  
  4) Injects unsubscribe footer, tracking pixel, and click-wrapping links.  
  5) Sends via SMTP/SES when creds are set; otherwise simulates.  
  6) Marks dispatch `DISPATCHED`, auto-marks campaign `sent` when no pending rows.  
  7) On any exception: dispatch → `FAILED`, contact → `bounced`.
- Unsubscribe system: HMAC token in every email footer; `GET/POST /unsubscribe` mark contact unsubscribed; `POST /resubscribe` re-activates by email.
- Bounce/Spam webhooks: `/webhooks/bounce`, `/webhooks/spam`, `/webhooks/ses` update contact status (`bounced` or `unsubscribed`).
- Daily send limit pre-check in `send_campaign`: respects `daily_send_limit`/`daily_sent_count`, resets counter daily, increments after enqueue.
- Tracking hooks implemented (pixel + click redirect), though analytics display is deferred to Phase 6.

## Gaps vs. plan
- Webhook security: no signature verification on `/webhooks/bounce|/spam|/ses`; any POST can suppress contacts.
- Daily send limit: pre-flight only; a single send can exceed remaining quota (no cap by remaining quota).
- Worker error handling: any exception marks contact as `bounced`; should only bounce on permanent SMTP/SES failures and retry transient errors.
- Mid-send unsubscribe check: worker does not re-check `contacts.status` before send; a user who unsubscribes after queuing can still get the email.
- Physical address: hard-coded “Email Engine Inc. • 123 Main Street …”; needs per-tenant address from settings.
- Resubscribe endpoint is unauthenticated; anyone knowing an email can re-activate it.
- SES/SMTP region & sandbox: sends rely on valid SMTP/SES credentials; in SES sandbox all recipients must be verified.

## Recommendations to complete Phase 5
1) Add webhook signature/verification (SES SNS signature validation; Mailtrap/provider HMAC header). Reject unsigned requests.
2) Cap sends by remaining daily quota: `remaining = limit - daily_sent_count`; trim audience or return 429 with remaining count.
3) Classify worker failures: only mark `bounced` on permanent 5xx SMTP/SES responses; requeue/transient errors should retry.
4) Final suppression check in worker before send: fetch contact status; if `bounced/unsubscribed`, mark dispatch `CANCELLED` and ack without sending.
5) Tenant-configurable footer address sourced from settings; fall back to a safe default only in dev.
6) Protect `POST /resubscribe` (short-lived code or signed token) to prevent arbitrary re-subscribe.
7) Document SES sandbox guidance in UI: warn when SMTP/SES creds are missing or sandboxed; surface verification errors in campaign detail “Failed Deliveries.”

## Key file references
- Worker: `platform/worker/email_sender.py`
- Dispatch builder & audience filtering: `platform/api/services/campaign_dispatch_service.py`
- Campaign send endpoint: `platform/api/routes/campaigns.py`
- Webhooks: `platform/api/routes/webhooks.py`
- Unsubscribe/resubscribe: `platform/api/routes/unsubscribe.py`
- Unsubscribe page: `platform/client/src/app/unsubscribe/page.tsx`
