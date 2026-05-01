import re
import json
import os
from typing import List, Dict, Any, Optional

# --- CONFIGURATION ---
md_path = "docs/plan/phase_wise_plan.md"
html_path = "docs/progress.html"

# --- TASK DESCRIPTIONS (Merged from task_descriptions.py) ---
# This dictionary provides plain-English explanations for technical tasks.
DESCRIPTIONS = {
  "shadcn/ui installed and initialized": "The shadcn/ui component library is added to the project — it provides accessible, customizable UI primitives like buttons, dialogs, and inputs.",
  "Inter font installed in root layout": "Google's Inter typeface is loaded globally, giving the entire app a modern, clean, and highly-legible text style.",
  "Core dark-mode tokens exist in globals.css": "CSS variables for the dark-mode color palette (backgrounds, borders, text, accents) are defined once in globals.css so every component can reference them.",
  "Typography scale is fully defined": "Font sizes, weights, and line heights form a consistent scale — headings, body text, and captions all feel visually harmonious.",
  "Semantic token set is complete": "Every color token has a meaningful name (e.g. --color-surface, --color-text-muted) so teams talk about intent, not raw HEX codes.",
  "App no longer uses hardcoded colors or inline style-heavy UI": "No component directly writes #1a1a2e or style={{ color: 'red' }} — all colors go through the token system, making theme changes instant.",
  "Design Tokens Documentation Page (internal token reference)": "A living reference page inside the app lists every token name, CSS variable, and its visual output — prevents developers from re-inventing decisions.",
  "Loading skeletons on all list pages (contacts, campaigns, templates)": "While data is being fetched, a pulsing placeholder layout appears instead of a blank screen — improves perceived performance significantly.",
  "Dark / Light mode toggle (CSS variable swap)": "A toggle switches the entire app between dark and light themes by swapping the root CSS variable values — no components need to change.",
  "Button.tsx": "A shared Button component with consistent sizing, colors, loading state, and disabled state — used everywhere so buttons always look the same.",
  "Badge.tsx": "A small inline label component for status indicators like 'Active', 'Paused', 'Draft' — color-coded and reusable.",
  "HealthDot.tsx": "A tiny colored dot that signals system health at a glance — green for healthy, yellow for degraded, red for down.",
  "LoadingSpinner.tsx": "An animated spinner shown during async operations — ensures users always have feedback that work is in progress.",
  "StatCard.tsx": "A card component that displays a single metric (e.g. 'Total Sent: 12,450') with an icon, a number, and a trend indicator.",
  "StatusBadge.tsx": "A badge specifically designed for status values — maps status strings to distinct color themes automatically.",
  "ConfirmModal.tsx": "A confirmation dialog that asks the user to explicitly approve dangerous actions like 'Delete 1,000 contacts' before proceeding.",
  "Toast.tsx": "A small pop-up notification (top-right corner) for showing success, error, or info messages after async operations complete.",
  "PageHeader.tsx": "A consistent header block shown at the top of every page — includes the page title, breadcrumb, and an optional action button.",
  "DataTable.tsx": "A reusable sortable, paginated table component with column definitions — contacts list, campaigns list, and templates all use this.",
  "EmptyState.tsx": "A friendly illustration + message shown when a list has zero items — replaces blank white space with a clear call-to-action.",
  "Breadcrumb.tsx": "A trail of links (e.g. Campaigns › Test Campaign › Analytics) that shows the user where they are inside the app hierarchy.",
  "src/components/ui/index.ts": "A barrel export file — lets you write `import { Button, Badge } from '@/components/ui'` instead of separate import lines per component.",
  "Tailwind config maps tokens to utility names": "The tailwind.config.ts file bridges CSS variables to Tailwind class names so you can write `text-accent` and it resolves to the correct CSS variable.",
  "All mapped Tailwind token names resolve to actual CSS variables": "A verification check: every Tailwind utility added in the config actually has a corresponding CSS variable in globals.css — no dangling references.",
  "Every destructive action uses ConfirmModal": "Any button that deletes or permanently modifies data is blocked behind a ConfirmModal — prevents accidental data loss.",
  "Every async form submit uses loading state consistently": "When a form is submitted, its button shows a spinner and disables itself — prevents double-submissions and communicates that work is happening.",
  "Every API success path uses toast feedback consistently": "After a successful API call, a green toast appears — users always know their action was saved.",
  "Every API error path uses toast feedback consistently": "When an API call fails, a red toast appears with a short message — users never see a blank failure silently.",
  "Every empty list uses EmptyState": "All list pages (contacts, campaigns, templates) show the EmptyState component instead of a blank div when there is no data.",
  "Every list page has consistent search and filter behavior": "Search boxes, filter dropdowns, and pagination behave identically across all list pages — users only learn the pattern once.",
  "Mobile navigation is complete end-to-end": "The sidebar collapses into a hamburger menu on small screens, all pages are scrollable, and no UI is clipped or hidden on mobile.",
  "Remove global *:focus { outline: none }": "Removing this rule restores visible keyboard focus indicators — a critical accessibility requirement for users navigating by keyboard.",
  "Modal accessibility is complete (focus trap + restore)": "When a modal opens, keyboard focus is trapped inside it; when it closes, focus returns to the triggering element — standard a11y behavior.",
  "Icon-only buttons are fully labeled app-wide": "Every button that shows only an icon has an aria-label attribute so screen readers can announce its purpose.",
  "44x44 touch-target guidance is satisfied app-wide": "All interactive elements are at least 44×44 CSS pixels in size — Apple/Google accessibility guideline to prevent mis-taps on mobile.",
  "Mailhog added to docker-compose.yml": "Mailhog is a local email catcher — emails sent during local development go to a web UI instead of real inboxes, which is safe and observable.",
  "scripts/seed_dev_data.py added": "A script that populates the local database with realistic sample data (tenants, contacts, campaigns) so developers can test the UI without real data.",
  ".env.example fully documents all required variables": "A complete template of all environment variables with comments explaining where to get each value — so new developers can set up the project without asking anyone.",
  "Custom email/password auth (bcrypt + custom JWT)": "Passwords are hashed with bcrypt before storage. After login, a signed JWT token is issued — the token is required for every protected API call.",
  "Tenant membership model (users, tenants, tenant_users)": "Three linked tables: users (who you are), tenants (your workspace), and tenant_users (your role in that workspace). One user can have multiple workspaces.",
  "Onboarding flow (4-step wizard + progressive endpoints)": "New tenants go through a wizard (workspace name → use-case → integrations → scale) before seeing the full dashboard — ensures every account is properly configured.",
  "JWT middleware (tenant_id, role, email, user_id verification)": "Every API request passes through middleware that verifies the JWT, extracts tenant_id/role/user_id, and injects them into the request context for all route handlers.",
  "Active-tenant guard exists": "A middleware check blocks API calls from tenants whose account is suspended or still in the onboarding state.",
  "Workspace switching exists": "A user who belongs to multiple workspaces can switch between them — the JWT is re-issued for the selected workspace.",
  "/auth/me fully implemented": "The GET /auth/me endpoint returns the full profile of the currently logged-in user — name, email, role, plan, and workspace details.",
  "All onboarding endpoints use JWT-only tenant resolution consistently": "No onboarding route reads tenant_id from the request body or query string — it always comes from the verified JWT, preventing spoofing.",
  "Login page": "The frontend login screen with email/password fields, error messaging, and a link to sign up or reset password.",
  "Signup page": "The registration screen where new users create their account — collects name, email, and password, then triggers email verification.",
  "reCAPTCHA on Signup form": "Google reCAPTCHA is added to the signup form to block automated bot registrations.",
  "Onboarding wizard (workspace > use-case > integrations > scale > complete)": "The multi-step setup flow shown to new tenants — it collects workspace name, intended email use case, connected integrations, and expected volume.",
  "Interactive onboarding checklist on dashboard": "The dashboard shows a setup checklist (verify email, add a sender domain, create first campaign) that disappears once all steps are complete.",
  "Sidebar navigation layout": "The left-side navigation bar with links to Contacts, Campaigns, Templates, Analytics, Settings — collapses on mobile.",
  "Auth context exists": "A React context that stores the current user's session (token, role, tenant_id) and provides it to any component via a hook.",
  "Middleware redirects exist": "Next.js route middleware that checks the JWT/session cookie and redirects unauthenticated users to the login page automatically.",
  "Route protection is fully centralized and consistent": "Every protected page uses the same single middleware check — no page accidentally forgets to protect itself.",
  "JWT carries tenant identity": "The JWT payload includes tenant_id so every API call automatically carries workspace context without an extra database lookup.",
  "X-Tenant-ID is validated against JWT when used": "If a request sends an X-Tenant-ID header, the server verifies it matches the tenant_id inside the JWT — prevents tenants from accessing other users' data.",
  "Onboarding tenants are blocked from active-tenant routes": "A guard prevents a tenant still in the onboarding wizard from calling production API endpoints like 'send campaign'.",
  "Social Auth (Google, GitHub) via OAuth 2.0 / Supabase": "Users can sign in with their Google or GitHub account instead of creating a password — handled via Supabase's OAuth integration.",
  "Rate limiting on login + registration endpoints (per IP, per email)": "Login and signup are limited to 10 attempts per minute per IP/email — prevents brute-force password attacks.",
  "Email verification required before onboarding completes": "A user must click the verification link in their email before the onboarding wizard can advance past step 1.",
  "Short-lived access tokens (15-30 min) + silent refresh tokens": "Access tokens expire quickly so stolen tokens have a short window. Refresh tokens automatically issue new access tokens in the background.",
  "Token revocation via token_version counter (force-logout all devices)": "A counter on each user row is incremented to invalidate all existing JWTs instantly — useful for 'sign out everywhere' or account compromise scenarios.",
  "Remove custom /auth/forgot-password endpoint": "The hand-rolled forgot-password route was replaced by Supabase Auth's built-in email flow, which handles token generation and expiry securely.",
  "Remove custom /auth/reset-password endpoint": "Same as above — the custom password-reset handler was removed in favor of Supabase Auth's standard reset flow.",
  "reCAPTCHA token verification endpoint/middleware": "Backend middleware that validates the reCAPTCHA token sent from the signup form — prevents bots from auto-creating accounts.",
  "Audit logs table (who did what, when, on which record — metadata only)": "A database table that records every important action (who deleted contacts, who sent a campaign) — stores metadata only, never actual email content.",
  "Audit log table is write-only / immutable (no UPDATE or DELETE allowed)": "Once a log row is written, it can never be changed or deleted — even by admins — making it a tamper-proof activity record.",
  "Log severity levels: INFO / WARNING / CRITICAL on every log row": "Each audit log entry has a severity tag: INFO for normal events, WARNING for unusual ones, CRITICAL for high-risk actions like bulk deletes.",
  "Auto-alert on CRITICAL log events (bulk delete >1000, suspicious login)": "When a CRITICAL event occurs, the system automatically emails the workspace owner — e.g. 'Someone deleted 2,000 contacts from your account'.",
  "Configure Supabase Auth SMTP to use shrflow.app@gmail.com": "Supabase's auth emails (verification, password reset) are routed through your own Gmail account instead of Supabase's generic sender.",
  "Fix forgot-password page — Supabase Auth built-in reset email flow": "The frontend forgot-password page now calls Supabase Auth's built-in reset endpoint instead of a custom one.",
  "Fix reset-password page — Supabase Auth password update": "The reset-password page uses Supabase Auth's updateUser() call to change the password after the reset link is clicked.",
  "Test: sign up > verify email > login > forgot password > reset": "An end-to-end manual test confirming the full auth lifecycle works: create account, verify email, log in, reset password.",
  "Audit log viewer with severity filter (INFO / WARNING / CRITICAL)": "A page in the admin settings that shows the audit log timeline with filter buttons for severity level.",
  "MFA via TOTP for workspace admins": "Workspace admins can enable time-based one-time passwords (Google Authenticator style) as a second login factor.",
  "CSV/XLSX ingestion": "Tenants can upload a CSV or Excel file of contacts. The file is parsed and each row is inserted into the contacts table for the current tenant.",
  "Upload preview endpoint": "Before committing a CSV import, an endpoint parses the file and returns a preview of the first few rows and the detected columns for the user to review.",
  "Async import job creation": "After the user confirms the column mapping, an import job record is created in the database and handed off to the background worker — the API returns immediately.",
  "RabbitMQ background import worker": "A background process consumes import jobs from the queue and processes each CSV row — deduplicates contacts and inserts them in batches.",
  "Import batch history": "Every CSV upload creates a 'batch' record with stats (total rows, imported, duplicates, errors) so tenants can review past imports.",
  "Deduplication (in-memory + Supabase upsert on tenant_id, email)": "Contacts are deduplicated both in memory (within the file) and at the database level using an upsert — the same email address is never inserted twice per tenant.",
  "Contact status (subscribed, unsubscribed, bounced, complained)": "Each contact has an explicit status that controls whether emails are sent to them. Bounced and complained contacts are automatically excluded from campaigns.",
  "Domain summary endpoint and email_domain storage": "Each contact's email domain is extracted and stored separately. An endpoint returns a summary of contacts grouped by domain (e.g. 450 @gmail.com, 200 @yahoo.com).",
  "Batch-scoped domain filtering": "When selecting a campaign audience, tenants can filter contacts to a specific domain within a specific import batch.",
  "Bulk delete": "Tenants can select and delete multiple contacts at once — either selected rows or an entire batch.",
  "Contact search endpoint (email, name, tag)": "A search endpoint that queries contacts by email address, name, or tag — used by the search box on the contacts list page.",
  "Contact update endpoint (email + custom fields)": "An endpoint that updates a contact's email address or custom field values.",
  "Tags CRUD API (add/remove/list tags per contact)": "Contacts can be tagged with labels (e.g. 'VIP', 'newsletter'). This API manages creating, assigning, removing, and listing tags.",
  "Suppression list API (GET /contacts/suppression)": "An endpoint that returns all suppressed contacts (bounced, unsubscribed, complained) for the current tenant — used on the Suppression List page.",
  "Export contacts API": "An API that generates a CSV download of all contacts for the current tenant — useful for backups or migrations.",
  "Contacts list page (table with search and pagination)": "The main contacts screen — a paginated table with a search bar, status filters, and bulk action buttons.",
  "Import contacts modal with preview and mapping": "A dialog that guides the user through uploading a CSV, previewing its contents, and mapping columns to contact fields before confirming the import.",
  "Async import progress polling": "After an import starts, the frontend polls an endpoint every 3 seconds to show live progress (rows processed, errors) to the user.",
  "Import history tab": "A tab on the Contacts page listing all past import batches — shows date, file name, row count, and import status.",
  "Batch detail page": "A detail page for a specific import batch — shows a breakdown of imported contacts, duplicate counts, and any row-level errors.",
  "Batch detail domain filtering": "On the batch detail page, contacts are grouped and filterable by email domain.",
  "Contact status badges (subscribed / unsubscribed / bounced)": "Colored badges in the contacts table that show the status of each contact at a glance.",
  "Bulk action buttons (delete selected)": "Checkboxes on the contacts table rows, plus a 'Delete Selected' button in the toolbar, for mass management.",
  "Contact detail editing (email + custom fields)": "Clicking on a contact opens an edit panel where the tenant can update the email address or any custom field.",
  "Export contacts to CSV button": "A button on the contacts page that triggers a CSV download of the current filtered contact list.",
  "Tags UI (add/remove tags on contacts)": "An inline UI on the contact detail view to add or remove tags from a contact.",
  "Suppression list page (view bounced/spam/unsubscribed contacts)": "A dedicated page that shows all suppressed contacts — helps tenants audit who won't receive emails and why.",
  "Campaign audience selection supports batch-domain targeting": "When creating a campaign, tenants can choose to send to all contacts from a specific imported batch or domain.",
  "Campaign audience selection supports multi-domain selection inside a batch": "Tenants can select multiple domains within a single batch as the campaign audience.",
  "Template CRUD": "Create, read, update, and delete email templates — the core data management API for the template engine.",
  "Category": "Templates can be organized by category (e.g. Newsletter, Promotional, Transactional) to make finding the right base design easier.",
  "Persist compiled HTML from the active block editor": "When a tenant saves a block-editor template, the compiled HTML is stored alongside the design JSON so it can be previewed and sent without re-compiling.",
  "Preset gallery and preset-driven template creation": "A gallery of pre-built starter templates (welcome email, newsletter, promo) that tenants can select as a starting point instead of building from scratch.",
  "Templates list page (grid of template cards with thumbnails)": "The main templates screen showing cards for each template with a visual thumbnail preview.",
  "Create template (blank canvas and preset entry flow)": "The UI flow for creating a new template — choose between a blank canvas or starting from a preset gallery card.",
  "Structured block editor (rows > columns > blocks)": "The drag-and-drop email editor where tenants compose emails by combining row containers, column layouts, and content blocks (text, image, button).",
  "Server-side compile preview (design_json > MJML > HTML)": "The template JSON is sent to the server and compiled through MJML into responsive HTML — the result is shown as a live preview in the editor.",
  "Send test email button (enter email address > receive real email)": "A button in the template editor that sends the current template to any entered email address so the tenant can preview it in a real inbox.",
  "Campaign CRUD": "Create, read, update, and delete campaigns — the core data management API for the campaign engine.",
  "Snapshot campaign content + dispatch intents at send time": "At the moment a campaign is sent, the system takes a snapshot of the template HTML and creates one dispatch record per recipient — so later content changes don't affect an in-progress send.",
  "Spintax + merge tags": "Spintax ({Hello|Hi|Hey}) and merge tags ({{first_name}}) are applied per-recipient — each email looks slightly different and is personalized.",
  "Scheduled sending": "Campaigns can be scheduled for a future date/time. The scheduler checks for due campaigns every 60 seconds and dispatches them automatically.",
  "Pause/resume campaign": "A running campaign can be paused mid-send to halt delivery temporarily, then resumed — useful for catching mistakes after launch.",
  "Cancel campaign mid-send": "A campaign can be permanently cancelled while in progress — all remaining unsent dispatch intents are marked cancelled.",
  "Campaigns list page (status badges, stats)": "The main campaigns screen — a list of all campaigns with status badges (draft, scheduled, sending, sent), and quick stats (sent count, open rate).",
  "Create campaign wizard (details > audience > content > review)": "A multi-step wizard for creating a campaign: fill in basic details, choose the audience, pick a template, then review before sending.",
  "Campaign detail page": "A page showing everything about a single campaign: its settings, current status, dispatch progress, and a link to analytics.",
  "Pre-send checklist UI": "Before a campaign is sent, a checklist verifies critical elements are in order: subject line entered, unsubscribe link present, audience not empty, sender domain verified.",
  "Schedule picker (date/time input for scheduled send)": "A date/time picker UI for setting when a scheduled campaign should be dispatched.",
  "Pause button / Cancel button on in-progress campaign": "Action buttons on the campaign detail page to pause or cancel a campaign that is currently sending.",
  "Send test email modal (enter email address, preview)": "A modal inside the campaign wizard where the tenant can send themselves a test version of the campaign before the real send.",
  "Worker loop (RabbitMQ consumer)": "The email worker is a long-running process that listens to a RabbitMQ queue. When a campaign is dispatched, thousands of emails are published to the queue and the worker processes them in order.",
  "SMTP send via Mailtrap/SES": "The worker sends each individual email via SMTP — either through Mailtrap (in development/testing) or Amazon SES (in production).",
  "Dynamic SMTP TLS Handshake based on active Port (587 support)": "The SMTP connection uses STARTTLS when connecting on port 587, and implicit TLS on port 465 — automatically detected from the port number.",
  "Retry + dead-letter queue (nack on failure)": "If an email fails to send (SMTP error, timeout), the worker NAcKs the RabbitMQ message, which places it in a dead-letter queue for retry or inspection.",
  "Unsubscribe link injected into every email (HMAC-signed token)": "The worker automatically appends a cryptographically signed unsubscribe link to every email — the signature prevents forged unsubscribes.",
  "Physical business address in email footer (CAN-SPAM compliant)": "A physical mailing address is injected into every email footer — required by the US CAN-SPAM Act for bulk commercial emails.",
  "Hard bounce > auto-mark contact as bounced (SES webhook)": "When AWS SES reports a permanent delivery failure, a webhook triggers and automatically marks that contact as 'bounced' — they won't be emailed again.",
  "Spam complaint > auto-mark contact as unsubscribed (SES webhook)": "When AWS SES reports that a recipient clicked 'Mark as Spam', a webhook automatically marks them as unsubscribed.",
  "Daily send limit enforcement (per-tenant, resets at midnight, 429 on breach)": "Each tenant has a daily email send quota. Attempts to exceed it return a 429 error. The counter resets at midnight UTC.",
  "/unsubscribe as a public route (no sidebar/header)": "The unsubscribe page is fully public and rendered without the app navigation — so recipients who aren't logged in can still unsubscribe.",
  "Unsubscribe page: auto-close tab after 3 seconds + Close Window button": "After a successful unsubscribe, the browser tab automatically closes after 3 seconds, and a 'Close Window' button is shown as a fallback.",
  "Re-subscribe option on unsubscribe page": "After unsubscribing, a button lets the contact change their mind and re-subscribe immediately.",
  "Re-subscribe page: auto-close tab after 3 seconds + Close Window button": "After re-subscribing, the tab auto-closes in 3 seconds with a 'Close Window' fallback button.",
  "Open tracking pixel endpoint (HMAC-signed) via Supabase Edge Function": "A 1×1 transparent pixel image is embedded in every email. When a recipient opens the email, their client loads the pixel, logging the open event. The URL is signed with HMAC to prevent forging.",
  "Click tracking intentionally disabled (cost optimization)": "Click tracking was evaluated but disabled — it requires redirecting every link through the tracking server, adding hosting cost and latency.",
  "SES bounce/complaint webhooks captured natively (bypass Edge Functions)": "AWS SES bounce and complaint notifications are sent directly to the FastAPI backend endpoint — no Supabase Edge Function in the middle, reducing latency.",
  "Stats aggregation (sent, opens, bounces, unsubscribes per campaign)": "For each campaign, the analytics API returns aggregated counts of sent, unique opens, total opens, bounces, and unsubscribes.",
  "Source attribution (gmail_proxy, apple_mpp, outlook, yahoo, scanner, human)": "Open events are classified by their source — Apple Mail Privacy Protection (MPP), Gmail image proxy, Outlook, or a likely human open — to filter out bot/proxy inflated metrics.",
  "Contact activity log (recipient timeline in analytics API)": "An analytics endpoint that returns the full event timeline for a specific contact in a campaign — when the email was sent, opened, if they bounced, etc.",
  "Campaign analytics page (Sent, Opens Unique, Opens Total, Bounces, Unsubscribes)": "The main analytics screen for a campaign — shows all key engagement metrics in stat cards at the top.",
  "Proxy/Scanner breakdown panel (Gmail, Apple MPP, Outlook, Yahoo, Human)": "A panel on the analytics page showing what percentage of opens came from each source type — helps tenants understand how many opens are real vs automated.",
  "Dashboard homepage sender health widget": "A widget on the main dashboard showing the current sender health score (bounce rate %, complaint rate %) and whether the domain is in good standing.",
  "Docker (Dockerfiles for API, worker, client)": "Dockerfile for each service (FastAPI backend, Python workers, Next.js frontend) so the entire stack runs in containers on any machine.",
  "docker-compose.yml": "A single file that defines and starts all services together (API, worker, frontend, RabbitMQ, Redis, Nginx) with one command.",
  "Nginx config": "The Nginx reverse proxy configuration that routes /api requests to the FastAPI backend and all other requests to the Next.js frontend.",
  "Settings landing page (/settings) with navigation cards": "A hub page at /settings with cards linking to each settings sub-section: Profile, Team, Sender Domains, API Keys, Billing.",
  "Profile page (edit name, timezone)": "Allows users to update their personal information, display name, and select their preferred timezone for scheduled campaigns.",
  "Organization page (company name, CAN-SPAM physical address)": "A workspace-level settings page to manage business details required for legal email compliance in footers.",
  "GDPR Right-to-Erase (anonymize contact PII)": "A tool for workspace admins to fulfill GDPR deletion requests by scrubbing PII from contact records while keeping anonymized data for history.",
  "Data Export button (CSV export of all contacts)": "Allows a tenant to download their entire audience database as a CSV for backup or portability.",
  "Compliance checklist page (/settings/compliance)": "A dedicated view that audits the current workspace for legal readiness (Sender ID, Address, Unsub link).",
  "API Keys page (generate, view, revoke — SHA-256 hashed)": "Self-service portal for developers to manage their API access keys securely.",
  "Custom sending domain setup UI (SPF/DKIM/DMARC records)": "The interface that shows tenants which DNS records to add to their domain to enable 'Sent via yourdomain.com'.",
  "Sender Identity OTP Verification (Anti-Spoofing)": "A security flow requiring a one-time code to be verified from an email address before it can be used as a 'From' address.",
  "Initialize `scripts/mcp/` directory": "Create the foundation folder for the Model Context Protocol (MCP) server used by AI coding assistants.",
  "Create `mcp_server.py` with FastMCP foundation": "Bootstrap the primary MCP server script using the FastMCP framework for Python.",
  "Implement shared DB connection utility for MCP": "Set up a robust PostgreSQL connection pool shared between the MCP server and the main platform.",
  "Add `db_inspector` tool (read schema/RLS)": "An MCP tool that allows AI agents to inspect the database schema and security policies in real-time.",
  "Add `audit_viewer` tool (query audit_logs)": "An MCP tool for AI agents to query the system's audit trails to help debug user-reported issues.",
  "Add `worker_monitor` tool (query RabbitMQ/Redis)": "An MCP tool that gives AI insight into background worker status and queue depths.",
  "Create `mcp_config.json` for AI client linking": "Generate the standard configuration file needed to connect tools like Claude Desktop to the ShrFlow MCP server.",
  "Expose `phase_wise_plan.md` as an MCP Resource": "Allows AI assistants to read the current project roadmap directly to stay aligned with your development goals.",
  "Expose `/logs` as a tailing MCP Resource": "Provides a live stream of application logs to the AI for real-time error diagnosis and troubleshooting.",
  "Manual verification: Connect Claude Desktop to ShrFlow MCP and query DB schema": "Final verification step to ensure the local AI agent can actually 'talk' to your database via the new MCP layer."
}

# --- PARSING LOGIC ---
with open(md_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

phases: List[Dict[str, Any]] = []
current_phase: Optional[Dict[str, Any]] = None
current_sub: Optional[str] = None

for line in lines:
    line = line.strip()
    if not line:
        continue
    
    # Check for Phase (e.g. ## Phase 1.9 — ...)
    phase_match = re.search(r'## (PHASE\s+[\d\.]+.*?)$', line, re.IGNORECASE)
    if phase_match:
        title = phase_match.group(1).strip()
        current_phase = {"title": title, "tasks": []}
        phases.append(current_phase)
        current_sub = None
        continue
        
    # Check for Category [BACKEND] etc
    if line.startswith("**[") and line.endswith("]**"):
        current_sub = line.strip("*").strip("[").strip("]")
        continue

    # Check for checklist item (standard markdown - [x] or - [ ])
    task_match = re.search(r'-\s+\[(.)\]\s+(.*)', line)
    # Check for bullet point item (just - Task Name)
    if not task_match:
        task_match = re.search(r'-\s+(.*)', line)
        if task_match:
            is_done = False
            raw_text = task_match.group(1).strip()
        else:
            continue
    else:
        is_done = task_match.group(1).lower() in ['x', '✔']
        raw_text = task_match.group(2).strip()
        
    if current_phase is not None:
        # Prepend category if exists
        display_text = raw_text
        if current_sub:
            display_text = f"<span class='text-xs font-bold text-indigo-400 mr-2 uppercase block sm:inline'>[{current_sub}]</span> {raw_text}"
        
        # Match description from dictionary
        description = DESCRIPTIONS.get(raw_text, "")
        
        current_phase["tasks"].append({
            "text": display_text,
            "done": is_done,
            "desc": description
        })

# --- HTML GENERATION ---
html_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShrFlow - Build Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; background-color: #09090b; color: #fafafa; }
        .glass { background: rgba(24, 24, 27, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(63, 63, 70, 0.4); }
        .task-desc { font-size: 0.75rem; line-height: 1.5; color: #71717a; margin-top: 3px; }
    </style>
</head>
<body class="p-4 sm:p-8 min-h-screen">
    <div class="max-w-4xl mx-auto">
        <div class="mb-10 text-center">
            <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">ShrFlow Launch Tracker</h1>
            <p class="text-zinc-400">Automatic Sync from phase_wise_plan.md</p>
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
        const savedState = JSON.parse(localStorage.getItem('shrflow_phases_tracker') || '{}');
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
                    localStorage.setItem('shrflow_phases_tracker', JSON.stringify(savedState));
                    if(e.target.checked) { completedTasks++; phaseCompleted++; } 
                    else { completedTasks--; phaseCompleted--; }
                    updateMasterStats();
                    document.getElementById(`stat-${pIndex}`).textContent = `${phaseCompleted} / ${phase.tasks.length} DONE`;
                    label.classList.toggle('line-through', e.target.checked);
                    label.classList.toggle('text-zinc-500', e.target.checked);
                    label.classList.toggle('text-zinc-200', !e.target.checked);
                    if (desc) desc.classList.toggle('opacity-40', e.target.checked);
                });
                
                const labelWrap = document.createElement('div');
                labelWrap.className = 'flex-1 min-w-0';
                
                const label = document.createElement('label');
                label.htmlFor = taskId;
                label.className = `text-sm leading-relaxed cursor-pointer select-none block w-full transition-all duration-200 ${isChecked ? 'line-through text-zinc-500' : 'text-zinc-200'}`;
                label.innerHTML = task.text;
                labelWrap.appendChild(label);

                let desc = null;
                if (task.desc) {
                    desc = document.createElement('p');
                    desc.className = `task-desc transition-opacity ${isChecked ? 'opacity-40' : 'opacity-100'}`;
                    desc.textContent = task.desc;
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

html_out = html_template.replace("MAGIC_JSON", json.dumps(phases))
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_out)

print(f"Generated {html_path} successfully from {md_path}!")
