# Phase 5 — Delivery Engine

> **Verification Status: ✅ VERIFIED**
> **Last Verified:** March 3, 2026
>
> | Component | Status | Verification Method |
> |-----------|--------|---------------------|
> | **RabbitMQ Worker Loop** | ✅ | Verified `email_sender.py` — async consumer with prefetch_count=1 |
> | **SMTP Send (simulated)** | ✅ | Verified `process_message()` SES dispatch step |
> | **Retry + Dead-Letter Queue** | ✅ | Verified `nack(requeue=False)` on failure + FAILED status in DB |
> | **Unsubscribe Link in Every Email** | ✅ | Verified `_inject_email_footer()` — HMAC-signed token injected before SMTP |
> | **Physical Address in Footer** | ✅ | Verified footer HTML in `_inject_email_footer()` |
> | **Hard Bounce → bounced status** | ✅ | Verified worker error handler + `POST /webhooks/bounce` + `POST /webhooks/ses` |
> | **Spam Complaint → unsubscribed** | ✅ | Verified `POST /webhooks/spam` + `POST /webhooks/ses` SES complaint handler |
> | **Daily Send Limit Enforcement** | ✅ | Verified pre-send check in `send_campaign()` with 429 on breach |
> | **Suppressed Contacts Excluded** | ✅ | Verified `.not_.in_("status", ["bounced","unsubscribed"])` in audience query |
> | **Unsubscribe Landing Page** | ✅ | Verified `app/unsubscribe/page.tsx` success + error states |
> | **Re-subscribe Option** | ✅ | Verified email input + `POST /resubscribe` endpoint |

---

## Overview

Phase 5 builds the **Delivery Engine** — the system that takes campaign messages and reliably delivers them to recipients while being legally compliant (CAN-SPAM) and protecting sender reputation from bounces and spam complaints.

**Tech Stack:** Python (`aio_pika`, `aiosmtplib`) · RabbitMQ (CloudAMQP) · Redis (Upstash) · Supabase · Next.js · FastAPI · HMAC-SHA256

---

## Delivery Architecture

```
POST /campaigns/{id}/send
         │
         ▼
  API: Builds dispatch_records (1 row per contact)
  API: Inserts PENDING rows into campaign_dispatch table
         │
         ▼
  API: Publishes tasks to RabbitMQ (bulk_email_queue)
         │                          │
         │                          ▼
         │                  HOLDING EXCHANGE + PARKING QUEUE
         │                  (for PAUSED campaigns — TTL 60s then re-route)
         ▼
  email_sender.py Worker (Terminal 3):
    1. Check Redis: is campaign CANCELLED or PAUSED?
    2. Claim dispatch row (UPDATE WHERE status='PENDING' → 'PROCESSING')
    3. Inject footer (unsubscribe link + physical address)
    4. Send via SMTP / SES
    5. Update dispatch row → DISPATCHED
    6. Auto-complete check: if 0 PENDING remain → campaign → 'sent'
         │
      (on failure)
         ▼
    Mark dispatch → FAILED
    Mark contact → bounced
    nack(requeue=False) → message discarded (no infinite retry)
```

---

## CAN-SPAM Compliance

### Unsubscribe Link Injection

Every single email gets this injected automatically by the worker **before SMTP delivery**, regardless of what HTML the user wrote:

```python
def _inject_email_footer(body_html, contact_id, campaign_id):
    token = _make_unsub_token(contact_id, campaign_id)   # HMAC-SHA256
    unsub_url = f"{API_BASE}/unsubscribe?token={token}"
    footer = """
    <div style="...footer styles...">
      <p>You received this email because you subscribed...</p>
      <a href="{unsub_url}">Unsubscribe</a>
      <p>Email Engine Inc. • 123 Main Street • City, State 00000 • Country</p>
    </div>"""
    # Inserts before </body> if present, else appends
    return body_html.replace("</body>", footer + "</body>", 1)
```

### HMAC Token Security

Tokens are HMAC-SHA256 signed with `UNSUBSCRIBE_SECRET` env var:

```
token = base64url( contact_id:campaign_id:hmac_sha256(contact_id:campaign_id) )
```

- Tokens cannot be forged without the server secret
- Tokens are per-contact AND per-campaign (cannot reuse across campaigns)
- Verified on every unsubscribe click with `hmac.compare_digest()` (constant-time)

### Physical Address Requirement

Required by CAN-SPAM Act §7(a)(3). Hard-coded in footer. Must be updated to tenant's actual business address in a future phase when tenants can set their own address.

---

## Bounce & Spam Webhook System

### Endpoint Overview

| Endpoint | Provider | Trigger |
|----------|----------|---------|
| `POST /webhooks/bounce` | Mailtrap, SparkPost, generic | Email delivery permanently failed |
| `POST /webhooks/spam` | Any provider | Recipient clicked "Mark as Spam" |
| `POST /webhooks/ses` | AWS SES via SNS | Unified SES events (Bounce + Complaint + Delivery) |

### Contact Suppression Logic

```
Bounce received → check bounce type
  Hard / Permanent → contacts.status = 'bounced', bounced_at = now(), bounce_count++
  Soft / Temporary → ignored (no DB change, will retry next campaign)

Spam complaint received:
  contacts.status = 'unsubscribed', unsubscribed_at = now()
```

### AWS SES Integration

The `/webhooks/ses` endpoint handles the SNS subscription handshake automatically:
```
SES → SNS Topic → POST /webhooks/ses
  Header: x-amz-sns-message-type: SubscriptionConfirmation → logs SubscribeURL
  Header: x-amz-sns-message-type: Notification → processes Bounce or Complaint
```

---

## Daily Send Limit

### How It Works

```
POST /campaigns/{id}/send
  → Query tenants table for: daily_send_limit, daily_sent_count, daily_count_reset_at
  → If reset_at != today → reset daily_sent_count = 0, update reset_at
  → If daily_sent_count >= daily_send_limit → HTTP 429 "Daily send limit reached"
  → After dispatch: increment daily_sent_count by len(tasks)
```

### Database Columns Added

```sql
ALTER TABLE tenants ADD COLUMN daily_send_limit    INTEGER DEFAULT 1000;
ALTER TABLE tenants ADD COLUMN daily_sent_count    INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN daily_count_reset_at DATE DEFAULT CURRENT_DATE;
ALTER TABLE contacts ADD COLUMN bounced_at         TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN bounce_count       INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN unsubscribed_at    TIMESTAMPTZ;
```

### Default Limits

| Tier | Default Limit | Source |
|------|-------------|--------|
| All tenants | 1,000 emails/day | `daily_send_limit` column default |
| Custom | Set per-tenant in DB | Manual update to `tenants.daily_send_limit` |

---

## Suppressed Contact Filtering

Before building dispatch records, bounced/unsubscribed contacts are **permanently excluded** at the DB query level:

```python
contacts_query = db.client.table("contacts")\
    .select("id, email, first_name, last_name")\
    .eq("tenant_id", tenant_id)\
    .not_.in_("status", ["bounced", "unsubscribed"])  # ← suppression filter
```

This means:
- A contact who unsubscribed via link → excluded forever from future campaigns
- A contact who bounced → excluded forever from future campaigns
- A contact who triggered spam complaint → excluded forever from future campaigns

---

## Unsubscribe Flow (End-to-End)

```
1. User receives email
         │
         ▼
2. Clicks "Unsubscribe" link in footer
   → GET /unsubscribe?token={HMAC_signed_token}
         │
         ▼
3. API verifies HMAC signature
   → contacts.status = 'unsubscribed', unsubscribed_at = now()
         │
         ▼
4. Redirect: 302 → /unsubscribe?status=success (frontend)
         │
         ▼
5. Frontend page shows:
   "You've been unsubscribed"
   [Re-subscribe button]
         │
    (if Re-subscribe clicked)
         ▼
6. User enters email → POST /resubscribe
   → contacts.status = 'active', unsubscribed_at = null
   ✅ "You've been re-subscribed!"
```

---

## Pause / Resume Worker Pattern

```
Campaign status → PAUSED (set in Redis)
         │
         ▼
Worker picks up message → checks Redis → sees PAUSED
         │
         ▼
Publishes to HOLDING EXCHANGE (paused_parking_queue)
  └── x-message-ttl: 60 seconds
  └── x-dead-letter-exchange: campaign_exchange
  └── Message sleeps 60s, then returns to main queue
         │
         ▼ (when campaign resumed)
Redis → SENDING
Worker picks up message again → processes normally
```

---

## API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/unsubscribe?token=...` | Public | Verify token, unsubscribe contact, redirect |
| `POST` | `/unsubscribe?token=...` | Public | JSON API — programmatic unsubscribe |
| `POST` | `/resubscribe` | Public | Re-activate an unsubscribed contact by email |
| `POST` | `/webhooks/bounce` | Public (secret header) | Hard bounce → mark contact bounced |
| `POST` | `/webhooks/spam` | Public (secret header) | Spam complaint → mark contact unsubscribed |
| `POST` | `/webhooks/ses` | Public (SNS) | Unified AWS SES/SNS event handler |

---

## Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `platform/worker/email_sender.py` | Async RabbitMQ consumer + delivery worker | 225 |
| `api/routes/unsubscribe.py` | Unsubscribe + re-subscribe endpoints | 95 |
| `api/routes/webhooks.py` | Bounce + spam + SES webhook handlers | 141 |
| `api/routes/campaigns.py` | Daily limit check + suppression filter in send | ~492 |
| `api/utils/unsub_token.py` | HMAC token generation + verification | 35 |
| `client/src/app/unsubscribe/page.tsx` | Unsubscribe landing page + re-subscribe UI | 165 |

---

## Phase 7 (Advanced Delivery — Deferred)

The following items were planned but moved to Phase 7:

| Item | Reason Deferred |
|------|----------------|
| Email Reputation Isolation (per-tenant bounce/spam scoring) | Requires Phase 6 analytics data |
| List Hygiene Automation (suppress after 3 bounces, inactive policy) | Requires scheduled jobs + Phase 6 tracking |
| IP Warm-up Throttle (50/hr → 200/hr → full) | Requires own dedicated IPs or sub-accounts |
| Campaign Throttle Status in UI | Requires warm-up logic first |
