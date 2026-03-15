━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 EMAIL ENGINE — COMPLETE PHASE PLAN
 (Updated: Backend + UI/UX + Notifications)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each phase has TWO parts:
  [BACKEND] — API, database, worker logic
  [FRONTEND] — Pages, components, UX flows

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🏗 CRITICAL ARCHITECTURE: DUAL EMAIL ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To prevent platform/system emails from going to spam due to DMARC/Spoofing rules (like sending from @gmail.com via Amazon SES), the system uses TWO entirely separate email pipelines:

1. CENTRALIZED SYSTEM EMAILER (Gmail SMTP / Supabase SMTP)
   → Uses: `shrmail.app@gmail.com` via standard secure SMTP (smtp.gmail.com).
   → Purpose: Auth (Password Resets, Welcome), Team Invites, Quota Warnings, Sender Verification OTPs.
   → Why: Guarantees Inbox delivery for critical app functions without needing a verified custom domain.

2. TENANT CAMPAIGN EMAILER (Amazon SES)
   → Uses: The User's VERIFIED Custom Domain/Email (e.g., `sales@theircompany.com`) via SES API.
   → Purpose: Bulk marketing campaigns, newsletters, subscriber communications.
   → Why: Isolates sender reputation, handles high-volume throughput.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏗 PHASE 0 — UI/UX Foundation and Design System
  WHY: This phase establishes the frontend baseline before feature work scales.
       It should define the visual language, reusable UI primitives, interaction rules,
       accessibility defaults, and local frontend setup.

  VERIFIED STATUS:
  - Foundation exists, but Phase 0 is NOT fully complete.
  - Shared components are built.
  - Core dark-theme tokens exist.
  - Adoption across product pages is still incomplete.
  - Accessibility and dev-setup items are still open.

  [ARCHITECTURE]
  - Token source: `platform/client/src/app/globals.css`
  - Tailwind token bridge: `platform/client/tailwind.config.ts`
  - Root wiring: `platform/client/src/app/layout.tsx`
  - Shared UI library: `platform/client/src/components/ui/*`
  - App shell: `platform/client/src/components/layout/*`

  [TECH STACK]
  - Next.js 14 App Router
  - React 18
  - TypeScript
  - Tailwind CSS
  - CSS Variables
  - Inter via `next/font/google`
  - `class-variance-authority`
  - `lucide-react`

  [SETUP]
  - [ ] shadcn/ui installed and initialized
      → No verified `components.json` or generated shadcn component setup found
  - [x] Inter font installed in root layout

  [DESIGN TOKENS]
  - [x] Core dark-mode tokens exist in `globals.css`
      → background, text, border, radius, shadow, success/warning/danger
  - [ ] Typography scale is fully defined
      → `--text-h1`, `--text-h2`, `--text-h3`, `--text-body`, `--text-caption`, `--text-mono` are referenced but not defined
  - [ ] Semantic token set is complete
      → `--info`, `--info-bg`, `--accent-purple` are referenced but not defined
  - [ ] App no longer uses hardcoded colors or inline style-heavy UI
      → many pages still use `style={{}}`, hex colors, and `rgba(...)`

  [REUSABLE COMPONENTS]
  - [x] `Button.tsx`
  - [x] `Badge.tsx`
  - [x] `HealthDot.tsx`
  - [x] `LoadingSpinner.tsx`
  - [x] `StatCard.tsx`
  - [x] `StatusBadge.tsx`
  - [x] `ConfirmModal.tsx`
  - [x] `Toast.tsx`
  - [x] `PageHeader.tsx`
  - [x] `DataTable.tsx`
  - [x] `EmptyState.tsx`
  - [x] `Breadcrumb.tsx`
  - [x] `src/components/ui/index.ts`

  [TAILWIND BRIDGE]
  - [x] Tailwind config maps tokens to utility names
  - [ ] All mapped Tailwind token names resolve to actual CSS variables
      → several HSL/shadcn-style aliases are configured without matching root variables

  [STANDARD PAGE MODEL]
  Target pattern for feature pages:
      1. `Breadcrumb` if needed
      2. `PageHeader`
      3. optional `StatCard` row
      4. `DataTable` or standardized content block
      5. `EmptyState` when data is absent
      6. `Toast` for async feedback
      7. `ConfirmModal` for destructive actions

  [UX RULES]
  - [ ] Every destructive action uses `ConfirmModal`
  - [ ] Every async form submit uses loading state consistently
  - [ ] Every API success path uses toast feedback consistently
  - [ ] Every API error path uses toast feedback consistently
  - [ ] Every empty list uses `EmptyState`
  - [ ] Every list page has consistent search plus filter behavior
  - [ ] Mobile navigation is complete end-to-end
      → mobile menu button exists, but full sidebar toggle behavior is not fully implemented

  [ACCESSIBILITY]
  - [ ] Remove global `*:focus { outline: none }`
  - [ ] Modal accessibility is complete
      → Escape close exists, but focus trap and focus restore are missing
  - [ ] Icon-only buttons are fully labeled app-wide
  - [ ] 44x44 touch-target guidance is satisfied app-wide
  - [ ] Color-contrast verification is documented for the actual token values in use

  [LOCAL DEVELOPMENT SETUP]
  - [ ] Mailhog added to `docker-compose.yml`
  - [ ] `scripts/seed_dev_data.py` added
  - [ ] `.env.example` fully documents all required variables

  [PHASE 0 DONE MEANS]
  - token system is complete and internally consistent
  - shared UI is used by the main product pages
  - accessibility baseline is enforced
  - local frontend/email testing setup is reproducible

  NOTE:
  - Correct status: Partially complete
  - Correct summary: the design-system foundation exists, but standardization work remains

─────────────────────────────────────────
🏗 PHASE 1 — Foundation, Auth, Tenant Identity, and Onboarding
  WHY: This phase turns the app into a tenant-aware SaaS product.
       It establishes user identity, tenant identity, onboarding, route guards,
       and frontend session behavior.

  VERIFIED STATUS:
  - Foundation is mostly complete.
  - The implementation is custom JWT auth, not Supabase Auth.
  - Tenant isolation is primarily enforced in the application layer, not active RLS.
  - Onboarding and route protection work, but the architecture still has cleanup items.

  [ARCHITECTURE]
  - Auth routes: `platform/api/routes/auth.py`
  - Onboarding routes: `platform/api/routes/onboarding.py`
  - Password reset + verification routes: `platform/api/routes/password_reset.py`
  - JWT middleware: `platform/api/utils/jwt_middleware.py`
  - Frontend auth state: `platform/client/src/context/AuthContext.tsx`
  - Frontend request-time redirects: `platform/client/src/middleware.ts`
  - Onboarding UI: `platform/client/src/app/onboarding/*`

  [BACKEND]
  - [x] Custom email/password auth
      → `bcrypt` hashing + custom JWTs
  - [x] Tenant membership model
      → `users`, `tenants`, `tenant_users`
  - [x] Onboarding flow exists
      → new 4-step flow plus legacy progressive onboarding endpoints
  - [x] JWT middleware exists
      → tenant_id, role, email, user_id verification
  - [x] Active-tenant guard exists
  - [x] Workspace switching exists
  - [ ] Supabase Auth is the active auth system
  - [ ] RLS is the active tenant-isolation layer
  - [ ] `/auth/me` is fully implemented
  - [ ] All onboarding endpoints use JWT-only tenant resolution consistently

  [FRONTEND]
  - [x] Login page
  - [x] Signup page
  - [x] Onboarding wizard exists
      → `workspace`, `use-case`, `integrations`, `scale`, `complete`
  - [x] Interactive onboarding checklist exists on dashboard
  - [x] Sidebar navigation layout exists
  - [x] Auth context exists
  - [x] Middleware redirects exist
  - [ ] Route protection is fully centralized and consistent

  [SECURITY MODEL]
  - [x] JWT carries tenant identity
  - [x] `X-Tenant-ID` is validated against JWT when used
  - [x] onboarding tenants are blocked from active-tenant routes
  - [ ] database-level RLS is the active protection mechanism

  [PHASE 1 DONE MEANS]
  - auth architecture is accurately documented
  - tenant identity is enforced consistently
  - onboarding state is coherent
  - route protection is aligned between backend, frontend context, and middleware

  NOTE:
  - Correct status: Mostly complete
  - Correct summary: the foundation is real, but the docs previously overstated Supabase Auth and RLS

─────────────────────────────────────────
🏗 PHASE 1.5 — Auth Cleanup
  [BACKEND]
  - [ ] Remove custom /auth/forgot-password endpoint
  - [ ] Remove custom /auth/reset-password endpoint
  - [ ] Audit logs table (record: who did what, when, on which record)
      → Log: contact deletes, campaign sends, plan changes, login events
      → Columns: tenant_id, user_id, action, resource_type, resource_id, timestamp
      → PRIVACY RULE: Never log sensitive data (no CSV content, no email body)
      → Only log METADATA: "User X uploaded file Y with 500 contacts" ✅
      → Never log: actual email addresses, CSV rows, email HTML content ❌

  [FRONTEND]
  - [ ] Configure Supabase Auth SMTP to use `shrmail.app@gmail.com` (Centralized System Emailer)
  - [ ] Fix forgot-password page → use Supabase Auth built-in reset email flow
  - [ ] Fix reset-password page → complete Supabase Auth password update
  - [ ] Enable Social Auth (Google, GitHub) via Supabase Dashboard
  - [ ] Test: sign up → verify email → login → forgot password → reset
  - [ ] Audit log viewer (admin can see who deleted 10,000 contacts and when)

─────────────────────────────────────────
🏗 PHASE 1.6 — GDPR / Legal Compliance
  WHY: Real EU customers can legally demand data export or deletion.
       Build this before onboarding paying customers.

  [BACKEND]
  - [ ] Data export API (Async Process):
      → POST /tenant/export-data → creates job, returns 202 Accepted + job_id
      → GET /tenant/export-data/status/{job_id} → checks progress
      → GET /tenant/export-data/download/{job_id} → downloads ZIP (expires in 7 days)
      → Prevents timeout issues when exporting large contact lists
  - [ ] Right to be forgotten: DELETE /contacts/{id}/anonymize
      → Does NOT delete the row (breaks analytics history)
      → Overwrites PII: email → "deleted@gdpr.invalid", name → "[Deleted]"
      → Keeps campaign stats intact (we sent X emails to Y contacts)
  - [ ] Soft delete pattern (add to ALL main tables):
      → Add deleted_at TIMESTAMP NULL column to: contacts, campaigns, templates
      → All queries filter WHERE deleted_at IS NULL
      → 30-day retention window before permanent erasure
  - [ ] Consent tracking:
      → Add: consent_source, consent_date, consent_ip to contacts table
      → Captured at import time ("Uploaded via CSV on 2026-02-20")

  [FRONTEND]
  - [ ] Restore modal for soft-deleted items:
      → "This contact was deleted 5 days ago. Restore?"
      → Available for 30 days after deletion
  - [ ] Data export button in Settings:
      → "Download all my data" → generates ZIP, emails download link
  - [ ] Consent column visible in contacts table
  - [ ] Privacy policy / Terms page linked from footer (even if just external links)

─────────────────────────────────────────
🏗 PHASE 2 — Contacts Engine ⚠ VERIFIED, PARTIALLY COMPLETE
  [BACKEND]
  - [x] CSV/XLSX ingestion
  - [x] Upload preview endpoint
  - [x] Async import job creation
  - [x] RabbitMQ background import worker
  - [x] Import batch history
  - [x] Deduplication
  - [x] Contact status (subscribed, unsubscribed, bounced)
  - [x] Domain summary endpoint and `email_domain` storage
  - [x] Batch-scoped domain filtering
  - [ ] Segmentation filters
  - [x] Bulk delete
  - [ ] Contact search endpoint (search by email, name, tag)
  - [x] Contact update endpoint (email + custom fields)
  - [ ] Tags CRUD API (add/remove/list tags per contact)
  - [ ] Soft delete: deleted_at column on contacts (restore within 30 days)
  - [x] Suppression list API
  - [x] Export contacts API

  [FRONTEND]
  - [x] Contacts list page (table with search and pagination)
  - [x] Import contacts modal with preview and mapping
  - [x] Async import progress polling
  - [x] Import history tab
  - [x] Batch detail page
  - [x] Batch detail domain filtering
  - [x] Contact status badges (subscribed / unsubscribed / bounced)
  - [ ] Segment builder UI (filter by field, value)
  - [x] Bulk action buttons (delete selected)
  - [x] Contact detail editing (email + custom fields)
  - [ ] Contact detail page (see individual contact activity)
  - [x] Export contacts to CSV button
  - [x] Tags UI (add/remove tags on contacts)
  - [x] Suppression list page (view bounced/spam contacts)
  - [x] Campaign audience selection supports batch-domain targeting
  - [x] Campaign audience selection supports multi-domain selection inside a batch

  Notes:
      → Current implementation is async and queue-backed, not a fully synchronous import pipeline
      → Search currently covers email and name; it does not currently search tags
      → Tags support exists as per-contact tag updates, not a full standalone tags CRUD module
      → Custom fields are actively stored on contacts via `custom_fields`, not primarily through a separate `contact_custom_fields` runtime model
      → Fully blank rows are skipped during import instead of being counted as failed contacts
      → Domain typo-like suggestions exist for suspicious domains, but real mailbox verification does not
      → Large imports can partially succeed because the worker enforces limits chunk by chunk

─────────────────────────────────────────
🏗 PHASE 3 — Template Engine ⚠ PARTIALLY COMPLETE
  [BACKEND]
  - [x] Template CRUD
  - [x] Category
  - [ ] Persist compiled HTML from the active block editor
      → `compiled_html` exists in schema and service, but the structured block-editor save path does not keep it in sync
      → Preview compilation works, persistence is partial
  - [x] Preset gallery and preset-driven template creation
      → Frontend-defined preset starter designs exist and create real template rows
  - [ ] Template versioning (save history)
  - [ ] Plain text auto-generator (sync from HTML for spam filters)
      → `plain_text` field exists, but no verified save pipeline or frontend override UI is wired
  - [ ] Public "View Online" link (render template in browser without login)

  [FRONTEND]
  - [x] Templates list page (grid of template cards with thumbnails)
  - [x] Create template (blank canvas and preset entry flow)
  - [x] Structured block editor (rows → columns → blocks)
      → Active editing route is `/templates/[id]/block`
      → `/templates/[id]` and `/templates/[id]/editor` redirect into the block editor
  - [x] Server-side compile preview
      → `design_json -> MJML -> HTML` through backend `compile_service.py`
  - [ ] GrapesJS as the primary editor
      → Legacy GrapesJS code still exists, but it is no longer the active primary editing path
  - [ ] Plain Text (Auto-generated) | Plain Text (Custom) tabs
  - [ ] Send test email button (enter email address → receive real email)
  - [ ] Duplicate template button
      → Frontend button exists, but the backend duplicate endpoint does not
  - [ ] Category filter tabs on template list
  - [ ] Version history panel (see and restore older versions)
  - [ ] Dynamic placeholder guide (show list of {{merge_tags}} user can use)
  NOTE: A/B testing on templates → Phase 10
        AI copy assistant → Phase 10
        Global shared components → Phase 8
        Conditional blocks → Phase 10


─────────────────────────────────────────
🏗 PHASE 4 — Campaign Orchestration ⚠ MOSTLY COMPLETE
  [BACKEND]
  - [x] Campaign CRUD
  - [x] Snapshot campaign content + dispatch intents
      → Runtime uses `campaign_snapshots` and `campaign_dispatch`, not `email_tasks`, as the active orchestration model
  - [ ] Insert email_tasks
      → Old checklist item is outdated relative to current implementation
  - [x] Spintax + merge tags
  - [x] Scheduled sending
      → Verified in both embedded API scheduler and standalone worker scheduler, but architecture is duplicated
  - [x] Pause/resume campaign
  - [x] Cancel campaign mid-send
  - [ ] Resend to unopened contacts

  [FRONTEND]
  - [x] Campaigns list page (status badges, stats)
  - [x] Create campaign wizard (details → audience → content → review)
  - [x] Campaign detail page (basic)
  - [x] Campaign creation wizard (step-by-step: content → audience → schedule → review)
  - [x] Pre-send checklist UI
      → Checks name, sender identity, subject, content, and audience
      → Does not yet expose richer deliverability/compliance checks promised by older docs
  - [x] Schedule picker (date/time input for scheduled send)
  - [x] Pause button / Cancel button on in-progress campaign
  - [ ] Send test email modal (enter email address, preview)
      → Backend route exists, but the current frontend temp-draft flow does not fully match required campaign fields

─────────────────────────────────────────
🏗 PHASE 5 — Delivery Engine ✅ DONE
  [BACKEND]
  - [x] Worker loop (RabbitMQ consumer)
  - [x] SMTP send via Mailtrap/SES
  - [x] Dynamic SMTP TLS Handshake based on active Port (Robust 587 support)
  - [x] Retry + dead-letter queue (nack on failure)
  - [x] Unsubscribe link injected automatically into every email (HMAC-signed token)
  - [x] Physical business address in email footer (CAN-SPAM compliant)
  - [x] Hard bounce → auto-mark contact as "bounced" (POST /webhooks/bounce + /webhooks/ses)
  - [x] Spam complaint → auto-mark contact as "unsubscribed" (POST /webhooks/spam + /webhooks/ses)
  - [x] Daily send limit enforcement (per-tenant, resets at midnight, 429 on breach)
  - [x] Suppressed contacts (bounced/unsubscribed) excluded from all future campaigns automatically

  [FRONTEND]
  - [x] Unsubscribe landing page (/unsubscribe?status=success)
      → Clean glassmorphism page: "You have been unsubscribed."
  - [x] Re-subscribe option on unsubscribe page (email input → POST /resubscribe)

  [MOVED TO PHASE 7 — Advanced Delivery]
  - [ ] Email Sending Reputation Isolation:
      → Track per-tenant reputation score (bounce rate, spam rate)
      → Auto-suspend tenant if bounce_rate > 5% or spam_rate > 0.3%
      → Move risky tenants to lower priority delivery queue
  - [ ] List Hygiene Automation:
      → Auto-suppress emails that bounced 3x in 30 days
      → Re-engagement campaign trigger for 6-month inactive contacts
      → Sunset policy: Mark as 'inactive' after 12 months
  - [ ] Warm-up throttle for new tenants:
      → First 3 days: limit to 50 emails/hour
      → Day 4–7: 200 emails/hour → Day 8+: full speed
  - [ ] Campaign throttle status display in UI ("Sending at 50/hr — 94 hours remaining")

─────────────────────────────────────────
🏗 PHASE 6 — Observability & Analytics
  [BACKEND]
  - [ ] Open tracking pixel endpoint
  - [ ] Click tracking redirect endpoint
  - [ ] Webhook ingestion (Gmail/Outlook bounce/spam reports)
  - [ ] Stats aggregation (sent, opens, clicks, bounces per campaign)
  - [ ] Contact activity log (what each person opened/clicked)
  - [ ] Bot/Scanner detection:
      → If click happens < 1 second after open → mark as bot, exclude from stats
      → Prevents inflated click stats from email security scanners (common in enterprise)
      → Store: opened_at, clicked_at, is_bot flag

  [FRONTEND]
  - [ ] Campaign detail page (full analytics):
      → Sent / Delivered / Opened / Clicked / Bounced / Unsubscribed
      → Charts (open rate over time, top clicked links)
      → Recipient list (who opened, who clicked, who bounced)
  - [ ] Dashboard homepage widgets:
      → Recent campaign performance summary
      → Sender Health card:
          - Bounce rate (🟢 < 2%  🟡 2-5%  🔴 > 5%)
          - Spam rate   (🟢 < 0.1% 🟡 0.1-0.5% 🔴 > 0.5%)
          - Open rate   (🟢 > 20%  🟡 10-20%  🔴 < 10%)
          - Domain status (verified ✅ / not verified ❌)
  - [ ] Contacts activity tab (per contact: opened X campaigns, clicked Y)
  - [ ] Export report to CSV button

─────────────────────────────────────────
🏗 PHASE 7 — Plan Enforcement
  [BACKEND]
  - [ ] Plans table (free/starter/pro/enterprise with limits)
      → Free tier limits: Max 500 contacts, 1,000 emails/month, no custom domain (forces upgrade)
  - [ ] Monthly email sent counter per tenant
  - [ ] Block sends when quota exceeded
  - [ ] Contact count limit enforcement
  - [ ] 80% quota trigger (notification)
  - [ ] Worker-triggered email notifications (Sent via Centralized System Emailer):
      → Campaign completed → email tenant with stats summary
      → 80% quota reached → email tenant quota warning
      → Monthly 1st → email tenant usage summary
      → Bounce rate > 2% → email tenant list-cleaning alert

  [FRONTEND]
  - [ ] Plan & Usage page:
      → Current plan badge (Free / Starter / Pro)
      → Emails used this month: 8,400 / 25,000 (progress bar)
      → Contacts: 3,200 / 10,000 (progress bar)
      → "Upgrade Plan" button → shows plan comparison table
  - [ ] Upgrade plan modal (shows plan comparison, "Contact Us to Upgrade")
  - [ ] In-app banner when 80% quota reached:
      "⚠️ You've used 80% of your monthly emails. Upgrade to continue."
  - [ ] Blocked send page when quota maxed:
      "❌ Monthly limit reached. Your campaign cannot be sent."

─────────────────────────────────────────
🏗 PHASE 7.5 — Infrastructure ✅ PARTIALLY DONE
  [BACKEND / DEVOPS]
  - [x] Docker (Dockerfiles for API, worker, client)
  - [x] docker-compose.yml
  - [x] Nginx config
  - [ ] SSL/HTTPS (Let's Encrypt guide in docs)
  - [ ] CI/CD pipeline (GitHub Actions)
  - [ ] Load & Spam Testing Setup:
      → k6 script for contact import (10k rows) and campaign creation
      → Integration with Mail-Tester.com API for pre-send spam score checks
      → Postman/Insomnia collection for all major API endpoints
  - [ ] Security Headers & CSP:
      → Add Content-Security-Policy headers for all Next.js pages
      → Strict CSP for editor (mitigate inline style risks)
  - [ ] API Rate Limiting (Strict, Per-Tenant, Per-Endpoint):
      → Must include burst protection and use tenant_id (not just IP)
      → Import contacts: max 5/min | Campaign create: 10/min | Test email: 20/hour
      → Essential to prevent malicious tenants from overloading DB and Worker
  - [ ] Background Job Status Table:
      → Generic `jobs` table: id, tenant_id, type, status, progress_percent, error_message
      → Used for CSV import, GDPR export, Campaign send compilation
      → Frontend polls this table so users actually see a progress bar instead of waiting blindly
  - [ ] Worker concurrency safety:
      → Add locked_by (UUID) column to email_tasks
      → Worker claims task by writing its own ID to locked_by
      → Prevents zombie tasks when 2+ workers run in parallel
  - [ ] Idempotency guard:
      → Add external_msg_id column to email_tasks
      → Store SMTP provider's message ID after first successful send
      → On retry: check external_msg_id exists → skip send → prevent double-email

  [FRONTEND]
  - [ ] Settings → SMTP Config page:
      → Input fields: SMTP Host, Port, Username, Password
      → "Test Connection" button → shows success/failure
  - [ ] Settings → Domain Verification page:
      → Enter sending domain
      → Show DNS records to add (SPF/DKIM)
      → "Verify" button → checks DNS

  [HEALTH CHECKS]
  - [ ] GET /health endpoint on FastAPI:
      → Returns: { status: "ok", db: "connected", worker: "running" }
      → Returns 200 OK if healthy, 503 if any service is down
      → Company IT team monitors this for uptime alerts
  - [ ] GET /health endpoint on Worker (separate HTTP server):
      → Returns: { status: "ok", queue_depth: 142, last_processed: "2s ago" }
  → Both endpoints used by docker-compose healthcheck + external monitors

─────────────────────────────────────────
🏗 PHASE 8 — Account Settings & Administration
  [PHASE 8A: SETTINGS CORE]
  - [x] Settings landing page (/settings) with navigation cards
  - [x] Profile page (edit name, timezone)
  - [x] Organization page (company name, CAN-SPAM physical address)
  - [ ] Team Management (invite users to workspace — Phase 11)

  [PHASE 8B: SECURITY & COMPLIANCE]
  - [x] GDPR Right-to-Erase (anonymize contact PII)
  - [x] Data Export button (CSV export of all contacts)
  - [x] Compliance checklist page (/settings/compliance)

  [PHASE 8C: DEVELOPER TOOLS & DELIVERABILITY]
  - [x] API Keys page (generate, view, revoke keys — SHA-256 hashed)
  - [x] Custom sending domain setup UI (SPF/DKIM/DMARC records)
  - [x] Sender Identity Verification (Anti-Spoofing OTP Modal & DB Restrictions)
      → OTP Emails MUST be sent via Centralized System Emailer (Gmail SMTP)
  - [x] Backend: POST /senders/verify-request, POST /senders/verify-submit, GET /senders
  - [ ] Webhooks config page (URL + event subscriptions — Phase 11)

  [PHASE 8D: SUPER-ADMIN PANEL — Future]
  - [ ] Admin login page (separate from tenant login)
  - [ ] Admin dashboard (total tenants, emails sent, revenue)
  - [ ] Tenant list table (name, plan, usage, status)
  - [ ] Global Kill Switch button (big red button, requires confirmation)

─────────────────────────────────────────
🏗 PHASE 9 — Payments (Stripe/Razorpay)
  [BACKEND]
  - [ ] Stripe integration
  - [ ] Webhook from Stripe → update plan in DB
  - [ ] Invoice generation

  [FRONTEND]
  - [ ] Pricing page (plan comparison table with "Subscribe" button)
  - [ ] Checkout flow (Stripe hosted page or embedded)
  - [ ] Billing history page (past invoices, download PDF)
  - [ ] Payment failed banner ("Your payment failed. Update card to continue.")

─────────────────────────────────────────
🏗 PHASE 10 — Advanced Campaigns
  [BACKEND]
  - [ ] A/B test variant storage
  - [ ] Winner selection logic (by open rate after 4 hours)
  - [ ] Drip campaign sequence engine
  - [ ] Automation trigger system

  [FRONTEND]
  - [ ] A/B test creation UI (add Subject Line B, set split ratio)
  - [ ] A/B test results panel (variant A vs B comparison)
  - [ ] Drip campaign builder (sequence of emails + delays)
  - [ ] Automation trigger builder (e.g., "Send email when contact joins list")

─────────────────────────────────────────
🏗 PHASE 11 — API & Integrations
  [BACKEND]
  - [ ] API key management
  - [ ] Transactional send API (/v1/send)
  - [ ] Webhook output (notify tenant on open/click)

  [FRONTEND]
  - [ ] API Keys page (generate, view, revoke keys)
  - [ ] Webhooks config page (enter URL, select events)
  - [ ] Developer docs page (embedded docs or link)

─────────────────────────────────────────
🏗 PHASE 12 — Enterprise Domain Auto-Discovery (JIT Provisioning)
  WHY: Reduce onboarding friction for large organizations by allowing 
       employees to automatically request access to their corporate workspace based 
       on their email domain, without compromising email infrastructure security.

  [BACKEND & SECURITY ARCHITECTURE]
  - [ ] PDEP Filter (Public/Disposable Email Provider)
      → Block @gmail.com, @yahoo.com from triggering JIT discovery logic.
  - [ ] Verification-Before-Disclosure (VBD)
      → Force a 6-digit OTP verification BEFORE querying if the workspace exists.
  - [ ] Tenant ID Obfuscation
      → Mask real workspace UUIDs in API responses using cryptographic salts (Hashids).
  - [ ] Admin Flood Protection (Rate Limiting)
      → Batch notifications to prevent IT denial-of-service from mass signups.
  - [ ] Database Schema Additions (Supabase)
      → workspace_domains: Lookup index mapping domains to tenants.
      → join_requests: Secure waiting area blocking entry into 'members' until approved.

  [FRONTEND]
  - [ ] JIT Onboarding Intercept Screen
      → Detects verified domain → Prompts OTP → Shows "Request to Join Team" CTA.
  - [ ] Employee 'Waiting Room' Dashboard
      → Blank security state while awaiting admin approval (prevents data leaks).
  - [ ] IT Admin 'Governance' Portal
      → Table of pending join requests with Approve/Reject/Blacklist actions.

─────────────────────────────────────────
🏗 PHASE 13 — Scale (After Handover)
  [BACKEND]
  - [ ] Redis queue (replace DB polling)
  - [ ] IP warmup scheduler (auto-increase limits over 30 days)
  - [ ] Blacklist monitoring (check MXToolbox daily via cron)
  - [ ] Bot filtering (fake opens from email security scanners)
  - [ ] Per-tenant custom sending domain backend (DKIM key generation)

  [MICROSERVICES MIGRATION — When team > 5 developers]
  - [ ] Break monolith into independent services:
      auth-service         → Only handles login, JWT, tenants
      contacts-service     → Only handles contacts, segments, tags
      template-service     → Only handles templates, editor, previews
      campaign-service     → Only handles campaigns, scheduling
      delivery-service     → Only handles SMTP worker, retries
      analytics-service    → Only handles open/click tracking, reports
      notification-service → Only sends system emails to tenants
  - [ ] API Gateway (Nginx/Kong) → single entry point routing to each service
  - [ ] Each service has its own Docker container
  - [ ] Services communicate via REST or message queue (RabbitMQ/Kafka)
  WHY: If analytics crashes → rest of app still works.
       If delivery is slow → scale only that service, not the entire app.
  NOTE: Do NOT do this before Phase 12. Current monolith is perfectly fine
        for up to ~100k emails/day and a small team.

  [FRONTEND]
  - [ ] Custom domain setup wizard (tenant enters domain → gets DNS records → verifies)
  - [ ] IP warmup status page (shows daily send limit and progression)
  - [ ] Platform health dashboard (admin sees Redis queue depth, worker status)




━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 USER NOTIFICATIONS — What to tell tenants
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IN-APP NOTIFICATIONS (toast / banner in UI):
  ✉ Campaign sent successfully (X emails queued)
  ⚠ Campaign paused (user action)
  ❌ Campaign failed to send (SMTP error)
  ⚠ 80% of monthly email quota used
  ❌ Monthly email quota reached — sends blocked
  ⚠ Bounce rate exceeded 2% — list needs cleaning
  ⚠ Spam complaint rate exceeded 0.1% — action needed
  ✅ Domain verified successfully
  ❌ SMTP connection failed — check your settings

EMAIL NOTIFICATIONS (sent via Centralized System Emailer to tenant's email):
  ✉ Welcome email (after onboarding complete)
  ✉ Sender Identity OTP: "Your code to verify sales@acme.com is 123456"
  ✉ Campaign completed: "Your campaign 'Black Friday' is done.
     Sent: 10,000 | Opened: 2,400 (24%) | Clicked: 540 (5.4%)"
  ⚠ "You've used 80% of your monthly email limit"
  ❌ "Monthly limit reached. Upgrade to continue sending."
  ⚠ "Your bounce rate is 3.5% — please clean your list"
  ⚠ "Spam complaints detected on your last campaign"
  ✉ Monthly usage summary (every 1st of month)
  ✉ Invoice/receipt (after payment — Phase 9)
  ❌ "Payment failed — please update your card" (Phase 9)

SYSTEM/LEGAL EMAILS (sent inside campaigns to end users):
  ✉ Unsubscribe confirmation: "You have been unsubscribed."
  ✉ Every campaign email MUST have:
      → Unsubscribe link at bottom
      → Company physical address in footer
      → Sender's name clearly visible in From field

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HANDOVER PRIORITY (1 MONTH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Must finish before handover:
  Phase 1.5  → Auth fixes + Google login
  Phase 3    → Template editor + preview
  Phase 4    → Campaign wizard + pre-send checklist
  Phase 5    → Delivery engine (worker + footer + webhooks) — partially complete; needs webhook auth, per-tenant address, daily-limit cap, safer bounce handling
  Phase 6    → Observability & Analytics — tracking APIs exist; analytics UI + advanced bot filtering pending
  Phase 7    → Plan limits + usage page + quota banners — quota helper/daily limit exist; billing/upgrade UI + payments missing

Document for company to pay & build later:
  Phase 8    → Admin panel
  Phase 9    → Stripe payments
  Phase 10   → A/B testing + drip campaigns
  Phase 11   → API & integrations
  Phase 12   → Enterprise JIT Onboarding
  Phase 13   → Redis + scale

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DATABASE INDEX STRATEGY (CRITICAL FOR SCALE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Without these indexes, the platform will slow down dramatically at scale:
  - [ ] contacts(tenant_id, email) → fast deduplication during CSV import
  - [ ] email_tasks(status, scheduled_at) → ultra-fast worker polling
  - [ ] campaigns(tenant_id, status) → fast dashboard loading
  - [ ] audit_logs(tenant_id, timestamp) → fast log retrieval for GDPR
  - [ ] email_events(campaign_id, contact_id) → fast analytics aggregation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 HANDOVER RUNBOOKS (Docs for the company)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
These are NOT code. They are written guides you hand to the company.

RUNBOOK 1: "What to do if your IP gets Blacklisted"
  Step 1: Check IP reputation using these tools (use all 3 for thorough check):
      → mxtoolbox.com             (main site → Blacklist Check tab)
      → multirbl.valli.org        (checks 200+ blacklists at once)
      → check.spamhaus.org        (most authoritative — Gmail/Outlook use this)
  Step 2: Identify which campaign caused it (high bounce/spam rate)
  Step 3: Submit delisting request to the blacklist provider (usually free)
  Step 4: Clean the contact list that caused the issue
  Step 5: Switch to a new sending IP (SES supports dedicated IPs)
  Step 6: Re-enable warm-up throttle for the new IP
  PRO TIP: AWS SES Dashboard shows your sending reputation score.
           Check it weekly — it drops before you get blacklisted, giving you warning.

RUNBOOK 2: "How to upgrade from DB Queue to Redis (Phase 12)"
  Step 1: Add Redis to docker-compose.yml (pre-written, just uncomment)
  Step 2: Install: pip install celery redis
  Step 3: Create celery app that reads from Redis instead of DB polling
  Step 4: Keep the old DB queue as a fallback for 1 week
  Step 5: Monitor: all tasks processed → remove old DB polling worker
  CRITICAL: external_msg_id column prevents double-sends during migration

RUNBOOK 3: "Monthly operations checklist for the company"
  - [ ] Check bounce rate (keep below 2%)
  - [ ] Check spam complaint rate (keep below 0.1%)
  - [ ] Review email_tasks_dead table (failed emails) — investigate patterns
  - [ ] Check mxtoolbox.com/blacklists for IP reputation
  - [ ] Review audit_logs for any unusual mass deletes or sends
  - [ ] Review tenant plan usage — upgrade tenants hitting limits consistently
  - [ ] Check AWS SES sending limits in AWS Console

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
