#!/usr/bin/env python3
"""
rebuild_tracker.py
Generates progress.html from the phasesData definition below.
Run from the project root: python3 docs/rebuild_tracker.py
Since phase_wise_plan.md is now a narrative doc (no checkboxes),
the tracker data is maintained directly here.
"""
import json
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from task_descriptions import DESCRIPTIONS

phases = [
  {"title": "PHASE 0 — UI/UX Foundation and Design System", "tasks": [
    {"text": "[SETUP] shadcn/ui installed and initialized", "done": False},
    {"text": "[SETUP] Inter font installed in root layout", "done": True},
    {"text": "[DESIGN TOKENS] Core dark-mode tokens exist in globals.css", "done": True},
    {"text": "[DESIGN TOKENS] Typography scale is fully defined", "done": False},
    {"text": "[DESIGN TOKENS] Semantic token set is complete", "done": False},
    {"text": "[DESIGN TOKENS] App no longer uses hardcoded colors or inline style-heavy UI", "done": False},
    {"text": "[DESIGN TOKENS] Design Tokens Documentation Page (internal token reference)", "done": False},
    {"text": "[UX] Loading skeletons on all list pages (contacts, campaigns, templates)", "done": False},
    {"text": "[UX] Dark / Light mode toggle (CSS variable swap)", "done": False},
    {"text": "[REUSABLE COMPONENTS] Button.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] Badge.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] HealthDot.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] LoadingSpinner.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] StatCard.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] StatusBadge.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] ConfirmModal.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] Toast.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] PageHeader.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] DataTable.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] EmptyState.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] Breadcrumb.tsx", "done": True},
    {"text": "[REUSABLE COMPONENTS] src/components/ui/index.ts", "done": True},
    {"text": "[TAILWIND BRIDGE] Tailwind config maps tokens to utility names", "done": True},
    {"text": "[TAILWIND BRIDGE] All mapped Tailwind token names resolve to actual CSS variables", "done": False},
    {"text": "[UX RULES] Every destructive action uses ConfirmModal", "done": False},
    {"text": "[UX RULES] Every async form submit uses loading state consistently", "done": False},
    {"text": "[UX RULES] Every API success path uses toast feedback consistently", "done": False},
    {"text": "[UX RULES] Every API error path uses toast feedback consistently", "done": False},
    {"text": "[UX RULES] Every empty list uses EmptyState", "done": False},
    {"text": "[UX RULES] Every list page has consistent search and filter behavior", "done": False},
    {"text": "[UX RULES] Mobile navigation is complete end-to-end", "done": False},
    {"text": "[ACCESSIBILITY] Remove global *:focus { outline: none }", "done": False},
    {"text": "[ACCESSIBILITY] Modal accessibility is complete (focus trap + restore)", "done": False},
    {"text": "[ACCESSIBILITY] Icon-only buttons are fully labeled app-wide", "done": False},
    {"text": "[ACCESSIBILITY] 44x44 touch-target guidance is satisfied app-wide", "done": False},
    {"text": "[LOCAL DEV SETUP] Mailhog added to docker-compose.yml", "done": False},
    {"text": "[LOCAL DEV SETUP] scripts/seed_dev_data.py added", "done": False},
    {"text": "[LOCAL DEV SETUP] .env.example fully documents all required variables", "done": False},
  ]},
  {"title": "PHASE 1 — Foundation, Auth, Tenant Identity, and Onboarding", "tasks": [
    {"text": "[BACKEND] Custom email/password auth (bcrypt + custom JWT)", "done": True},
    {"text": "[BACKEND] Tenant membership model (users, tenants, tenant_users)", "done": True},
    {"text": "[BACKEND] Onboarding flow (4-step wizard + progressive endpoints)", "done": True},
    {"text": "[BACKEND] JWT middleware (tenant_id, role, email, user_id verification)", "done": True},
    {"text": "[BACKEND] Active-tenant guard exists", "done": True},
    {"text": "[BACKEND] Workspace switching exists", "done": True},
    {"text": "[BACKEND] /auth/me fully implemented", "done": False},
    {"text": "[BACKEND] All onboarding endpoints use JWT-only tenant resolution consistently", "done": False},
    {"text": "[FRONTEND] Login page", "done": True},
    {"text": "[FRONTEND] Signup page", "done": True},
    {"text": "[FRONTEND] reCAPTCHA on Signup form", "done": False},
    {"text": "[FRONTEND] Onboarding wizard (workspace > use-case > integrations > scale > complete)", "done": True},
    {"text": "[FRONTEND] Interactive onboarding checklist on dashboard", "done": True},
    {"text": "[FRONTEND] Sidebar navigation layout", "done": True},
    {"text": "[FRONTEND] Auth context exists", "done": True},
    {"text": "[FRONTEND] Middleware redirects exist", "done": True},
    {"text": "[FRONTEND] Route protection is fully centralized and consistent", "done": False},
    {"text": "[SECURITY] JWT carries tenant identity", "done": True},
    {"text": "[SECURITY] X-Tenant-ID is validated against JWT when used", "done": True},
    {"text": "[SECURITY] Onboarding tenants are blocked from active-tenant routes", "done": True},
    {"text": "[SECURITY] Social Auth (Google, GitHub) via OAuth 2.0 / Supabase", "done": True},
    {"text": "[SECURITY] Rate limiting on login + registration endpoints (per IP, per email)", "done": False},
    {"text": "[SECURITY] Email verification required before onboarding completes", "done": False},
    {"text": "[SECURITY] Short-lived access tokens (15-30 min) + silent refresh tokens", "done": False},
    {"text": "[SECURITY] Token revocation via token_version counter (force-logout all devices)", "done": False},
  ]},
  {"title": "PHASE 1.5 — Auth Hardening & Audit Logging", "tasks": [
    {"text": "[BACKEND] Remove custom /auth/forgot-password endpoint", "done": True},
    {"text": "[BACKEND] Remove custom /auth/reset-password endpoint", "done": True},
    {"text": "[BACKEND] reCAPTCHA token verification endpoint/middleware", "done": False},
    {"text": "[BACKEND] Audit logs table (who did what, when, on which record — metadata only)", "done": True},
    {"text": "[BACKEND] Audit log table is write-only / immutable (no UPDATE or DELETE allowed)", "done": False},
    {"text": "[BACKEND] Log severity levels: INFO / WARNING / CRITICAL on every log row", "done": False},
    {"text": "[BACKEND] Auto-alert on CRITICAL log events (bulk delete >1000, suspicious login)", "done": False},
    {"text": "[FRONTEND] Configure Supabase Auth SMTP to use shrmail.app@gmail.com", "done": True},
    {"text": "[FRONTEND] Fix forgot-password page — Supabase Auth built-in reset email flow", "done": True},
    {"text": "[FRONTEND] Fix reset-password page — Supabase Auth password update", "done": True},
    {"text": "[FRONTEND] Test: sign up > verify email > login > forgot password > reset", "done": True},
    {"text": "[FRONTEND] Audit log viewer with severity filter (INFO / WARNING / CRITICAL)", "done": True},
    {"text": "[SECURITY] MFA via TOTP for workspace admins", "done": False},
    # === ADDED FROM AUDIT ===
    {"text": "[AUDIT FIX 1] Cross-tenant webhook suppression — add tenant_id filter to _suppress_contact() in webhooks.py (0.5d)", "done": False},
    {"text": "[AUDIT FIX 2] JWT refresh token model — 30-min access token + HttpOnly refresh cookie + token_version revocation on users table (2d)", "done": False},
    {"text": "[AUDIT FIX 3] Lock CORS to FRONTEND_URL env var — no wildcard in production (0.5d)", "done": False},
    {"text": "[AUDIT FIX 4] Enable SSL cert verification in worker — remove ssl.CERT_NONE; add AMQP_SKIP_TLS_VERIFY dev flag (0.5d)", "done": False},
    {"text": "[AUDIT FIX 5] Delete /contacts/upload + /test-send from main.py; remove db_check.py, db_check2.py, generate_test_csv.py from repo root (0.5d)", "done": False},
    {"text": "[AUDIT FIX 6] Remove duplicate events router registration — second app.include_router(events_router.router) in main.py (0.5d)", "done": False},
    {"text": "[FRIEND AUDIT FIX 17] OAuth State Parameter — Require and validate a random state string in the Google/GitHub OAuth flow to prevent CSRF (0.5d)", "done": False},
  ]},
  {"title": "PHASE 1.6 — GDPR & Legal Compliance", "tasks": [
    {"text": "[BACKEND] Data export API (async job — POST > job_id > poll > download ZIP)", "done": False},
    {"text": "[BACKEND] Right to be forgotten: DELETE /contacts/{id}/anonymize (anonymize PII, keep row)", "done": False},
    {"text": "[BACKEND] Soft delete pattern: deleted_at on contacts, campaigns, templates (30-day restore)", "done": False},
    {"text": "[BACKEND] Consent tracking: consent_source, consent_date, consent_ip on contacts", "done": False},
    {"text": "[BACKEND] Data retention policy: auto-flag contacts inactive >24 months for purge", "done": False},
    {"text": "[BACKEND] Consent re-validation: exclude contacts with consent >24 months old", "done": False},
    {"text": "[BACKEND] Do Not Contact (DNC) global suppression list (platform-level, blocks all emails)", "done": False},
    {"text": "[FRONTEND] Restore modal for soft-deleted items", "done": False},
    {"text": "[FRONTEND] Data export button in Settings", "done": False},
    {"text": "[FRONTEND] Consent column visible in contacts table", "done": False},
    {"text": "[FRONTEND] Privacy policy / Terms page linked from footer", "done": False},
  ]},
  {"title": "PHASE 2 — Contacts Engine", "tasks": [
    {"text": "[BACKEND] CSV/XLSX ingestion", "done": True},
    {"text": "[BACKEND] Real-time contact ingestion API (POST /v1/contacts for forms/CRM webhooks)", "done": False},
    {"text": "[BACKEND] Email validation: syntax check + MX record check + disposable email detection", "done": False},
    {"text": "[BACKEND] Contact scoring system (engaged / at-risk / inactive / risky)", "done": False},
    {"text": "[BACKEND] Upload preview endpoint", "done": True},
    {"text": "[BACKEND] Async import job creation", "done": True},
    {"text": "[BACKEND] RabbitMQ background import worker", "done": True},
    {"text": "[BACKEND] Import batch history", "done": True},
    {"text": "[BACKEND] Deduplication (in-memory + Supabase upsert on tenant_id, email)", "done": True},
    {"text": "[BACKEND] Contact status (subscribed, unsubscribed, bounced, complained)", "done": True},
    {"text": "[BACKEND] Domain summary endpoint and email_domain storage", "done": True},
    {"text": "[BACKEND] Batch-scoped domain filtering", "done": True},
    {"text": "[BACKEND] Segmentation filters (filter by field/operator/value)", "done": False},
    {"text": "[BACKEND] Bulk delete", "done": True},
    {"text": "[BACKEND] Contact search endpoint (email, name, tag)", "done": False},
    {"text": "[BACKEND] Contact update endpoint (email + custom fields)", "done": True},
    {"text": "[BACKEND] Tags CRUD API (add/remove/list tags per contact)", "done": False},
    {"text": "[BACKEND] Soft delete: deleted_at column on contacts (restore within 30 days)", "done": False},
    {"text": "[BACKEND] Suppression list API (GET /contacts/suppression)", "done": True},
    {"text": "[BACKEND] Export contacts API", "done": True},
    {"text": "[BACKEND] FIX: GET /suppression route collision with /{contact_id} resolved", "done": True},
    {"text": "[BACKEND] FIX: Suppression list jwt_payload arg bug fixed (was returning 0 results)", "done": True},
    {"text": "[FRONTEND] Contacts list page (table with search and pagination)", "done": True},
    {"text": "[FRONTEND] Import contacts modal with preview and mapping", "done": True},
    {"text": "[FRONTEND] Async import progress polling", "done": True},
    {"text": "[FRONTEND] Import history tab", "done": True},
    {"text": "[FRONTEND] Batch detail page", "done": True},
    {"text": "[FRONTEND] Batch detail domain filtering", "done": True},
    {"text": "[FRONTEND] Contact status badges (subscribed / unsubscribed / bounced)", "done": True},
    {"text": "[FRONTEND] Segment builder UI (filter by field, value)", "done": False},
    {"text": "[FRONTEND] Bulk action buttons (delete selected)", "done": True},
    {"text": "[FRONTEND] Contact detail editing (email + custom fields)", "done": True},
    {"text": "[FRONTEND] Contact detail page (individual contact activity)", "done": False},
    {"text": "[FRONTEND] Export contacts to CSV button", "done": True},
    {"text": "[FRONTEND] Tags UI (add/remove tags on contacts)", "done": True},
    {"text": "[FRONTEND] Suppression list page (view bounced/spam/unsubscribed contacts)", "done": True},
    {"text": "[FRONTEND] Campaign audience selection supports batch-domain targeting", "done": True},
    {"text": "[FRONTEND] Campaign audience selection supports multi-domain selection inside a batch", "done": True},
    {"text": "[FRONTEND] Duplicate resolution UI (show conflict, let tenant choose which values to keep)", "done": False},
    {"text": "[FRONTEND] Contact scoring badge visible in contacts list", "done": False},
    # === ADDED FROM FRIEND AUDIT ===
    {"text": "[FRIEND AUDIT FIX 18] Streaming CSV Uploads — Replace pandas in-memory parser with async chunked byte stream parsing to prevent OOM API crashes (2d)", "done": False},
  ]},
  {"title": "PHASE 3 — Template Engine", "tasks": [
    {"text": "[BACKEND] Template CRUD", "done": True},
    {"text": "[BACKEND] Category", "done": True},
    {"text": "[BACKEND] Persist compiled HTML from the active block editor", "done": False},
    {"text": "[BACKEND] Preset gallery and preset-driven template creation", "done": True},
    {"text": "[BACKEND] Template versioning (save history)", "done": False},
    {"text": "[BACKEND] Plain text auto-generator (sync from HTML for spam filters)", "done": False},
    {"text": "[BACKEND] Public View Online link (render template in browser without login)", "done": False},
    {"text": "[FRONTEND] Templates list page (grid of template cards with thumbnails)", "done": True},
    {"text": "[FRONTEND] Create template (blank canvas and preset entry flow)", "done": True},
    {"text": "[FRONTEND] Structured block editor (rows > columns > blocks)", "done": True},
    {"text": "[FRONTEND] Server-side compile preview (design_json > MJML > HTML)", "done": True},
    {"text": "[FRONTEND] Plain Text (Auto-generated) | Plain Text (Custom) tabs", "done": False},
    {"text": "[FRONTEND] Send test email button (enter email address > receive real email)", "done": False},
    {"text": "[FRONTEND] Duplicate template button", "done": False},
    {"text": "[FRONTEND] Category filter tabs on template list", "done": False},
    {"text": "[FRONTEND] Version history panel (see and restore older versions)", "done": False},
    {"text": "[FRONTEND] Dynamic placeholder guide (show list of {{merge_tags}} user can use)", "done": False},
    {"text": "[FRONTEND] Spam score checker (SpamAssassin-style heuristics before campaign send)", "done": False},
    {"text": "[FRONTEND] Mobile preview mode (375px viewport toggle in template editor)", "done": False},
    {"text": "[FRONTEND] Inbox preview simulation (Gmail, Outlook, Apple Mail rendering)", "done": False},
  ]},
  {"title": "PHASE 4 — Campaign Orchestration", "tasks": [
    {"text": "[BACKEND] Campaign CRUD", "done": True},
    {"text": "[BACKEND] Snapshot campaign content + dispatch intents at send time", "done": True},
    {"text": "[BACKEND] Spintax + merge tags", "done": True},
    {"text": "[BACKEND] Scheduled sending", "done": True},
    {"text": "[BACKEND] Pause/resume campaign", "done": True},
    {"text": "[BACKEND] Cancel campaign mid-send", "done": True},
    {"text": "[BACKEND] Resend to unopened contacts", "done": False},
    {"text": "[BACKEND] FIX: exclude_suppressed=True enforced in scheduler.py, main.py, campaigns.py", "done": True},
    {"text": "[FRONTEND] Campaigns list page (status badges, stats)", "done": True},
    {"text": "[FRONTEND] Create campaign wizard (details > audience > content > review)", "done": True},
    {"text": "[FRONTEND] Campaign detail page", "done": True},
    {"text": "[FRONTEND] Pre-send checklist UI", "done": True},
    {"text": "[FRONTEND] Schedule picker (date/time input for scheduled send)", "done": True},
    {"text": "[FRONTEND] Pause button / Cancel button on in-progress campaign", "done": True},
    {"text": "[FRONTEND] Send test email modal (enter email address, preview)", "done": False},
    {"text": "[CAMPAIGN] Automated pre-send validation (no subject / no unsub / blank body blocks send)", "done": False},
    {"text": "[CAMPAIGN] Send throttling control (configurable per-minute rate, ETA shown in UI)", "done": False},
    {"text": "[CAMPAIGN] Send to 5% sample first mode (review analytics before full broadcast)", "done": False},
  ]},
  {"title": "PHASE 5 — Delivery Engine", "tasks": [
    {"text": "[BACKEND] Worker loop (RabbitMQ consumer)", "done": True},
    {"text": "[BACKEND] SMTP send via Mailtrap/SES", "done": True},
    {"text": "[BACKEND] Dynamic SMTP TLS Handshake based on active Port (587 support)", "done": True},
    {"text": "[BACKEND] Retry + dead-letter queue (nack on failure)", "done": True},
    {"text": "[BACKEND] Unsubscribe link injected into every email (HMAC-signed token)", "done": True},
    {"text": "[BACKEND] Physical business address in email footer (CAN-SPAM compliant)", "done": True},
    {"text": "[BACKEND] Hard bounce > auto-mark contact as bounced (SES webhook)", "done": True},
    {"text": "[BACKEND] Spam complaint > auto-mark contact as unsubscribed (SES webhook)", "done": True},
    {"text": "[BACKEND] Daily send limit enforcement (per-tenant, resets at midnight, 429 on breach)", "done": True},
    {"text": "[BACKEND] All dispatch paths enforce exclude_suppressed=True", "done": True},
    {"text": "[BACKEND] Bounce classification: hard bounce suppresses, soft bounce retries 3x", "done": False},
    {"text": "[BACKEND] Domain warmup automation (graduated daily limit increase over 30 days)", "done": False},
    {"text": "[BACKEND] Send reputation scoring per tenant (auto-throttle on >2% bounce/>0.1% complaint)", "done": False},
    {"text": "[BACKEND] FIX: Unsubscribe event logged to email_events with correct tenant_id", "done": True},
    {"text": "[BACKEND] FIX: Re-subscribe sets status to 'subscribed' (was 'active')", "done": True},
    {"text": "[BACKEND] FIX: Re-subscribe API uses NEXT_PUBLIC_API_URL (CORS resolved)", "done": True},
    {"text": "[FRONTEND] /unsubscribe as a public route (no sidebar/header)", "done": True},
    {"text": "[FRONTEND] Unsubscribe page: auto-close tab after 3 seconds + Close Window button", "done": True},
    {"text": "[FRONTEND] Re-subscribe option on unsubscribe page", "done": True},
    {"text": "[FRONTEND] Re-subscribe page: auto-close tab after 3 seconds + Close Window button", "done": True},
    # === ADDED FROM AUDIT ===
    {"text": "[AUDIT FIX 7] Soft vs hard bounce classification — parse SES bounceType (Permanent/Transient/Undetermined) before suppressing (2d)", "done": False},
    {"text": "[AUDIT FIX 8] Real rolling bounce rate writer — write tenant:{id}:bounces:rolling to Redis after each bounce; circuit breaker then actually fires (1.5d)", "done": False},
    {"text": "[AUDIT FIX 9] Move scheduler to standalone worker/scheduler.py — Redis SET NX EX 90 distributed lock, 60s poll, remove from FastAPI lifespan (2d)", "done": False},
    {"text": "[FRIEND AUDIT FIX 19] Batch DB Updates in Worker — Refactor email_sender.py to batch dispatch row updates via RPC instead of 1-by-1 HTTP calls (2d)", "done": False},
    {"text": "[FRIEND AUDIT FIX 20] Native DB Connection — Switch worker from Supabase PostgREST HTTP client to asyncpg TCP connection pool (1.5d)", "done": False},
  ]},
  {"title": "PHASE 6 — Observability & Analytics", "tasks": [
    {"text": "[BACKEND] Open tracking pixel endpoint (HMAC-signed) via Supabase Edge Function", "done": True},
    {"text": "[BACKEND] Click tracking intentionally disabled (cost optimization)", "done": True},
    {"text": "[BACKEND] SES bounce/complaint webhooks captured natively (bypass Edge Functions)", "done": True},
    {"text": "[BACKEND] Stats aggregation (sent, opens, bounces, unsubscribes per campaign)", "done": True},
    {"text": "[BACKEND] Source attribution (gmail_proxy, apple_mpp, outlook, yahoo, scanner, human)", "done": True},
    {"text": "[BACKEND] FIX: Unsubscribes count cross-checks live contact status (re-subscriptions drop count)", "done": True},
    {"text": "[BACKEND] Contact activity log (recipient timeline in analytics API)", "done": True},
    {"text": "[BACKEND] Optional per-campaign click tracking (opt-in, stored in email_events)", "done": False},
    {"text": "[BACKEND] CTR stat card when click tracking enabled (unique clicks / unique opens)", "done": False},
    {"text": "[BACKEND] Engagement over time graph (opens/bounces/unsubs by hour, first 72h)", "done": False},
    {"text": "[FRONTEND] Campaign analytics page (Sent, Opens Unique, Opens Total, Bounces, Unsubscribes)", "done": True},
    {"text": "[FRONTEND] FIX: Recipient Activity 'Unsubscribed' column reflects live contact status", "done": True},
    {"text": "[FRONTEND] Proxy/Scanner breakdown panel (Gmail, Apple MPP, Outlook, Yahoo, Human)", "done": True},
    {"text": "[FRONTEND] FIX: Human-filtered toggle removed — all signals shown natively", "done": True},
    {"text": "[FRONTEND] Dashboard homepage sender health widget", "done": True},
    {"text": "[FRONTEND] Export analytics as CSV / PDF summary", "done": False},
  ]},
  {"title": "PHASE 7 — Plan Enforcement", "tasks": [
    {"text": "[BACKEND] Plans table (free/starter/pro/enterprise with limits)", "done": False},
    {"text": "[BACKEND] Monthly email sent counter per tenant", "done": False},
    {"text": "[BACKEND] Block sends when quota exceeded", "done": False},
    {"text": "[BACKEND] Contact count limit enforcement", "done": False},
    {"text": "[BACKEND] 80% quota trigger (notification)", "done": False},
    {"text": "[BACKEND] Worker-triggered email notifications via Centralized System Emailer", "done": False},
    {"text": "[FRONTEND] Plan & Usage page (progress bars for emails + contacts vs limit)", "done": False},
    {"text": "[FRONTEND] Upgrade plan modal (plan comparison table)", "done": False},
    {"text": "[FRONTEND] In-app banner when 80% quota reached", "done": False},
    {"text": "[FRONTEND] Blocked send page when quota maxed", "done": False},
    {"text": "[BILLING] 14-day free trial with Pro limits (no credit card required)", "done": False},
    {"text": "[BILLING] Overage pricing instead of hard blocking (per-email rate above quota)", "done": False},
    {"text": "[BILLING] Auto-downgrade to Free tier on subscription lapse (pause, not delete campaigns)", "done": False},
    {"text": "[BILLING] Grace period on failed payment (7 days, escalating reminder emails)", "done": False},
    # === ADDED FROM AUDIT ===
    {"text": "[AUDIT FIX 10] Wire quota gate to queue_campaign_dispatch() — check monthly emails_sent vs plan limit before publishing to RabbitMQ (2d)", "done": False},
  ]},
  {"title": "PHASE 7.5 — Infrastructure & DevOps", "tasks": [
    {"text": "[DEVOPS] Docker (Dockerfiles for API, worker, client)", "done": True},
    {"text": "[DEVOPS] docker-compose.yml", "done": True},
    {"text": "[DEVOPS] Nginx config", "done": True},
    {"text": "[DEVOPS] SSL/HTTPS (Let's Encrypt guide in docs)", "done": False},
    {"text": "[DEVOPS] CI/CD pipeline (GitHub Actions)", "done": False},
    {"text": "[DEVOPS] Load & Spam Testing Setup (k6 + Mail-Tester integration)", "done": False},
    {"text": "[DEVOPS] Security Headers & Content Security Policy for all pages", "done": False},
    {"text": "[DEVOPS] API Rate Limiting (per-tenant, per-endpoint, burst protection)", "done": False},
    {"text": "[DEVOPS] Background Job Status Table (CSV import, GDPR export, campaign send)", "done": False},
    {"text": "[DEVOPS] Worker concurrency safety (locked_by column to prevent zombie tasks)", "done": False},
    {"text": "[DEVOPS] Idempotency guard (external_msg_id to prevent double-sends on retry)", "done": False},
    {"text": "[HEALTH CHECKS] GET /health on FastAPI (db + worker status)", "done": False},
    {"text": "[HEALTH CHECKS] GET /health on Worker (queue depth, last processed)", "done": False},
    {"text": "[OBSERVABILITY] Centralized structured logging (ELK stack or Grafana Loki)", "done": False},
    {"text": "[OBSERVABILITY] Sentry error tracking on FastAPI + Next.js frontend", "done": False},
    {"text": "[OBSERVABILITY] Database backup strategy (daily, 30-day retention, monthly restore drill)", "done": False},
    # === ADDED FROM AUDIT ===
    {"text": "[AUDIT FIX 11] Uncomment Nginx block in docker-compose.yml; close ports 8000 and 3000 from public network (0.5d)", "done": False},
    {"text": "[AUDIT FIX 12] GitHub Actions CI/CD pipeline — lint + test + Docker build + deploy on merge to main (2d)", "done": False},
    {"text": "[AUDIT FIX 13] git rm frnds_contacts.csv, testmail_contacts.csv, platform/api/app.db; add *.csv and *.db to .gitignore; purge from git history (0.5d)", "done": False},
    {"text": "[FRIEND AUDIT FIX 21] Dynamic Config Loading — Replace Path(__file__) .env loading with robust config.py / pydantic-settings (0.5d)", "done": False},
  ]},
  {"title": "PHASE 7.6 — Code Quality & Hygiene [ADDED FROM AUDIT]", "tasks": [
    {"text": "[AUDIT FIX 14] Automated test suite — 20 priority tests: auth signup/login, _suppress_contact tenant isolation, unsub token roundtrip, dispatch contact count, quota gate, bounce classification (4d)", "done": False},
    {"text": "[AUDIT FIX 15] Migration file renumbering — resolve duplicate 012_* and 013_* filenames for safe fresh deployment (0.5d)", "done": False},
    {"text": "[AUDIT FIX 16] Remove dead Clerk config — delete CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY from docker-compose.yml and .env.example (0.5d)", "done": False},
    {"text": "[FRIEND AUDIT FIX 22] Repository Pattern / DAL — Abstract direct Supabase queries out of controllers into services/db.py (4d)", "done": False},
    {"text": "[FRIEND AUDIT FIX 23] Monolithic Worker Refactor — Split email_sender.py into modular layers (parsing, sending, injection, logging) (2d)", "done": False},
  ]},
  {"title": "PHASE 8 — Account Settings & Administration", "tasks": [
    {"text": "[SETTINGS CORE] Settings landing page (/settings) with navigation cards", "done": True},
    {"text": "[SETTINGS CORE] Profile page (edit name, timezone)", "done": True},
    {"text": "[SETTINGS CORE] Organization page (company name, CAN-SPAM physical address)", "done": True},
    {"text": "[SETTINGS CORE] Team Management — invite users to workspace", "done": False},
    {"text": "[INVITATION ARCH] Per-member isolation_model (team/agency) on tenant_users — migration 024", "done": True},
    {"text": "[INVITATION ARCH] isolation_model on team_invitations, set at invite time — migration 024", "done": True},
    {"text": "[SECURITY & COMPLIANCE] GDPR Right-to-Erase (anonymize contact PII)", "done": True},
    {"text": "[SECURITY & COMPLIANCE] Data Export button (CSV export of all contacts)", "done": True},
    {"text": "[SECURITY & COMPLIANCE] Compliance checklist page (/settings/compliance)", "done": True},
    {"text": "[SECURITY & COMPLIANCE] Multi-Factor Authentication (MFA via TOTP)", "done": False},
    {"text": "[DEVELOPER TOOLS] API Keys page (generate, view, revoke — SHA-256 hashed)", "done": True},
    {"text": "[DEVELOPER TOOLS] Custom sending domain setup UI (SPF/DKIM/DMARC records)", "done": True},
    {"text": "[DEVELOPER TOOLS] Sender Identity OTP Verification (Anti-Spoofing)", "done": True},
    {"text": "[DEVELOPER TOOLS] Backend: POST /senders/verify-request, POST /senders/verify-submit", "done": True},
    {"text": "[DEVELOPER TOOLS] verification_token + token_expires_at on sender_identities — migration 025", "done": True},
    {"text": "[DEVELOPER TOOLS] Webhooks config page (URL + event subscriptions)", "done": False},
    {"text": "[DEVELOPER TOOLS] Fine-grained roles: Viewer / Operator / Manager / Admin", "done": False},
    {"text": "[DEVELOPER TOOLS] API usage dashboard (requests/day, error rate, rate-limit quota)", "done": False},
    {"text": "[SECURITY] Active session list (device, browser, location, last active — with revoke)", "done": False},
  ]},
  {"title": "PHASE 9 — Payments (Stripe/Razorpay)", "tasks": [
    {"text": "[BACKEND] Stripe integration", "done": False},
    {"text": "[BACKEND] Webhook from Stripe > update plan in DB", "done": False},
    {"text": "[BACKEND] Invoice generation", "done": False},
    {"text": "[FRONTEND] Pricing page (plan comparison table with Subscribe button)", "done": False},
    {"text": "[FRONTEND] Checkout flow (Stripe hosted page or embedded)", "done": False},
    {"text": "[FRONTEND] Billing history page (past invoices, download PDF)", "done": False},
    {"text": "[FRONTEND] Payment failed banner", "done": False},
    {"text": "[BILLING] Invoice auto-email with PDF attachment on every charge", "done": False},
    {"text": "[BILLING] GST support for India (CGST/SGST/IGST breakdown on invoices)", "done": False},
  ]},
  {"title": "PHASE 10 — Advanced Campaigns", "tasks": [
    {"text": "[BACKEND] A/B test variant storage", "done": False},
    {"text": "[BACKEND] Winner selection logic (by open rate after 4 hours)", "done": False},
    {"text": "[BACKEND] Drip campaign sequence engine", "done": False},
    {"text": "[BACKEND] Automation trigger system", "done": False},
    {"text": "[FRONTEND] A/B test creation UI (add Subject Line B, set split ratio)", "done": False},
    {"text": "[FRONTEND] A/B test results panel (variant A vs B comparison)", "done": False},
    {"text": "[FRONTEND] Drip campaign builder (sequence of emails + delays)", "done": False},
    {"text": "[FRONTEND] Automation trigger builder", "done": False},
    {"text": "[ADVANCED] Send time optimisation (AI-predicted per-contact peak open window)", "done": False},
    {"text": "[ADVANCED] Auto resend to non-openers after 48h (optional different subject line)", "done": False},
  ]},
  {"title": "PHASE 11 — API & Integrations", "tasks": [
    {"text": "[BACKEND] Transactional send API (/v1/send)", "done": False},
    {"text": "[BACKEND] Webhook output (notify tenant on open/bounce/unsubscribe)", "done": False},
    {"text": "[FRONTEND] API Keys page (generate, view, revoke keys)", "done": False},
    {"text": "[FRONTEND] Webhooks config page (enter URL, select events)", "done": False},
    {"text": "[FRONTEND] Developer docs page (embedded docs or link)", "done": False},
    {"text": "[API] Webhook retry system (exponential backoff, 5 attempts, then mark inactive)", "done": False},
    {"text": "[API] Per-API-key rate limiting (429 + Retry-After header)", "done": False},
    {"text": "[API] Official JS SDK (shrmail-js) with typed methods + auto-retry", "done": False},
    {"text": "[API] Official Python SDK (shrmail-python) with typed methods + auto-retry", "done": False},
  ]},
  {"title": "PHASE 12 — Enterprise Domain Auto-Discovery (JIT Provisioning)", "tasks": [
    {"text": "[SECURITY ARCH] Enterprise SSO (SAML / LDAP) Integration", "done": False},
    {"text": "[SECURITY ARCH] PDEP Filter (block @gmail.com, @yahoo.com from JIT discovery)", "done": False},
    {"text": "[SECURITY ARCH] Verification-Before-Disclosure (VBD) — OTP before workspace reveal", "done": False},
    {"text": "[SECURITY ARCH] Tenant ID Obfuscation via cryptographic salts (Hashids)", "done": False},
    {"text": "[SECURITY ARCH] Admin Flood Protection (rate-limit mass join requests)", "done": False},
    {"text": "[SECURITY ARCH] DB additions: workspace_domains + join_requests tables", "done": False},
    {"text": "[FRONTEND] JIT Onboarding Intercept Screen (OTP > Request to Join Team)", "done": False},
    {"text": "[FRONTEND] Employee Waiting Room Dashboard (pending approval state)", "done": False},
    {"text": "[FRONTEND] IT Admin Governance Portal (Approve / Reject / Blacklist requests)", "done": False},
  ]},
  {"title": "PHASE 13 — Scale (After Handover)", "tasks": [
    {"text": "[BACKEND] Redis queue (replace DB polling)", "done": False},
    {"text": "[BACKEND] IP warmup scheduler (auto-increase limits over 30 days)", "done": False},
    {"text": "[BACKEND] Blacklist monitoring (check MXToolbox daily via cron)", "done": False},
    {"text": "[BACKEND] Per-tenant custom sending domain backend (DKIM key generation)", "done": False},
    {"text": "[MICROSERVICES] Break monolith into: auth, contacts, template, campaign, delivery, analytics, notification services", "done": False},
    {"text": "[MICROSERVICES] API Gateway (Nginx/Kong) — single entry point routing", "done": False},
    {"text": "[MICROSERVICES] Each service in its own Docker container", "done": False},
    {"text": "[MICROSERVICES] Services communicate via REST or RabbitMQ/Kafka", "done": False},
    {"text": "[FRONTEND] Custom domain setup wizard (enter domain > get DNS records > verify)", "done": False},
    {"text": "[FRONTEND] IP warmup status page (daily send limit and progression)", "done": False},
    {"text": "[FRONTEND] Platform health dashboard (Redis queue depth, worker status)", "done": False},
    {"text": "[SCALE] Horizontal worker scaling (stateless workers, Docker Swarm / k8s replicas)", "done": False},
    {"text": "[SCALE] Circuit breaker on SES SMTP (fail fast on consecutive failures, auto-reset)", "done": False},
    {"text": "[SCALE] Cost monitoring dashboard (per-tenant SES cost vs plan revenue)", "done": False},
  ]},
]

# Format task text with HTML badge for the [CATEGORY] prefix
def format_task(task):
    text = task["text"]
    import re
    m = re.match(r'^\[([^\]]+)\]\s+(.*)', text)
    cat = ""
    body = text
    if m:
        cat = m.group(1)
        body = m.group(2)
        formatted_text = f"<span class='text-xs font-bold text-indigo-400 mr-2 uppercase block sm:inline'>[{cat}]</span> {body}"
    else:
        formatted_text = text
    # Look up a plain-English description by body text, then fall back to full raw text
    desc = DESCRIPTIONS.get(body, DESCRIPTIONS.get(text, ""))
    return {"text": formatted_text, "done": task["done"], "desc": desc}

formatted_phases = [{"title": p["title"], "tasks": [format_task(t) for t in p["tasks"]]} for p in phases]

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Engine - Phase Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; background-color: #09090b; color: #fafafa; }
        .glass { background: rgba(24, 24, 27, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(63, 63, 70, 0.4); }
        .task-desc { font-size: 0.75rem; line-height: 1.5; color: #71717a; margin-top: 3px; padding-left: 0; }
        .task-desc.hidden-desc { display: none; }
    </style>
</head>
<body class="p-4 sm:p-8 min-h-screen">
    <div class="max-w-4xl mx-auto">
        <div class="mb-10 text-center">
            <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">Email Engine Launch Tracker</h1>
            <p class="text-zinc-400">Interactive Phase Execution Plan</p>
            <div class="mt-6 flex flex-wrap justify-center gap-3 sm:gap-6 text-sm font-medium">
                <div class="glass px-5 py-3 rounded-xl text-emerald-400 shadow-md">Completed: <span id="master-completed" class="font-bold text-lg ml-1">0</span></div>
                <div class="glass px-5 py-3 rounded-xl text-indigo-400 shadow-md">Total Tasks: <span id="master-total" class="font-bold text-lg ml-1">0</span></div>
                <div class="glass px-5 py-3 rounded-xl text-amber-400 shadow-md">Overall Progress: <span id="master-percent" class="font-bold text-lg ml-1">0</span>%</div>
            </div>
        </div>
        
        <div id="phases-container" class="space-y-6"></div>
    </div>

    <script>
        const phasesData = MAGIC_JSON;
        const savedState = JSON.parse(localStorage.getItem('shrmail_phases_tracker') || '{}');
        let totalTasks = 0;
        let completedTasks = 0;

        const container = document.getElementById('phases-container');
        
        function updateMasterStats() {
            document.getElementById('master-completed').textContent = completedTasks;
            document.getElementById('master-total').textContent = totalTasks;
            document.getElementById('master-percent').textContent = 
                totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0;
        }

        phasesData.forEach((phase, pIndex) => {
            if (phase.tasks.length === 0) return;
            
            const pCard = document.createElement('div');
            pCard.className = 'glass rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-indigo-500/30';
            
            let phaseCompleted = 0;
            
            const taskHeader = document.createElement('div');
            taskHeader.className = 'flex flex-col sm:flex-row justify-between sm:items-center mb-5 border-b border-zinc-800 pb-4 gap-2';
            taskHeader.innerHTML = `<h2 class="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                                        <div class="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                                        ${phase.title}
                                    </h2>
                                    <span class="text-xs font-mono px-3 py-1.5 rounded-lg border border-zinc-700/50 text-zinc-300 bg-zinc-800" id="stat-${pIndex}"></span>`;
            pCard.appendChild(taskHeader);
            
            const taskList = document.createElement('div');
            taskList.className = 'space-y-2';
            
            phase.tasks.forEach((task, tIndex) => {
                totalTasks++;
                const taskId = `task-${pIndex}-${tIndex}`;
                let isChecked = savedState[taskId] !== undefined ? savedState[taskId] : task.done;
                if (isChecked) { completedTasks++; phaseCompleted++; }
                
                const tDiv = document.createElement('div');
                tDiv.className = 'flex items-start gap-4 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors group';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = taskId;
                checkbox.checked = isChecked;
                checkbox.className = 'mt-1 w-5 h-5 text-indigo-500 bg-zinc-900 border-zinc-700 rounded-md focus:ring-indigo-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 cursor-pointer transition-all';
                
                checkbox.addEventListener('change', (e) => {
                    savedState[taskId] = e.target.checked;
                    localStorage.setItem('shrmail_phases_tracker', JSON.stringify(savedState));
                    
                    if(e.target.checked) { completedTasks++; phaseCompleted++; } 
                    else { completedTasks--; phaseCompleted--; }
                    
                    updateMasterStats();
                    document.getElementById(`stat-${pIndex}`).textContent = `${phaseCompleted} / ${phase.tasks.length} DONE`;
                    label.classList.toggle('line-through', e.target.checked);
                    label.classList.toggle('text-zinc-500', e.target.checked);
                    label.classList.toggle('text-zinc-200', !e.target.checked);
                    if (descEl) {
                        descEl.classList.toggle('text-zinc-600', e.target.checked);
                        descEl.classList.toggle('text-zinc-500', !e.target.checked);
                    }
                });
                
                let descEl = null;
                
                const label = document.createElement('label');
                label.htmlFor = taskId;
                label.className = `text-sm leading-relaxed cursor-pointer select-none block w-full transition-all duration-200 ${isChecked ? 'line-through text-zinc-500' : 'text-zinc-200'}`;
                label.innerHTML = task.text;
                
                const labelWrap = document.createElement('div');
                labelWrap.className = 'flex-1 min-w-0';
                labelWrap.appendChild(label);

                if (task.desc) {
                    const desc = document.createElement('p');
                    desc.className = `task-desc ${isChecked ? 'text-zinc-600' : 'text-zinc-500'}`;
                    desc.textContent = task.desc;
                    descEl = desc;
                    labelWrap.appendChild(desc);
                }

                tDiv.appendChild(checkbox);
                tDiv.appendChild(labelWrap);
                taskList.appendChild(tDiv);
            });
            
            pCard.appendChild(taskList);
            container.appendChild(pCard);
            document.getElementById(`stat-${pIndex}`).textContent = `${phaseCompleted} / ${phase.tasks.length} DONE`;
        });
        
        updateMasterStats();
    </script>
</body>
</html>"""

html_out = html_template.replace("MAGIC_JSON", json.dumps(formatted_phases))
with open("progress.html", "w", encoding="utf-8") as f:
    f.write(html_out)

print(f"Generated progress.html successfully! ({sum(len(p['tasks']) for p in phases)} total tasks across {len(phases)} phases)")
