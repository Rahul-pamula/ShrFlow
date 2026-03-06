## Phase 7: Plan Enforcement & Billing Guardrails

**Focus:** Protecting the infrastructure from abuse by enforcing plan limits (Free vs Pro) and automatically managing sender reputation based on Phase 6 metrics.

### 1. Database Architecture
- [ ] Create `plans` table (`id`, `name`, `max_monthly_emails`, `max_contacts`, `price`).
- [ ] Pre-populate `plans` with: Free (1,000 emails), Starter (10,000 emails), Pro (100,000 emails).
- [ ] Add columns to `tenants` table: `plan_id`, `billing_cycle_start`, `emails_sent_this_cycle`.
- [ ] Create PostgreSQL `pg_cron` extension/function to reset `emails_sent_this_cycle` every 30 days automatically.

### 2. API Quota Enforcement Middleware
- [ ] Create `billing_status` middleware in FastAPI.
- [ ] Intercept `POST /campaigns/{id}/send`. Check if `emails_sent_this_cycle + audience_size > max_monthly_emails`.
- [ ] If exceeded, return `HTTP 403 Forbidden` with a usage limits error.

### 3. Automated Reputation Penalties
- [ ] Worker update: At the start of the dispatch loop, check the tenant's rolling 24-hour bounce rate (from `email_events`).
- [ ] If Bounce Rate > 5%, pause the campaign automatically and update `tenants.status` to `probation`.

### 4. User Interface: Plan & Usage
- [ ] Build `/settings/billing` page in Next.js.
- [ ] Show determinate Progress Bars for "Emails Used" (e.g., 8,400 / 10,000) and "Contacts Used".
- [ ] Build a "Plan Comparison" table showing Free/Starter/Pro limits and upgrade buttons.

### 5. Contextual Interventions (Upgrades & Blocks)
- [ ] Implement an orange banner on the Dashboard: *"⚠️ You've used 80% of your monthly emails."*
- [ ] Implement a hard block on the Campaign Review screen (Step 4) if limits are exceeded, changing the "Send" button to "Upgrade Plan".
- [ ] Build `POST /billing/upgrade` mock API: Accepts `plan_id` and instantly updates the `tenants` table (100% discount testing flow without Stripe).

---

## Phase 7.5: Production Infrastructure

**Focus:** Hardening the API, increasing worker efficiency, and providing realtime UI feedback for long-running jobs.

### 1. Global Rate Limiting
- [ ] Install `slowapi` and configure a Redis backend.
- [ ] Protect `/auth/login` and `/auth/signup` (max 5 requests/minute).
- [ ] Protect `/campaigns/send` (max 2 requests/minute).
- [ ] Protect `GET /track/open` (max 5000 requests/minute to allow for broadcast bursts).

### 2. Realtime Background Jobs UI
- [ ] Create `jobs` database table (`id`, `tenant_id`, `type`, `status`, `progress_percent`, `error_message`).
- [ ] Update CSV Import API: Return a `job_id` immediately instead of blocking the request.
- [ ] Update CSV Worker: Periodically update `jobs.progress_percent` while importing.
- [ ] Frontend: Implement a polling 0-100% progress bar modal during CSV uploads.

### 3. Worker Concurrency & Idempotency
- [ ] Add `locked_by` (UUID) column to `campaign_dispatch`.
- [ ] Worker logic update: Use `UPDATE ... WHERE status = 'PENDING' RETURNING *` to atomically claim rows.
- [ ] Add `external_msg_id` to `campaign_dispatch`. Store the AWS SES message ID. On retries, verify this is empty to prevent double-sending emails.
