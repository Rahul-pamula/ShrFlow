# Deep Research: Phase 7 (Plan Enforcement) & Phase 7.5 (Infrastructure)

This document provides a comprehensive architectural breakdown of Phase 7 and 7.5. It explains how these features connect to the analytics engine we built in Phase 6, what open-source reference architectures we are emulating, and exactly how the "Fake Payments / 100% Discount" flow will work for testing.

---

## 1. How Phase 7 Connects to Phase 6 (Analytics)

In Phase 6, we built the intelligence engine (`email_events`, tracking pixels, and basic sender health). 

**Phase 7 is where we *act* on that intelligence.** 
Without Phase 7, a malicious user could sign up for free, use your AWS SES account to send 1,000,000 spam emails, and rack up a massive AWS bill while ruining your domain reputation. Phase 7 is the "Brakes and Guardrails" of the entire SaaS.

**The vital link between Phase 6 and Phase 7:**
In Phase 6, we built the `/webhooks/bounce` endpoint to catch bounces. In Phase 7, we take that data and enforce rules:
*   *Rule:* If the `Bounce Rate > 2%` (calculated in Phase 6), the Python Worker will automatically email the Tenant Owner warning them to clean their list.
*   *Rule:* If the `Bounce Rate > 5%`, the API immediately blocks all future campaign sends for that tenant until an admin reviews it. (This protects your AWS SES account from being suspended).

---

## 2. Phase 7: Plan Enforcement (The Core Logic)

For MVP testing, we won't integrate Stripe yet. Instead, we will build the internal billing logic and give everyone a simulated "Free" or "100% Discounted Pro" plan. This allows you to test the restriction logic without dealing with credit card gateways.

### Database Architecture
We need to connect the `tenants` table to a new `plans` catalog.

**`plans` Table (System-level, not tenant-level)**
*   `id`: UUID
*   `name`: "Free", "Pro", "Enterprise"
*   `max_contacts`: 500, 10000, 100000
*   `max_monthly_emails`: 1000, 50000, 500000
*   `allow_custom_domain`: false, true, true
*   `price_monthly`: 0, 49, 199

**`tenants` Table (Adding usage columns)**
*   `plan_id`: UUID (Foreign key to plans)
*   `billing_cycle_start`: Date
*   `emails_sent_this_cycle`: Integer (Resets every 30 days)

### The API Enforcement Layer (Middleware)
Every time a user hits `POST /campaigns/{id}/send`:
1. The API checks `tenants.emails_sent_this_cycle`.
2. It checks `plans.max_monthly_emails`.
3. If `sent + campaign_audience_size > limit`, return HTTP 403 Forbidden with message: *"Monthly limit reached. Upgrade your plan."*

### Reference Repositories
*   **PostHog:** Their open-source repository handles "Billing Enforcement" extremely well. They have a `billing_status` middleware that intercepts API requests if usage quotas (like event capture) are exceeded. We will mimic their fast, redis-backed quota checking.
*   **Supabase (GoTrue/PostgREST):** Uses Row Level Security (RLS) policies to limit rows. While we can't use RLS for complex quota math, we emulate their pattern of rejecting writes *before* any background processing happens.

---

## 3. Phase 7.5: Production Infrastructure

Phase 7.5 separates a "dev project on your laptop" from a "scaleable SaaS on the internet". 

### Rate Limiting (P0 - Critical)
We currently have no API rate limiting. Someone could write a script to hit `/auth/login` 10,000 times a second and crash your Supabase database.
*   **Implementation:** We will use `slowapi` (a FastAPI rate-limiting library backed by Redis).
*   **Rules:** Limit `/auth` to 5 requests/minute. Limit `/campaigns/send` to 2 requests/minute. Limit track/open endpoints to 5000 requests/minute.

### Background Job Status (The Generic `jobs` Table)
Right now, when a user imports a CSV, they stare at a spinning loader because the API blocks until it's done.
*   **Implementation:** We create a `jobs` DB table. When the user uploads a CSV, we instantly return `job_id: 123`. The Python Worker processes the CSV. The React frontend asks `GET /jobs/123` every 2 seconds to draw a smooth progress bar.

### Worker Concurrency & Idempotency
AWS SES is strict. You cannot send the same email twice.
If we run *two* Python Workers to handle high load, they might grab the same row in `campaign_dispatch`.
*   **Solution (Locking):** We add `locked_by` (UUID) to `campaign_dispatch`. When Worker A queries for emails, it runs `UPDATE campaign_dispatch SET locked_by = 'Worker-A-ID' WHERE status = 'PENDING' RETURNING *`. Worker B ignores locked rows.
*   **Solution (Idempotency):** After SES successfully sends, we save the `SES Message ID`. If the worker crashes and restarts, it checks if an SES ID already exists before trying to send again.

### Domain Verification Config
*   **The Problem:** AWS SES requires you to verify the domain you send *from*.
*   **The Flow:** 
    1. Tenant types "mybusiness.com" into the Settings UI.
    2. We use AWS Route53 API (or manual display) to generate TXT records for SPF and DKIM.
    3. We display: *"Please log into GoDaddy and add these TXT records."*
    4. Tenant clicks "Verify". Our API queries global DNS records. If they match, `domain_verified = true`.
    
*(This is how Resend, SendGrid, and Mailgun all handle onboarding).*

---

## 4. How the "100% Fake Payment" Flow Works

To test all of this without Stripe:

1.  **Plan Catalog:** We hardcode the 3 plans (Free, Pro, Enterprise) into the database.
2.  **Signup Default:** Every new tenant defaults to `plan_id = FREE_PLAN_ID`.
3.  **The "Upgrade" Button:** On the UI, the user clicks "Upgrade to Pro".
4.  **The Mock API:** Instead of redirecting to Stripe Checkout, our `POST /billing/upgrade` endpoint simply does this:
    ```python
    db.table("tenants").update({"plan_id": PRO_PLAN_ID}).eq("id", tenant_id).execute()
    return {"status": "success", "message": "Simulated upgrade complete. 100% Discount Applied."}
    ```
5.  **The UI Re-renders:** The frontend sees the new plan limits and instantly unlocks the features (e.g., removing the 1,000 email block).

This ensures your entire database logic, guardrails, progress bars, and limit-blocking logic are 100% production-ready. Later (in Phase 9), we literally just replace that 2-line Python function with the Python Stripe SDK code. The rest of your app remains untouched.
