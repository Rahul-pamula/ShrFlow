# ShrFlow System Overview — Strategic Architecture & Phase Roadmap

This document provides a deep-dive architectural analysis of the ShrFlow platform, mapping the strategic phase plan (Phase 0 through Phase 17) to the actual production codebase. It serves as the primary technical reference for engineering onboarding, system audits, and future scaling decisions.

---

## 🔹 Phase 0 — UI/UX Foundation & Design System

### 1. 🧠 What This Phase Is (Conceptual)

Phase 0 is the "atomic" stage of the platform. Before a single API is called or a database table is provisioned, we must define the visual and interaction language of the system. In a complex multi-tenant SaaS, inconsistency is a technical debt that compounds exponentially. Phase 0 establishes the "Design System" as a first-class citizen—treating UI components as reusable, versioned code rather than ad-hoc CSS.

As a senior engineer, I view Phase 0 as the "Contract" between the frontend and the user experience. By standardizing on primitives (Buttons, Inputs, Modals, Tables), we ensure that any new feature built in Phase 10 will feel and behave exactly like the features built in Phase 1.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

In high-stakes SaaS platforms like Stripe or Linear, the UI is part of the security and trust model. If a "Delete Campaign" button looks different on two different pages, the user loses confidence in the system's reliability. 

From a production standpoint, Phase 0 prevents:
*   **CSS Bloat:** Prevents the "copy-paste styling" anti-pattern that leads to massive, unmaintainable stylesheets.
*   **Accessibility Failures:** By baking WCAG 2.1 compliance into the base components, we ensure the entire platform is accessible by default.
*   **Development Latency:** A robust component library allows developers to build complex pages in hours instead of days by simply "assembling" pre-tested primitives.

### 3. 🏗 Backend Architecture

Phase 0's backend is primarily about "Developer Experience" (DX) and infrastructure scaffolding.
*   **APIs:** No functional business APIs yet, but the API gateway (FastAPI) is initialized with health check endpoints.
*   **Database:** Initial schema migrations for core metadata.
*   **Local Stack:** `docker-compose.yml` is introduced, orchestrating MailHog (SMTP testing), Redis (caching), and PostgreSQL.
*   **Seeding:** A robust `seed_dev_data.py` script is created to ensure every developer starts with a representative "tenant" environment.

### 4. 🎨 Frontend Architecture

The frontend uses a modern, high-performance stack:
*   **Framework:** Next.js (App Router) for SSR/ISR and optimized routing.
*   **Styling:** TailwindCSS for utility-first styling, bridged via CSS variables in `globals.css` for dynamic theme swapping.
*   **Component Library:** `shadcn/ui` (Radix UI primitives) customized to the ShrFlow brand.
*   **Theme Management:** `next-themes` for seamless system/dark/light mode transitions.
*   **State Management:** Local component state for UI logic; global state (Zustand/Context) introduced for auth/tenancy in later phases.

### 5. ⚙️ Workers & Background Systems

*   **MailHog:** A critical "mock" worker. It captures all SMTP traffic from the local environment, allowing engineers to verify email rendering without sending actual bits over the internet.
*   **Logging:** Implementation of a standardized logging format across the API and mock workers.

### 6. 🔌 Integrations

*   **PostgreSQL:** The primary source of truth.
*   **Redis:** Initialized for session caching and rate-limiting preparation.
*   **Docker:** Used to containerize the development environment for "it works on my machine" consistency.

### 7. 🔐 Environment Variables (.env)

*   `DATABASE_URL` → Used by SQLAlchemy/asyncpg to connect to the persistent store. Misconfiguration leads to "Connection Refused" and API boot failure.
*   `SUPABASE_URL` & `SUPABASE_ANON_KEY` → Initialized for auth integration.
*   `SMTP_HOST` & `SMTP_PORT` → Pointed to `mailhog` in dev. Misconfiguration causes worker crashes when attempting to "send" emails.
*   `NEXT_PUBLIC_API_URL` → Used by the Next.js client to find the FastAPI gateway.

### 8. ✅ What Is Implemented (From Code)

*   **Fully Functional shadcn UI Integration:** Components like `DataTable.tsx`, `ConfirmModal.tsx`, and `StatCard.tsx` are not just placeholders; they are production-ready.
*   **Dark Mode Support:** Deeply integrated via `globals.css` and `ThemeToggle.tsx`.
*   **Hybrid App Shell:** The persistent sidebar and global header in `layout.tsx` provide a professional SaaS "workspace" feel.
*   **Global index:** `src/components/ui/index.ts` allows for clean, tree-shakeable imports.

### 9. ❌ What Is NOT Implemented

*   **Loading Skeletons:** While planned, some list pages still use generic spinners instead of high-fidelity content skeletons.
*   **Design Tokens Doc:** The internal documentation page for design tokens is currently missing; developers must reference `globals.css` directly.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Layout Complexity:** The plan described "Basic UI components," but the actual implementation includes a complex, nested layout system with `AuthContext` guards already integrated into the foundation. This is a "better" mismatch, providing more robustness than originally planned.

### 11. 🚨 Risks & Improvements

*   **Icon Bloat:** The project uses `lucide-react` extensively. We should monitor the bundle size to ensure we aren't importing the entire library.
*   **CSS Variable Collision:** As we scale, we need a strict naming convention for CSS variables to avoid collisions between core platform styles and user-generated template styles (addressed in Phase 3).

---

## 🔹 Phase 1 — Foundation, Auth, Tenant Identity & Onboarding

### 1. 🧠 What This Phase Is (Conceptual)

Phase 1 is the "Identity" phase. In a multi-tenant system, `tenant_id` is the most important piece of data. Phase 1 ensures that every user belongs to a "Workspace" (Tenant) and that data is strictly siloed. It handles the "Guest to Resident" journey: Signup -> Email Verification -> Workspace Creation -> Role Assignment.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

Without Phase 1, the system is a security liability. 
*   **Data Isolation:** Prevents "Tenant A" from ever seeing "Tenant B's" contacts.
*   **Onboarding Retention:** A complex SaaS needs a smooth onboarding wizard. If a user gets lost during setup, they churn.
*   **Security:** Implements the "Gold Standard" of auth: Bcrypt for hashing, short-lived JWTs for access, and secure HttpOnly cookies for refresh tokens.

### 3. 🏗 Backend Architecture

*   **Auth Routes:** `auth.py` handles `/signup`, `/login`, and `/refresh`.
*   **JWT Claims:** Tokens carry `tenant_id`, `user_id`, and `role`. This allows the API to be "stateless"—it knows who you are and what you can access without a DB lookup on every request.
*   **Tenancy Model:** A many-to-many relationship between `Users` and `Tenants` via `tenant_users`. This allows one user to belong to multiple companies (e.g., an agency managing multiple clients).

### 4. 🎨 Frontend Architecture

*   **AuthContext:** The `AuthContext.tsx` is the brain of the frontend. It manages session state, handles token refreshes, and provides the `user` object to all components.
*   **Onboarding Wizard:** A multi-step flow (`/onboarding/workspace`) that collects company name and use-case data before granting access to the dashboard.
*   **Route Guards:** Higher-Order Components (HOCs) or Middleware that redirect unauthenticated users to `/login`.

### 5. ⚙️ Workers & Background Systems

*   **Centralized Email Worker:** Triggered by `/signup` to send the verification OTP.
*   **Welcome Sequence:** (Planned) Triggers a background job to prepare the workspace (e.g., creating default templates).

### 6. 🔌 Integrations

*   **Supabase Auth:** Used for the underlying user table and identity provider logic.
*   **Gmail SMTP:** Used for system emails (OTPs, Welcome) to ensure high deliverability during the MVP phase.

### 7. 🔐 Environment Variables (.env)

*   `JWT_SECRET_KEY` → Critical for signing tokens. If leaked, anyone can impersonate any user.
*   `SUPABASE_SERVICE_ROLE_KEY` → Used by the backend to perform admin actions.
*   `SYSTEM_SMTP_PASSWORD` → Allows the worker to send OTPs.

### 8. ✅ What Is Implemented (From Code)

*   **Onboarding Escape Guard:** A smart implementation discovered in `AuthContext.tsx` that automatically redirects users trapped in "incomplete" workspaces to the correct onboarding step.
*   **Multi-Workspace Support:** The backend already supports `tenant_users` join logic, and the frontend has a `switchWorkspace` utility.
*   **Complex Route Protection:** Deeply integrated logic for `pending_join`, `onboarding`, and `active` states.

### ❌ What Is NOT Implemented

*   **ReCAPTCHA:** While listed in the plan, the signup form lacks a functional reCAPTCHA integration to prevent bot spam.
*   **Email Verification Requirement:** The system allows login even if `email_verified` is false (though it redirects to the verify page, the API doesn't strictly block all routes yet).

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **JWT Payload:** The plan was for a "Standard JWT," but the actual implementation injects `role` and `tenant_status`, making it much more powerful for client-side routing.
*   **Onboarding Flow:** The code implements a "Waiting Room" (Phase 12 feature) already in the Phase 1 auth flow to handle users who have signed up but haven't been assigned a workspace yet.

### 11. 🚨 Risks & Improvements

*   **Token Expiry:** Access tokens are currently set to 1 hour. For a high-security platform, we should drop this to 15 minutes and rely on the silent refresh mechanism.
*   **Rate Limiting:** The login endpoint lacks IP-based rate limiting, making it vulnerable to brute-force attacks.

---

[CONT...]

---

## 🔹 Phase 1.5 — Auth Hardening & Audit Logging

### 1. 🧠 What This Phase Is (Conceptual)

Phase 1.5 is about "Observability" and "Integrity." Once users can enter the system, we need to know exactly what they are doing. An Audit Log is the "black box flight recorder" of the platform. It doesn't just record that something happened; it records the "Who, What, When, and from Where." This phase also hardens the auth layer against sophisticated attacks like session hijacking and brute force.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

In the enterprise world, audit logs are a non-negotiable requirement for SOC2 and GDPR compliance.
*   **Security Investigations:** If a database is leaked or a campaign is sabotaged, the audit log is the only way to trace the origin.
*   **Internal Accountability:** Prevents "The intern deleted 10,000 contacts" scenarios by providing clear attribution.
*   **System Health:** Monitoring "CRITICAL" log events (like 429 rate limit breaches) provides early warning of system abuse or misconfiguration.

### 3. 🏗 Backend Architecture

*   **Audit Logging Engine:** A dedicated `audit_logs` table using JSONB for metadata storage. This allows the system to store flexible "action-specific" data without constantly altering the schema.
*   **Immutable Design:** The audit log table has no `UPDATE` or `DELETE` permissions for the application user. Only the database superuser can modify it, ensuring the log's integrity.
*   **Session Versioning:** Introduction of `token_version` on the `users` table. Incrementing this version instantly invalidates all existing JWTs for that user, providing a "Global Logout" capability.

### 4. 🎨 Frontend Architecture

*   **Audit Viewer:** A read-only, paginated table in the Settings area. It uses the `DataTable` primitive and provides filters for "Severity" (INFO, WARNING, CRITICAL) and "Action Type."
*   **Security Settings:** A new tab in the User Profile allowing users to see their active sessions and trigger a password reset flow.

### 5. ⚙️ Workers & Background Systems

*   **Alerting Worker:** Monitors the `audit_logs` table. If a "CRITICAL" event (e.g., a user deleting >50% of contacts) is detected, it triggers an immediate email alert to the Workspace Owner via the System Mailer.

### 6. 🔌 Integrations

*   **Centralized System Emailer:** Used to dispatch the security alerts.
*   **Redis:** Used for "Blacklisting" tokens that have been revoked but haven't expired yet.

### 7. 🔐 Environment Variables (.env)

*   `AUDIT_LOG_RETENTION_DAYS` → (Planned) Controls how long logs are kept before archival.
*   `SECURITY_ALERT_THRESHOLD` → Defines the "trigger" for automated security notifications.

### 8. ✅ What Is Implemented (From Code)

*   **Append-Only Audit Logic:** The backend `team.py` and `settings.py` routes already integrate audit logging for member removals and workspace changes.
*   **Severity Levels:** Log entries correctly distinguish between standard operations and high-risk actions.
*   **Token Revocation Foundation:** The `token_version` logic is present in the `User` model, though the frontend "Logout all devices" button is still pending.

### 9. ❌ What Is NOT Implemented

*   **Automated Alerting:** The background worker that scans logs for "CRITICAL" thresholds is currently a manual script rather than a persistent service.
*   **MFA (Multi-Factor Auth):** While listed in the plan, the TOTP/QR-code generation logic is not yet active in the production API.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Audit Granularity:** The code currently logs "Entity ID" and "Action," but lacks the "Old Value vs New Value" diffing originally envisioned. This introduces minor debt for debugging complex configuration changes.

### 11. 🚨 Risks & Improvements

*   **Storage Growth:** Audit logs grow fast. We need a partitioning strategy (see Phase 5.8) before reaching 1 million log entries.
*   **PII in Logs:** Developers must be careful not to log sensitive data (passwords, email content) in the audit JSONB. A pre-commit hook or linter for the audit service is recommended.

---

## 🔹 Phase 1.6 — GDPR & Legal Compliance

### 1. 🧠 What This Phase Is (Conceptual)

Phase 1.6 is the "Legal Shield." It transforms "Delete" into "Anonymize" and "User" into "Data Subject." It ensures that the platform respects the fundamental right to privacy by implementing features like "Right to be Forgotten" and "Data Portability" without breaking the system's analytical history.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

For a SaaS targeting European or Californian customers, GDPR/CCPA compliance is a legal binary: either you have it, or you can't sell. 
*   **Liability Prevention:** Soft-deletes prevent accidental data loss ("I deleted my campaign by mistake!").
*   **Analytics Preservation:** By anonymizing a contact instead of deleting their row, we keep the "Open Rate" metrics accurate without keeping the person's private email.
*   **Customer Trust:** Providing an "Export My Data" button builds immediate trust with privacy-conscious enterprises.

### 3. 🏗 Backend Architecture

*   **Soft Delete Pattern:** Every major table (`contacts`, `campaigns`, `templates`) includes a `deleted_at` timestamp. Global queries are filtered to `WHERE deleted_at IS NULL`.
*   **Anonymization Service:** A function that replaces PII (`name`, `email`, `phone`) with deterministic hashes or placeholders (e.g., `deleted_user_123@shrflow.invalid`).
*   **Async Export Engine:** A worker that aggregates all tenant data into a ZIP file. This is async because generating a 1GB export for a large tenant would time out a standard HTTP request.

### 4. 🎨 Frontend Architecture

*   **Recycle Bin UI:** A view within each section (e.g., "Deleted Contacts") allowing for one-click restoration within 30 days.
*   **GDPR Dashboard:** A new section in Workspace Settings with "Export All Data" and "Permanent Deletion Request" buttons.

### 5. ⚙️ Workers & Background Systems

*   **Cleanup Worker:** Runs nightly to permanently purge records where `deleted_at` is > 30 days old.
*   **Export Worker:** Processes the ZIP generation and uploads the result to a secure, time-limited S3 bucket.

### 6. 🔌 Integrations

*   **AWS S3 / Supabase Storage:** Used to host the temporary data export files.
*   **Amazon SNS:** Used to notify the user when their export is ready for download.

### 7. 🔐 Environment Variables (.env)

*   `GDPR_EXPORT_EXPIRY_HOURS` → How long a download link remains active (e.g., 24h).
*   `SOFT_DELETE_RETENTION_DAYS` → Defaulting to 30.

### 8. ✅ What Is Implemented (From Code)

*   **Soft Delete Infrastructure:** The `deleted_at` column is present on the `Contact` model and respected by the `contacts.py` list routes.
*   **Anonymization Logic:** The `gdpr_erase_contact` endpoint in `settings.py` correctly wipes PII while preserving the database row for foreign key integrity.

### 9. ❌ What Is NOT Implemented

*   **Async Export UI:** The frontend has an "Export" button, but it triggers a synchronous CSV download which fails for lists larger than 50k rows. The full async "Request Export -> Get Email" flow is pending.
*   **Restore Modal:** There is no UI for users to "undelete" a campaign yet; it requires manual DB intervention.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Consent Tracking:** The plan called for `consent_ip` and `consent_timestamp` on every contact. The current schema has the columns, but the import worker doesn't yet populate them with real metadata, defaulting to "Imported via CSV."

### 11. 🚨 Risks & Improvements

*   **Performance:** `WHERE deleted_at IS NULL` can be slow on large tables if not indexed. We must ensure a partial index exists for every soft-delete table.

---

## 🔹 Phase 1.7 — Enterprise Workspace Lifecycle & Data Isolation

### 1. 🧠 What This Phase Is (Conceptual)

Phase 1.7 is "Bulletproofing the Boundary." In a multi-tenant system, a single bug in a `WHERE tenant_id = ...` clause can lead to a catastrophic data leak. Phase 1.7 moves this logic from the "Application Layer" to the "Database Layer" using Row Level Security (RLS). It also formalizes the "Team" concept—inviting colleagues and managing their access.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

This is the phase that makes ShrFlow "Enterprise Ready."
*   **Zero-Trust Data:** RLS ensures that even if a developer forgets to filter by `tenant_id` in Python, the database will refuse to return data that doesn't belong to the current session's tenant.
*   **Team Collaboration:** Enables the "Agency" model where multiple people work on the same campaigns.
*   **Reputation Protection:** Secure invitation tokens prevent unauthorized users from "guessing" their way into a company's private workspace.

### 3. 🏗 Backend Architecture

*   **PostgreSQL RLS:** The system uses `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. Every database session starts with `SET LOCAL app.current_tenant_id = '...'`.
*   **asyncpg Connection Pool:** Replaces standard HTTP clients to allow for transaction-level session variables (critical for RLS).
*   **Invitation System:** A secure, token-based flow. Tokens are SHA-256 hashed and have a strict 7-day TTL.

### 4. 🎨 Frontend Architecture

*   **Team Settings Page:** A dashboard showing active members, pending invites, and role management controls.
*   **Invite Modal:** A clean UI to invite users by email and assign them a role (Owner, Admin, Creator, Viewer).
*   **Public Join Page:** A specialized route (`/team/join?token=...`) that handles the onboarding of newly invited users.

### 5. ⚙️ Workers & Background Systems

*   **Invitation Mailer:** Dispatches the secure join links.
*   **Session Watchdog:** (Planned) Automatically logs out users if they are removed from a workspace.

### 6. 🔌 Integrations

*   **PostgreSQL:** The core of the RLS enforcement.
*   **AWS SES / Gmail:** Dispatches the invitation emails.

### 7. 🔐 Environment Variables (.env)

*   `INVITE_TOKEN_SECRET` → Used to sign the invitation tokens.
*   `FRONTEND_BASE_URL` → Used to construct the clickable join links in emails.

### 8. ✅ What Is Implemented (From Code)

*   **Robust RLS Implementation:** The `db_engine.py` utility correctly handles the `SET LOCAL app.current_tenant_id` logic for all `asyncpg` queries.
*   **Complex Invitation Logic:** The `team.py` routes handle invitation creation, validation, and acceptance with full audit logging.
*   **Role Enforcement:** The `can()` utility on the frontend and `require_permission` on the backend are fully operational for team actions.

### 9. ❌ What Is NOT Implemented

*   **SNS Webhook Verification:** While planned for this phase, the logic to verify AWS SNS signatures for bounce/complaint webhooks is still using a "skip verification" flag in development.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Connection Pool:** The plan suggested using Supabase PostgREST for everything. The implementation correctly deviated to use `asyncpg` directly to support the complex RLS session requirements—a significant architectural win for stability.

### 11. 🚨 Risks & Improvements

*   **RLS Overhead:** RLS adds a small performance penalty to every query. We must monitor query execution plans to ensure the `tenant_id` check is using indexes effectively.

---

## 🔹 Phase 1.8 — Account Layer & Workspace Navigation

### 1. 🧠 What This Phase Is (Conceptual)

Phase 1.8 is the "Portal" phase. It acknowledges that a user is an individual who might have multiple identities (Work, Personal, Side Project). It separates the "User Account" (Global) from the "Workspace" (Specific). This is the "Slack-style" or "GitHub-style" navigation model.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **UX Consistency:** Prevents the "I'm logged into the wrong account" confusion by providing a centralized hub (`/account`).
*   **Agency Scalability:** Essential for agencies that need to toggle between 50 different client workspaces without logging out and back in.
*   **Onboarding Rescue:** Provides a landing zone for users who have signed up but aren't yet part of any active workspace.

### 3. 🏗 Backend Architecture

*   **Account APIs:** New endpoints under `/account` that return the user's entire "Workspace Portfolio."
*   **Preferences Table:** Stores metadata like `last_active_tenant_id` to ensure the user returns to their previous context upon login.
*   **Workspace Switcher Logic:** A secure endpoint (`/account/switch`) that issues a new JWT with the updated `tenant_id` claim.

### 4. 🎨 Frontend Architecture

*   **Account Dashboard:** A clean, high-level view at `/account` showing all joined workspaces and pending invitations.
*   **Global Workspace Switcher:** A dropdown in the header (implemented via `WorkspaceSwitcher.tsx`) allowing instant context switching.
*   **Routing Logic:** The `AuthContext` now intelligently routes users: 1 workspace -> Dashboard; Multiple -> Account Hub.

### 5. ⚙️ Workers & Background Systems

*   **Cleanup Service:** (Planned) Cleans up "Ghost Workspaces" that were initialized but never completed onboarding.

### 6. 🔌 Integrations

*   **Redis:** Stores the "Active Session" mapping to allow for instant workspace switching without a full re-auth.

### 7. 🔐 Environment Variables (.env)

*   `MAX_WORKSPACES_PER_USER` → Limits how many workspaces a single user can create (Free tier vs Paid).

### 8. ✅ What Is Implemented (From Code)

*   **Account Workspace API:** `account.py` correctly fetches and filters the user's workspace list.
*   **Frontend Switcher:** The `WorkspaceSwitcher` component is present and integrated into the main shell.
*   **Smart Routing:** The `finishAuthFlow` logic in `AuthContext.tsx` implements the "Multi-Workspace Hub" logic perfectly.

### 9. ❌ What Is NOT Implemented

*   **Workspace Logo Upload:** While the UI shows a logo placeholder in the switcher, the actual S3 upload and storage logic for workspace branding is pending Phase 16.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Switching Speed:** The plan envisioned a "Full Refresh" on switch. The actual implementation uses a client-side state update and router push, making the experience feel much faster and more "native."

### 11. 🚨 Risks & Improvements

*   **Session Fragmentation:** Switching workspaces frequently can lead to "JWT bloat" if not handled correctly. We should ensure the `switch` endpoint properly invalidates the old token's specific scope.

---

## 🔹 Phase 1.9 — MCP Framework & Developer Intelligence

### 1. 🧠 What This Phase Is (Conceptual)

Phase 1.9 is the "AI-First" foundation. It implements the Model Context Protocol (MCP), a standardized way for AI agents (like Claude or custom internal tools) to safely interact with the ShrFlow codebase, database, and logs. It's about building a system that can "talk" to its developers.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Automated Debugging:** Allows an AI agent to "tail the logs" and "inspect the schema" to find bugs 10x faster than a human.
*   **Documentation Integrity:** Ensures the `phase_wise_plan.md` stays in sync with the code by allowing the AI to "read" the implementation and "report" mismatches.
*   **Future-Proofing:** Prepares the platform for the Phase 10 RAG (Retrieval-Augmented Generation) features by establishing a secure data-access layer for AI models.

### 3. 🏗 Backend Architecture

*   **MCP Server:** A standalone Python service (`scripts/mcp/mcp_server.py`) using the FastMCP SDK.
*   **Tools:** Standardized functions exposed to AI: `db_inspector` (schema read), `audit_viewer` (log tailing), `worker_monitor` (queue depth).
*   **Security:** MCP access is strictly restricted to local standard input/output (stdio) or secure SSE, ensuring the AI can only access the data when specifically invoked by a developer.

### 4. 🎨 Frontend Architecture

*   **None:** This is a developer-only phase. The "UI" is the AI Client (e.g., Claude Desktop or VS Code).

### 5. ⚙️ Workers & Background Systems

*   **The MCP Process:** A lightweight, persistent process that acts as the bridge between the AI model and the FastAPI/Postgres core.

### 6. 🔌 Integrations

*   **Python MCP SDK:** The core framework.
*   **PostgreSQL:** Safely inspected by the MCP tools.

### 7. 🔐 Environment Variables (.env)

*   `MCP_ENABLED` → Boolean flag to toggle the developer interface.

### 8. ✅ What Is Implemented (From Code)

*   **NOT IMPLEMENTED:** While detailed in the strategic plan, the `scripts/mcp/` directory and its associated server logic are currently missing from the repository. This represents a "Critical Gap" for developer productivity.

### 9. ❌ What Is NOT Implemented

*   **The entire MCP server and toolset.**

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Priority Shift:** The team prioritized Phase 8 (Franchise) over Phase 1.9 to meet immediate customer demand, leaving the "Developer Intelligence" layer for a later sprint.

### 11. 🚨 Risks & Improvements

*   **High Risk:** Without Phase 1.9, the "Senior Staff Engineer" (AI Assistant) has limited visibility into the live database state, increasing the risk of "blind" code changes. **Immediate implementation is recommended.**

---

## 🔹 Phase 2 — Contacts Engine

### 1. 🧠 What This Phase Is (Conceptual)

Phase 2 is the "Heart" of the platform. An email engine is only as good as its contact data. This phase implements a high-performance, streaming ingestion pipeline that can handle millions of contacts without crashing the server. It's about moving from "Simple CRUD" to "Big Data Ingestion."

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Reliability:** Most platforms crash when you upload a 100MB CSV. ShrFlow's "S3-First" architecture makes it impossible to time out.
*   **Data Integrity:** Automated MX record checks and disposable email detection prevent "bad data" from entering the system and destroying the tenant's sender reputation.
*   **Operational Intelligence:** Engagement scoring allows tenants to see who their "Super-Fans" are vs. who is "At-Risk" of churning.

### 3. 🏗 Backend Architecture

*   **S3-First Upload:** The UI uploads the file directly to S3. The API never sees the bytes. This is the "Stripe-style" secure file handling pattern.
*   **RabbitMQ Streaming Worker:** The `import_worker.py` pulls the S3 link, opens a byte-stream, and parses the CSV in 500-row chunks. This keeps memory usage constant (OOM-safe).
*   **Upsert Logic:** Uses PostgreSQL `ON CONFLICT (tenant_id, email) DO UPDATE` to merge duplicates intelligently.

### 4. 🎨 Frontend Architecture

*   **Import Wizard:** A complex modal that handles column mapping (e.g., "Full Name" in CSV -> `first_name` and `last_name` in DB).
*   **WebSocket Progress:** Uses Redis Pub/Sub to broadcast real-time upload percentages ("45,000 / 100,000 processed...") to the user's dashboard.
*   **Contacts Grid:** A high-performance table with server-side search, filtering, and bulk actions.

### 5. ⚙️ Workers & Background Systems

*   **Import Worker:** The workhorse of Phase 2. Handles validation, deduplication, and DB insertion.
*   **Suppression Manager:** (Planned) Automatically moves bounced or complained contacts to a "Do Not Contact" list.

### 6. 🔌 Integrations

*   **RabbitMQ:** Orchestrates the ingestion tasks.
*   **Redis:** Handles the real-time progress broadcasting.
*   **AWS S3:** The temporary landing zone for raw data files.

### 7. 🔐 Environment Variables (.env)

*   `RABBITMQ_URL` → Critical for worker communication.
*   `MAX_IMPORT_ROWS` → Safety limit to prevent runaway resource usage.

### 8. ✅ What Is Implemented (From Code)

*   **Streaming CSV Parser:** The `import_worker.py` correctly implements chunked parsing.
*   **Contacts API:** `contacts.py` provides full CRUD with robust tenant isolation.
*   **Status Badging:** The UI correctly renders "Subscribed," "Bounced," and "Unsubscribed" badges.
*   **Search & Filter:** Server-side filtering by name and email is fully functional.

### 9. ❌ What Is NOT Implemented

*   **Contact Scoring:** The Engagement Score logic (e.g., "Engaged", "At-Risk") is defined in the plan but the scoring algorithm is not yet present in the worker logic.
*   **Import Mapping UI:** The frontend currently assumes a fixed CSV header format; the "Visual Mapper" (drag-and-drop columns) is still in the mockup stage.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Worker Decoupling:** The plan had the API handling small imports and the worker handling large ones. The implementation correctly moved *all* imports to the worker for architectural consistency—a much cleaner approach.

### 11. 🚨 Risks & Improvements

*   **DB Lock Contention:** Massive `UPSERT` operations can lock the `contacts` table. We should implement a "Batch Delay" (e.g., 50ms sleep between chunks) to keep the table responsive for other users.

---

## 🔹 Phase 3 — Template Engine

### 1. 🧠 What This Phase Is (Conceptual)

Phase 3 is "The Creative Engine." Email rendering is notoriously difficult—it's essentially like building a website that has to look perfect on a browser from 2005 (Outlook). Phase 3 moves away from "Rich Text Editing" toward a "Structural State" model. We don't save HTML; we save a `DesignJSON` object that describes rows, columns, and blocks. This JSON is then compiled into MJML (Mailjet Markup Language), which generates the complex, nested tables required for universal inbox compatibility.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Rendering Stability:** Using MJML ensures that a template designed by a user will look exactly the same in Gmail on iPhone as it does in Outlook on Windows.
*   **Dynamic Personalization:** The template engine must support `{{merge_tags}}` that don't break the layout. If a user's name is 5 characters or 50, the layout must adapt.
*   **Asset Management:** Large-scale email campaigns require a reliable CDN for images. Phase 3 ensures that images are hosted, optimized, and never deleted if they are currently being used in an active template.

### 3. 🏗 Backend Architecture

*   **DesignJSON Source of Truth:** The database stores the raw editor state in a `design_json` column. This allows the editor to reload exactly where the user left off.
*   **Compilation Service:** `compile_service.py` is the heart of this phase. It recursively traverses the JSON tree and emits MJML tags (`<mj-section>`, `<mj-column>`, `<mj-text>`).
*   **CSS Inlining:** The engine automatically inlines all CSS. Most email clients ignore `<style>` blocks in the `<head>`, so every element must have inline styles for reliability.

### 4. 🎨 Frontend Architecture

*   **Zustand-Driven Editor:** The design studio uses a global Zustand store (`useTemplateStore`) to manage the complex, nested state of the email design. This enables high-performance drag-and-drop without the "lag" of React's standard local state.
*   **Canvas Isolation:** The email preview is rendered inside an `iframe` with a "CSS Reset." This prevents the platform's dark mode styles from leaking into the email's white background.
*   **Atomic Block Registry:** Every element (Button, Image, Text) is a modular "Block" with its own property panel (e.g., Font Size, Padding, Border Radius).

### 5. ⚙️ Workers & Background Systems

*   **Thumbnail Generator:** A Puppeteer-based worker (planned) that takes a "screenshot" of every saved template to provide high-fidelity previews in the Template Library.
*   **Image Optimizer:** (Planned) Automatically resizes and compresses images uploaded by users to prevent "heavy" emails that get clipped by Gmail.

### 6. 🔌 Integrations

*   **MJML API / Library:** The core transformation engine.
*   **S3 / Supabase Storage:** Used for hosting user-uploaded assets.

### 7. 🔐 Environment Variables (.env)

*   `MJML_APP_ID` & `MJML_SECRET` → (If using the external API) or local binary paths.
*   `CDN_URL` → The public-facing URL for email images.

### 8. ✅ What Is Implemented (From Code)

*   **Structural JSON Schema:** The `models/template.py` correctly defines the recursive structure for rows, columns, and blocks.
*   **Server-Side Compilation:** `templates.py` includes a `/compile/preview` endpoint that transforms JSON into HTML on-the-fly.
*   **Reactive Canvas:** The frontend editor successfully renders the JSON state into a visual preview.

### 9. ❌ What Is NOT Implemented

*   **Undo/Redo History:** While planned, the Zustand store doesn't yet implement the snapshotting required for "Ctrl+Z" support.
*   **Image Dependency Tracking:** The system allows deleting an image from the library even if it is currently being used in an active email campaign, which would lead to "Broken Image" icons for recipients.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **MJML Complexity:** The plan underestimated the MJML overhead. The implementation correctly moved the MJML compilation to the backend (`compile_service.py`) to keep the frontend bundle light, which was a smart architectural pivot.

### 11. 🚨 Risks & Improvements

*   **JSON Schema Drift:** As we add new block types, the `DesignJSON` can become fragmented. We need a "Schema Versioning" system to migrate old templates when new properties are added.

---

## 🔹 Phase 3.5 — Pre-Send Validation Gateway

### 1. 🧠 What This Phase Is (Conceptual)

Phase 3.5 is the "Compliance Checkpoint." It is a mandatory security and quality layer that sits between the Editor and the Dispatcher. It scans the email content for "Show-Stoppers": missing unsubscribe links, broken merge tags, spam-trigger words, and overly large file sizes. It's the "Linter" for email marketing.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Legal Protection:** Forgetting an unsubscribe link is a violation of the CAN-SPAM act and can lead to heavy fines and blacklisting.
*   **Reputation Management:** Sending emails with broken tags like `Hello {{first_name}}!` looks unprofessional and triggers spam filters.
*   **Deliverability:** Gmail clips any email larger than 102KB. This gateway warns the user if their email is too "heavy," ensuring the full content reaches the recipient.

### 3. 🏗 Backend Architecture

*   **Validation Registry:** A series of modular check functions (e.g., `check_unsub_link`, `check_merge_tags`, `check_file_size`) that run against the compiled HTML.
*   **Validation Certificate:** (Planned) A cryptographic hash issued by the gateway. The Campaign Engine will refuse to send any email that doesn't have a "Pass" certificate from the validator.

### 4. 🎨 Frontend Architecture

*   **Health Checklist:** A sliding panel in the editor that shows "Red/Yellow/Green" status for various metrics.
*   **Persona Preview:** A dropdown that allows the user to "Preview as John Doe" or "Preview as Jane Smith," injecting real data from the Contacts engine into the template.

### 5. ⚙️ Workers & Background Systems

*   **Spam Scanner:** A background worker (Planned) that runs the email through a "SpamAssassin" or "Mail-Tester" simulation to predict the deliverability score.

### 6. 🔌 Integrations

*   **SpamAssassin / Rspamd:** (Planned) For content linting.

### 7. 🔐 Environment Variables (.env)

*   `MAX_EMAIL_SIZE_KB` → Defaulting to 102 (Gmail's limit).

### 8. ✅ What Is Implemented (From Code)

*   **Pre-flight Check Logic:** `templates.py` includes a `/validate` endpoint that runs the basic `run_preflight_checks` service.
*   **Merge Tag Detection:** The validator successfully identifies un-closed curly braces and invalid tag names.

### 9. ❌ What Is NOT Implemented

*   **Hard-Stop Block:** Currently, the validation is a "Warning" only. Users can still send a campaign even if the validator finds critical errors. The "Blocking Gateway" logic is yet to be enforced in the `CampaignService`.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Validation UI:** The plan called for "Line-Level Errors," but MJML compilation obscures line numbers. The implementation correctly shifted to "Block-Level Errors" by tagging each JSON block with a unique ID.

### 11. 🚨 Risks & Improvements

*   **False Positives:** If the spam scanner is too aggressive, it might frustrate users. We need to provide clear "Why this is a risk" explanations for every warning.

---

## 🔹 Phase 4 — Campaign Orchestration

### 1. 🧠 What This Phase Is (Conceptual)

Phase 4 is the "Dispatcher." It brings together the Audience (Phase 2) and the Content (Phase 3). It handles the complex lifecycle of a campaign: Draft -> Scheduled -> Sending -> Sent -> Paused -> Cancelled. It is responsible for "Snapshotting"—locking the template and audience exactly as they were at the moment of dispatch to ensure historical accuracy.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Concurrency Control:** Prevents "Double-Send" scenarios where two workers pick up the same campaign and send it twice to the same 100,000 people.
*   **Operational Control:** Allows an Admin to "Pause" a campaign mid-flight if a mistake is discovered after the first 5% of emails are sent.
*   **Personalization at Scale:** Handles the "Merge Tag" resolution for every individual recipient, ensuring that 1,000,000 unique emails are generated efficiently.

### 3. 🏗 Backend Architecture

*   **State Machine:** A strict status-transition model in PostgreSQL. A campaign cannot move from `draft` to `sent` without passing through `scheduled`.
*   **Optimistic Locking:** Uses a `version` column and `FOR UPDATE SKIP LOCKED` in the database to ensure that only one scheduler/worker can "claim" a campaign task.
*   **Dispatch Intents:** Instead of one massive job, the system creates "Dispatch Intents" (rows in a join table) for each recipient, allowing for granular tracking and retry logic.

### 4. 🎨 Frontend Architecture

*   **Campaign Wizard:** A 4-step workflow (Details -> Audience -> Content -> Review) that guides the user through the complex setup.
*   **Live Progress Bar:** An animated UI component (using WebSockets) that shows the real-time throughput of an active campaign.
*   **Timezone-Aware Scheduler:** A calendar picker that correctly translates the user's local time to UTC for the backend engine.

### 5. ⚙️ Workers & Background Systems

*   **The Scheduler:** A standalone process (`scheduler.py`) that polls for `status='scheduled'` campaigns every 60 seconds.
*   **The Dispatcher:** A high-speed worker that pulls contacts, resolves merge tags, and pushes messages into the RabbitMQ `bulk_email_queue`.

### 6. 🔌 Integrations

*   **RabbitMQ:** The primary "Pipe" for campaign data.
*   **Redis:** Used for distributed locks to prevent double-scheduling in a multi-replica environment.

### 7. 🔐 Environment Variables (.env)

*   `SCHEDULER_POLL_INTERVAL` → Defaults to 60.
*   `ENABLE_EMBEDDED_CAMPAIGN_SCHEDULER` → Critical toggle to disable the unsafe "API-Thread" scheduler in production.

### 8. ✅ What Is Implemented (From Code)

*   **Distributed Scheduler:** The `scheduler.py` is highly advanced, using Redis locks and "Zombie Recovery" logic to handle worker crashes.
*   **Campaign Versioning:** The API correctly implements optimistic locking to prevent race conditions during the approval flow.
*   **Wizard Shell:** The frontend `campaigns/create` flow is fully wired to the backend API.

### 9. ❌ What Is NOT Implemented

*   **Resend to Unopened:** The planned feature to "Resend with a different subject to people who didn't open the first one" is missing, as it depends on Phase 6 metrics.
*   **Multi-Variant A/B Testing:** The plan mentions A/B testing, but the current schema only supports a single `template_id` per campaign.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Batching Strategy:** The plan suggested batching all 100k emails into one RabbitMQ message. The implementation correctly moved to "One Message Per Recipient," which is slightly more overhead but much more reliable for retries.

### 11. 🚨 Risks & Improvements

*   **Database Bloat:** Every campaign creates thousands of "Dispatch Intent" rows. We need a strategy to archive these rows into a "History" table once a campaign is marked `sent`.

---

## 🔹 Phase 5 — Delivery Engine

### 1. 🧠 What This Phase Is (Conceptual)

Phase 5 is the "Actual Sender." It is the system that physically talks to SMTP servers (SES, Gmail, Mailtrap). It handles the "Last Mile" of delivery, including TLS handshakes, SMTP authentication, and error handling. It also listens for "Feedback" from the internet—bounces, complaints, and unsubscriptions.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Deliverability:** If the Delivery Engine is misconfigured, 100% of your emails will land in Spam. 
*   **Reputation Safety:** The engine MUST stop sending to an email address the moment it receives a "Hard Bounce." Repeatedly sending to dead addresses is the #1 way to get your IP blacklisted by Gmail.
*   **Legal Compliance:** Injects the mandatory "One-Click Unsubscribe" headers (RFC 2369) which are now required by Gmail and Yahoo for bulk senders.

### 3. 🏗 Backend Architecture

*   **RabbitMQ Consumer:** A dedicated `email_sender.py` that maintains a pool of SMTP connections. It uses `aio-pika` for high-concurrency async processing.
*   **Feedback Router:** An API endpoint (`webhooks.py`) that listens for AWS SNS notifications. It parses the `bounceType` and `bounceSubType` to categorize errors.
*   **HMAC Unsubscribe:** Generates a cryptographically signed link for every recipient. This ensures that users can unsubscribe without logging in, but malicious actors can't "guess" a user's unsubscribe link.

### 4. 🎨 Frontend Architecture

*   **Unsubscribe Landing Page:** A public, no-auth route at `/unsubscribe` that provides a clear confirmation and an optional "Re-subscribe" button.
*   **Delivery Settings:** Admin UI for configuring SMTP credentials and verifying sender identities.

### 5. ⚙️ Workers & Background Systems

*   **Email Sender Worker:** The core process. It pulls messages from RabbitMQ and executes the SMTP commands.
*   **Reputation Worker:** (Planned) A background job that calculates a rolling "Sender Score" for each tenant based on their bounce rate.

### 6. 🔌 Integrations

*   **AWS SES:** The primary production delivery provider.
*   **MailHog / Mailtrap:** Used for testing and staging.

### 7. 🔐 Environment Variables (.env)
*   `SYSTEM_SMTP_HOST` → The outgoing server address.
*   `UNSUBSCRIBE_SECRET` → The key used to sign the HMAC tokens.

### 8. ✅ What Is Implemented (From Code)
*   **Robust Worker Loop:** The `email_sender.py` implements exponential backoff and Dead Letter Queues (DLQ) for failed dispatches.
*   **Webhook Processor:** `webhooks.py` correctly identifies "Complaint" vs "Bounce" events and updates the contact status in real-time.
*   **Unsubscribe Logic:** The HMAC signing and verification logic is fully functional in `unsubscribe.py`.

### 9. ❌ What Is NOT Implemented
*   **Domain Warmup Automation:** The plan to "Gradually increase daily limits over 30 days" is currently a manual policy rather than an automated feature.
*   **Advanced Bounce Matrix:** The current logic treats all "Bounces" as equal. It needs to distinguish "Mailbox Full" (Temporary) from "User Not Found" (Permanent).

### 10. ⚠️ Mismatches (Plan vs Reality)
*   **TLS Support:** The implementation added a "TLS Handshake" detector that supports both Port 587 (STARTTLS) and Port 465 (Implicit TLS), which is more robust than the single-port plan.

### 11. 🚨 Risks & Improvements
*   **SMTP Throttling:** If AWS SES returns a `421 Too Many Connections` error, the worker might crash if it doesn't have a circuit breaker. We should implement a "Backpressure" pause (see Phase 5.7).

---

## 🔹 Phase 5.7 — Backpressure & Queue Protection

### 1. 🧠 What This Phase Is (Conceptual)

Phase 5.7 is the "Safety Valve." In a high-volume system, the workers can easily overwhelm the database or the SMTP provider. Phase 5.7 implements "Backpressure"—allowing the system to "push back" on the work when it gets too heavy. It also includes the "Kill Switch" to stop a runaway campaign in milliseconds.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)
*   **Infrastructure Survival:** Prevents RabbitMQ from running out of memory if 1,000,000 messages are pushed into the queue at once.
*   **Cost Control:** If a bug in a template starts sending infinite emails, the Kill Switch prevents a $10,000 AWS SES bill.
*   **Fairness:** Prefetch limits ensure that a massive 1M-recipient campaign doesn't "starve" a small 100-recipient OTP email from getting through.

### 3. 🏗 Backend Architecture
*   **RabbitMQ Prefetch (QoS):** Every worker is configured with `prefetch_count=10`. This means it only takes 10 messages from the queue at a time, leaving the rest for other workers.
*   **Redis Kill-Switch:** Before sending every single email, the worker checks a Redis key: `tenant:{id}:campaign:{cid}:stop`. If it exists, the worker drops the message and stops.
*   **Worker Heartbeats:** Every worker writes its status to Redis every 30 seconds, allowing the Admin dashboard to show "Total Active Workers."

### 8. ✅ What Is Implemented (From Code)
*   **Prefetch Enforcement:** `email_sender.py` correctly sets `prefetch_count` on the channel.
*   **Kill-Switch Integration:** The `EmailHandler` correctly checks the Redis status key before each dispatch.
*   **Distributed Scheduler Lock:** The `scheduler.py` uses Redis `SET NX` to ensure that even with multiple replicas, only one "Safety Valve" is active.

### 11. 🚨 Risks & Improvements
*   **Redis Dependency:** If Redis goes down, the Kill Switch fails open (it keeps sending). We should implement a secondary "Safe Fail" that pauses the worker if it can't reach Redis.

---

## 🔹 Phase 6 — Analytics & Engagement Intelligence

### 1. 🧠 What This Phase Is (Conceptual)

Phase 6 is the "Mirror." It shows the tenant the results of their labor. However, in the modern privacy-first era, analytics are deceptive. Phase 6 implements "Intelligent Tracking"—distinguishing between a human opening an email and a security bot (like Gmail Proxy or Apple Mail Privacy Protection) "scanning" the email for viruses. It's about providing "Truthful Analytics," not just "Big Numbers."

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Marketing ROI:** If a campaign shows 50% opens but only 1% clicks, the user needs to know if that 50% is real or just bot traffic.
*   **A/B Insights:** Analytics allow users to see which subject lines resonate with their audience.
*   **Infrastructure Health:** Monitoring "Spam Complaints" in real-time allows the system to pause a campaign automatically before the tenant's AWS SES reputation is destroyed.

### 3. 🏗 Backend Architecture

*   **Tracking Pixel Engine:** A high-speed, signed pixel (`/tracking/open/{payload}`) that returns a 1x1 transparent GIF. The payload is HMAC-signed to prevent "Tracking Injection" attacks.
*   **Bot Detection Logic:** The engine inspects the `User-Agent` and IP address. It identifies "MPP" (Mail Privacy Protection) signatures and marks them as `is_bot=true` in the database.
*   **Click Redirector:** A signed wrapper for all links (`/tracking/click/{payload}`). It logs the click and then 301-redirects the user to the final destination.

### 4. 🎨 Frontend Architecture

*   **Analytics Dashboard:** A rich, chart-heavy view (using `recharts`) showing the "Funnel" of a campaign: Sent -> Delivered -> Opened -> Clicked.
*   **Source Breakdown:** A specialized pie chart showing where the opens came from (e.g., 40% Gmail, 20% Outlook, 10% Apple MPP).
*   **Recipient Activity Feed:** A real-time log of who is interacting with the email "Right Now."

### 5. ⚙️ Workers & Background Systems

*   **Aggregation Worker:** (Planned) Instead of calculating stats on-the-fly (which is slow for 1M rows), this worker pre-calculates the stats every 5 minutes and saves them to a `campaign_stats_cache` table.

### 6. 🔌 Integrations

*   **AWS SES / SNS:** Provides the raw "Delivered" and "Bounced" signals.
*   **IP Intelligence APIs:** (Planned) Used to identify the geographic location of the opens.

### 7. 🔐 Environment Variables (.env)

*   `TRACKING_SECRET` → Critical for signing the pixel and click URLs.

### 8. ✅ What Is Implemented (From Code)

*   **Advanced Deduplication:** `analytics.py` includes logic to filter out duplicate fires of the same tracking pixel, ensuring accurate "Unique Open" counts.
*   **Bot Signatures:** The code correctly identifies `gmail_proxy` and `apple_mpp` sources.
*   **Reputation Rating:** The `_health_response` utility provides a "Red/Yellow/Green" health status based on industry-standard bounce/spam thresholds.

### 9. ❌ What Is NOT Implemented

*   **Heatmap Overlay:** The plan to "Overlay click density on the template preview" is missing; it requires complex coordinate tracking in the `DesignJSON`.
*   **Real-time WebSocket Push:** Currently, the analytics dashboard requires a manual refresh to see the latest numbers.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Data Isolation:** The plan suggested fetching all events and filtering in Python. The implementation correctly moved the `tenant_id` check into the SQL query level (via RLS), providing better security.

### 11. 🚨 Risks & Improvements

*   **Event Table Scale:** The `email_events` table will eventually grow to hundreds of millions of rows. We MUST move this to a columnar store like **ClickHouse** or implement PostgreSQL Table Partitioning by `created_at` (addressed in Phase 13).

---

## 🔹 Phase 7 — Billing, Quota & Monetization

### 1. 🧠 What This Phase Is (Conceptual)

Phase 7 is the "Business Engine." It transforms the platform from a "Project" into a "SaaS." It implements "Quota-Based Architecture"—enforcing limits on how many emails a tenant can send based on their subscription plan. It's about ensuring the platform is financially sustainable.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Revenue Generation:** Enables "Pro" and "Enterprise" tiers with higher limits and advanced features.
*   **Abuse Prevention:** A "Free" tier that can send 1,000,000 emails is a magnet for spammers. Phase 7 limits them to 1,000, protecting the system's IP reputation.
*   **Automated Billing:** Reduces operational overhead by allowing users to manage their own credit cards and invoices.

### 3. 🏗 Backend Architecture

*   **Plan Metadata Service:** A centralized registry of plans (e.g., `free`, `pro`, `enterprise`) and their associated limits.
*   **Quota Gating Middleware:** A pre-dispatch check that asks: `current_usage + campaign_size <= monthly_limit`.
*   **Stripe Webhook Handler:** Listens for `checkout.session.completed` and `invoice.paid` to automatically upgrade/downgrade tenant accounts.

### 4. 🎨 Frontend Architecture

*   **Billing Portal:** A clean UI (integrated with Stripe Customer Portal) for managing subscriptions.
*   **Usage Meter:** A visual progress bar in the dashboard showing "Emails Sent This Month: 450 / 1,000."
*   **Paywall Modals:** Beautiful, non-intrusive alerts that trigger when a user tries to access a "Pro" feature (like A/B testing).

### 5. ⚙️ Workers & Background Systems

*   **Usage Reset Worker:** Runs on the 1st of every month to reset the `emails_sent_this_cycle` count for all tenants.
*   **Delinquency Watchdog:** (Planned) Automatically pauses active campaigns if a tenant's subscription payment fails.

### 6. 🔌 Integrations

*   **Stripe:** The primary payment and subscription gateway.
*   **TaxJar:** (Planned) For automatic sales tax calculation.

### 7. 🔐 Environment Variables (.env)

*   `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET` → Required for secure payment processing.
*   `DEFAULT_MONTHLY_QUOTA` → The "Free Tier" limit.

### 8. ✅ What Is Implemented (From Code)

*   **Usage Tracking Schema:** The `tenants` table correctly includes `emails_sent_this_cycle` and `last_reset_at`.
*   **Billing API Shell:** `billing.py` provides the basic CRUD for subscription status.
*   **Quota Gating Foundation:** The `CampaignService` includes a `check_quota` helper, though it is currently "Warning Only" in the dev environment.

### 9. ❌ What Is NOT Implemented

*   **Overage Billing:** The system currently blocks sending if the limit is reached. It lacks the "Pay-as-you-go" logic for charging per 1,000 emails after the limit is exceeded.
*   **Credit Management:** The "One-time Credit" purchase system (for Pay-As-You-Go users) is still in the design phase.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Cycle Logic:** The plan suggested "Rolling 30 Days," but the implementation uses "Calendar Month" for simplicity in reporting—a common SaaS trade-off.

### 11. 🚨 Risks & Improvements

*   **Race Conditions:** If a user starts two 1,000-recipient campaigns simultaneously on a 1,500-limit plan, both might pass the quota check. We need an atomic "Reservation" system in Redis to block the excess.

---

## 🔹 Phase 8 — Franchise & Multi-Entity Management

### 1. 🧠 What This Phase Is (Conceptual)

Phase 8 is the "Architectural Leap." It introduces the "Franchise" model—allowing one "Main" workspace to manage and view the analytics of multiple "Child" (Franchise) workspaces. It's the "Parent-Child" hierarchy required for large brands (e.g., a headquarters managing 500 local store accounts).

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Brand Consistency:** HQ can create "Master Templates" and push them to all 500 stores, ensuring everyone stays "On-Brand."
*   **Executive Visibility:** Corporate managers can see an aggregated report of how all franchises are performing without logging into 500 separate accounts.
*   **Isolated Operations:** Each store has its own contacts and local sender identity, preventing data contamination between locations.

### 3. 🏗 Backend Architecture

*   **Hierarchical Tenancy:** The `tenants` table now includes a `parent_id` column.
*   **Cross-Tenant Permissions:** Introduction of the `FRANCHISE_ADMIN` role. This role belongs to the "Main" workspace but has implicit read/write access to "Child" workspaces.
*   **Data Aggregation Engine:** New API endpoints that query with `WHERE tenant_id IN (sub_franchise_ids)` to provide roll-up analytics.

### 4. 🎨 Frontend Architecture

*   **Franchise Directory:** A searchable list of all sub-accounts with "Quick Stats" (Active contacts, monthly volume).
*   **Impersonation Logic:** Allows an HQ user to "Switch Into" a franchise account with one click to help with troubleshooting.
*   **Global Brand Library:** A shared asset folder accessible by all child workspaces.

### 5. ⚙️ Workers & Background Systems

*   **Template Sync Worker:** (Planned) Automatically updates franchise templates when the "Master" version is modified at HQ.

### 6. 🔌 Integrations

*   **Supabase RLS:** Re-configured to allow "Parent" sessions to view "Child" rows.

### 8. ✅ What Is Implemented (From Code)

*   **Franchise Hierarchy Schema:** The `tenant_type` and `parent_id` columns are live in the database.
*   **Franchise Management UI:** The `/settings/franchises` page is fully functional, allowing for franchise creation and member mapping.
*   **Safe Impersonation:** The `switchWorkspace` utility in `AuthContext.tsx` handles the transition between parent and child contexts securely.

### 9. ❌ What Is NOT Implemented

*   **Master Campaign Push:** The ability for HQ to "Send on behalf of" all franchises at once is not yet implemented. Currently, campaigns must be created individually in each franchise.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Role Mapping:** The plan called for a complex "Inheritance" system. The implementation uses a simpler "Explicit Mapping" approach, which is much easier to audit and debug.

### 11. 🚨 Risks & Improvements

*   **Privacy Leaks:** HQ must not be able to see "Private" contact data if a franchise is an independent entity. We need a "Data Privacy Toggle" at the franchise level to restrict HQ's visibility.

---

## 🔹 Phase 9 — Custom Domains & Sender Verification

### 1. 🧠 What This Phase Is (Conceptual)

Phase 9 is the "Identity Infrastructure." In the world of bulk email, "Who You Are" is determined by your DNS records. Phase 9 allows tenants to connect their own domains (e.g., `mail.brand.com`) to the platform. It automates the generation of complex DKIM (DomainKeys Identified Mail), SPF (Sender Policy Framework), and DMARC records, transforming a "Guest Sender" into an "Authorized Authority."

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Trust & Deliverability:** Emails sent from a custom domain are much more likely to land in the inbox than those sent from a generic shared domain.
*   **Brand Protection:** Prevents "Spoofing" by ensuring that only ShrFlow's servers are authorized to send email on behalf of the tenant's brand.
*   **Whitelabel Experience:** To the recipient, the email appears to come entirely from the brand, with no "via shrflow.app" footprints in the headers.

### 3. 🏗 Backend Architecture

*   **AWS SES Integration:** The `domains.py` service interfaces directly with the AWS SDK (`boto3`). It requests DKIM tokens and sets the `MailFromDomain` (e.g., `bounces.brand.com`).
*   **Verification Poller:** A background task (or manual trigger) that queries the global DNS to verify that the tenant has correctly added the CNAME/TXT records to their domain provider (GoDaddy, Cloudflare, etc.).
*   **Infrastructure Sharding:** (Planned) Allows the system to distribute different tenants across different AWS SES regions or accounts to prevent a "Bad Apple" from affecting everyone.

### 4. 🎨 Frontend Architecture

*   **Domain Setup Wizard:** A technical UI that provides the exact "Host" and "Value" strings the user needs to copy-paste into their DNS settings.
*   **Health Status Grid:** A dashboard showing the verification status of DKIM, SPF, and DMARC with clear "Instructions for Fix" if verification fails.
*   **Sender Profiles:** UI for creating specific sender identities (e.g., "Marketing <news@brand.com>" vs "Support <help@brand.com>") linked to a verified domain.

### 5. ⚙️ Workers & Background Systems

*   **DNS Watchdog:** (Planned) Periodically re-verifies domains. If a tenant accidentally deletes their DNS records, the watchdog pauses their campaigns and alerts them.

### 6. 🔌 Integrations

*   **AWS SES Identity Service:** The core verification provider.
*   **Cloudflare API:** (Planned) For one-click DNS setup.

### 7. 🔐 Environment Variables (.env)

*   `AWS_REGION` → Where the SES identities are stored.
*   `DNS_TTL` → The expected propagation time.

### 8. ✅ What Is Implemented (From Code)

*   **SES Token Generation:** `domains.py` correctly requests and stores DKIM tokens from AWS.
*   **Custom MAIL FROM:** The system successfully configures the `bounces.domain.com` identity, which is critical for "DMARC Alignment."
*   **Mock Verification:** For local development, the API includes a "Mock Mode" that generates fake tokens, allowing developers to test the UI without an AWS account.

### 9. ❌ What Is NOT Implemented

*   **DMARC Monitoring:** While the plan mentions DMARC, the system doesn't currently provide DMARC report parsing or monitoring.
*   **BIMI Support:** The "Brand Indicators for Message Identification" (showing the company logo in the inbox) is missing.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Verification Strategy:** The plan called for a persistent background poller. The implementation uses a "Manual Refresh" button to save on AWS API costs—a pragmatic choice for the current scale.

### 11. 🚨 Risks & Improvements

*   **DNS Propagation Latency:** Users often get frustrated when DNS takes 24 hours to update. We need to provide a "Status: Propagating" indicator with a clear timestamp of the last check.

---

## 🔹 Phase 10 — AI Personalization & RAG

### 1. 🧠 What This Phase Is (Conceptual)

Phase 10 is the "Intelligence Layer." It moves beyond simple `{{first_name}}` tags into "Generative Personalization." It uses Large Language Models (LLMs) and Retrieval-Augmented Generation (RAG) to write unique sentences for every recipient based on their past behavior, company news, or LinkedIn profile data.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Hyper-Engagement:** An email that references a specific recent achievement of the recipient has a 5x higher reply rate than a generic template.
*   **Content Generation:** Helps users overcome "Writer's Block" by generating high-converting subject lines and body copy based on their goals.
*   **Dynamic Adaptation:** The AI can "tone-match" the recipient—writing more formally to a CEO and more casually to a developer.

### 3. 🏗 Backend Architecture

*   **Vector Database:** (Planned) Uses **pgvector** to store "Knowledge Context" for each tenant (e.g., their product brochures, case studies, and brand voice guidelines).
*   **Inference Gateway:** A service that batches AI generation requests to OpenAI or Anthropic.
*   **Context Injector:** Before the Dispatcher sends an email, it sends the "Prompt" + "Recipient Data" to the LLM to generate the personalized block.

### 4. 🎨 Frontend Architecture

*   **AI Writing Assistant:** An "Autofill" or "Refine" button inside the template editor.
*   **Context Uploader:** A UI for tenants to "Train" the AI by uploading PDFs or linking to their website.
*   **AI Preview:** A side-by-side view showing the "Base Template" vs "AI-Personalized Version" for 5 sample contacts.

### 5. ⚙️ Workers & Background Systems

*   **Generation Worker:** A dedicated queue for AI tasks. Since LLMs are slow (3-5 seconds per email), this cannot happen in the main dispatch loop; it must happen in a "Pre-Processing" stage.

### 6. 🔌 Integrations

*   **OpenAI / Anthropic:** The LLM providers.
*   **LangChain / LlamaIndex:** For managing the RAG pipelines.

### 7. 🔐 Environment Variables (.env)

*   `OPENAI_API_KEY` → Required for the inference.
*   `VECTOR_DB_URL` → For context retrieval.

### 8. ✅ What Is Implemented (From Code)

*   **NOT IMPLEMENTED:** This phase is currently a "Strategic Gap." No AI or Vector logic is present in the current repository.

### 9. ❌ What Is NOT Implemented

*   **The entire AI generation and RAG pipeline.**

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Infrastructure Readiness:** The plan assumed RAG would be ready by Phase 10. However, the current "Modular Monolith" architecture needs to be upgraded to handle the high latency of LLM calls before this phase can go live.

### 11. 🚨 Risks & Improvements

*   **AI Hallucinations:** AI might generate offensive or incorrect content. We MUST implement an "AI Safety Filter" and allow users to "Review all AI content" before sending.

---

## 🔹 Phase 11 — Domain Warmup & Limit Escalation

### 1. 🧠 What This Phase Is (Conceptual)

Phase 11 is the "Trust-Building Phase." You cannot send 1,000,000 emails from a brand-new domain on day one—Gmail will block you immediately. Phase 11 implements an automated "Warmup Scheduler" that gradually increases the daily sending volume over 30-60 days to build a positive reputation with inbox providers.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Domain Longevity:** Prevents a new domain from being "Burned" (permanently blacklisted) due to aggressive early sending.
*   **In-Inbox Delivery:** Slow, consistent volume tells Gmail that you are a legitimate human sender, not a spam bot.
*   **Customer Education:** Prevents users from making the "Newbie Mistake" of blasting their entire list on their first day.

### 3. 🏗 Backend Architecture

*   **Warmup Governor:** A logic layer in the `CampaignService` that enforces a "Daily Ceiling" for new domains (e.g., Day 1: 50 emails, Day 2: 100 emails, etc.).
*   **Spillover Logic:** If a user schedules 10,000 emails but their warmup limit is 500, the system "spills" the remaining 9,500 into the next 19 days automatically.

### 4. 🎨 Frontend Architecture

*   **Warmup Progress Tracker:** A visual timeline showing the domain's current "Heat" and the projected date for full-volume sending.
*   **"Safe Send" Indicator:** A UI element that warns the user if their current campaign size exceeds the domain's safety limit.

### 5. ⚙️ Workers & Background Systems

*   **The Governor Worker:** Monitors daily counts and "Unblocks" the next batch of emails at midnight UTC.

### 8. ✅ What Is Implemented (From Code)

*   **Quota Tracking:** The basic infrastructure for tracking daily volume exists in the `tenants` table.
*   **Manual Governor:** The system enforces plan-based limits, which acts as a "Static Warmup" (e.g., you can't send more than your plan allows).

### 9. ❌ What Is NOT Implemented

*   **Automated Escalation:** There is no logic to "Auto-Increase" the limit daily. Currently, limits are fixed to the subscription plan.
*   **Recipient Interaction Bot:** (Planned) A "Seed List" of 1,000 internal emails that automatically "Open" and "Click" emails to boost the domain's reputation—this is missing.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Enforcement Level:** The plan called for "Domain-Level Warmup." The implementation currently uses "Tenant-Level Quotas," which is a safer but less granular approach.

### 11. 🚨 Risks & Improvements
*   **High Complexity:** Warmup logic is fragile. If the system "Escalates" during a period of high bounces, it will accelerate the domain's demise. We need "Reputation-Aware Warmup" that pauses escalation if the bounce rate exceeds 1%.

---

## 🔹 Phase 12 — High-Performance Infrastructure & Resiliency

### 1. 🧠 What This Phase Is (Conceptual)

Phase 12 is the "Hardening Phase." It's about moving from a "Development App" to a "Production Fortress." It implements the protective layers required to survive a viral traffic spike or a DDoS attack. This includes Nginx reverse-proxies, rate-limiting at the edge, and the "Waiting Room" for handling extreme surges in login activity.

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **System Stability:** Prevents the database from being "Hugged to Death" by 10,000 simultaneous users.
*   **Security:** Hides the application servers behind a proxy, making it harder for attackers to find and exploit vulnerabilities.
*   **User Experience:** Even when the system is under heavy load, the "Waiting Room" provides a graceful experience instead of a "504 Gateway Timeout" error.

### 3. 🏗 Backend Architecture

*   **Nginx Reverse Proxy:** Acts as the entry point for all traffic. It handles SSL termination and Gzip compression.
*   **Edge Rate Limiting:** Nginx is configured to allow only 10 requests per second per IP for the `/auth` routes, preventing brute-force attacks.
*   **Health Check Poller:** A dedicated service that monitors the health of all worker nodes and automatically removes them from the pool if they stop responding.

### 4. 🎨 Frontend Architecture

*   **The Waiting Room:** A high-performance, lightweight page (`/waiting-room`) that users are redirected to if the platform is at capacity. It uses a simple WebSocket to "Listen" for a spot to open up.
*   **Status Page Integration:** (Planned) A public page at `status.shrflow.app` showing the real-time uptime of the API, Workers, and Database.

### 5. ⚙️ Workers & Background Systems

*   **Sentinel Worker:** (Planned) A Redis-based monitor that tracks system-wide latency. If the "Average Response Time" exceeds 500ms, it automatically triggers the "Waiting Room" redirect for new sessions.

### 8. ✅ What Is Implemented (From Code)

*   **Waiting Room UI:** The `app/waiting-room/page.tsx` is fully implemented and styled, ready to be triggered by the `AuthContext`.
*   **Proxy-Aware Auth:** The `AuthContext` correctly handles `X-Forwarded-For` headers to ensure IP-based security logic works behind a reverse proxy.

### 9. ❌ What Is NOT Implemented

*   **Automated Load Balancing:** Currently, the system runs on a single node. The logic to auto-scale worker containers based on RabbitMQ queue depth is still in the "DevOps Roadmap."
*   **Nginx Config Auto-Gen:** The Nginx configuration is manual; it is not yet integrated into the CI/CD pipeline.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Resiliency Trigger:** The plan called for a complex "CPU-Based" trigger for the waiting room. The implementation correctly moved to a "Queue-Depth" trigger, which is a much better indicator of system saturation for an email platform.

---

## 🔹 Phase 13 — Scale-Out Strategy & Microservice Decomposition

### 1. 🧠 What This Phase Is (Conceptual)

Phase 13 is the "Big Bang." It is the moment the "Modular Monolith" is broken apart into independent, specialized microservices. This allows the team to scale the "Sender Worker" to 100 nodes while keeping the "API" on 2 nodes. It's about "Resource Optimization."

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Cost Efficiency:** Don't pay for 100 high-memory API servers when you only need 100 low-memory worker servers.
*   **Fault Isolation:** If the "Analytics Worker" crashes, it shouldn't stop the "Email Sender" from delivering emails.
*   **Deployment Velocity:** Different teams can work on and deploy the "Billing Service" and "Template Service" independently.

### 3. 🏗 Backend Architecture

*   **Service Decomposition:** The `platform/` directory is split into `services/auth`, `services/sender`, `services/analytics`, etc.
*   **ClickHouse Migration:** (Planned) Moves the massive `email_events` table from PostgreSQL to ClickHouse, a columnar database designed for trillions of rows and millisecond query times.
*   **gRPC Communication:** (Planned) Replaces internal HTTP calls between services with gRPC for lower latency and better type safety.

### 5. ⚙️ Workers & Background Systems

*   **Specialized Workers:** The monolithic `email_sender.py` is split into:
    *   `sender-high-priority` (OTPs, Password Resets)
    *   `sender-bulk` (Campaigns)
    *   `event-processor` (Webhooks)
    *   `reputation-worker` (Stats)

### 8. ✅ What Is Implemented (From Code)

*   **Worker Decoupling:** The repository already shows a clear split between `api/`, `worker/`, and `services/`, making the final microservice split much easier.
*   **Shared Utils:** The `utils/` directory is structured as a library that can be imported by all future microservices.

### 9. ❌ What Is NOT Implemented

*   **Service Discovery:** Currently, all services are hard-coded to find each other via environment variables. We need a system like **Consul** or **Kubernetes DNS** for a true microservice architecture.

### 10. ⚠️ Mismatches (Plan vs Reality)

*   **Timing:** The plan placed ClickHouse in Phase 13. Given the current event volume, the implementation should move this to Phase 6 (GAP identified earlier).

---

## 🔹 Phase 14-16 — Partner API, Agency & Branding

### 1. 🧠 What These Phases Are (Conceptual)

These phases represent the "Ecosystem Expansion." 
*   **Phase 14 (Partner API):** Allows third-party developers to build apps on top of ShrFlow.
*   **Phase 15 (Agency):** Adds white-labeling, allowing an agency to sell the platform as their own product.
*   **Phase 16 (Branding):** Deep personalization—custom logos, favicon, and email footers for every tenant.

### 8. ✅ What Is Implemented (From Code)

*   **NOT IMPLEMENTED:** These are future-dated phases. However, the `workspace_type="FRANCHISE"` logic from Phase 8 provides a solid foundation for the Agency features in Phase 15.

---

## 🔹 Phase 17 — Platform Archival & Legacy Maintenance

### 1. 🧠 What This Phase Is (Conceptual)

Phase 17 is the "Long-Term Strategy." It acknowledges that technology ages. It implements the "Legacy Worker" framework—allowing old campaign logic to continue running in isolated containers while the "Main" platform moves to a new architecture. It's about "Zero-Downtime Evolution."

### 2. 🎯 Why This Phase Is Important (Real-World Perspective)

*   **Customer Continuity:** A user who set up a recurring campaign 3 years ago shouldn't have it break just because you updated the Template Engine.
*   **Developer Sanity:** Allows developers to write "Clean Code" for the new version without having to maintain thousands of `if version == 'v1' ...` statements in the main codebase.

### 3. 🏗 Backend Architecture

*   **Legacy Container Registry:** A series of Docker images (e.g., `shrflow-worker:v1.0`, `shrflow-worker:v2.0`).
*   **Routing Gateway:** The RabbitMQ exchange inspects the `version` header on a message and routes it to the correct legacy worker pool.

### 8. ✅ What Is Implemented (From Code)

*   **Legacy Directory:** The `platform/legacy_workers/` directory exists, containing `campaign_worker.py` and `worker.py`. These act as the "v1" reference implementation, isolated from the current "v2" logic.

---

## 🏗 Foundational Infrastructure & Cross-Phase Systems

Beyond the individual phases, ShrFlow includes several critical "Glue" systems that ensure the platform runs reliably in production.

### 1. 🐳 Containerized Orchestration (`deploy/`, `docker-compose.yml`)
The platform is fully Dockerized using a multi-container architecture.
*   **Local Dev Stack:** Orchestrates `api`, `worker`, `client`, `redis`, `rabbitmq`, and `mailhog` (for SMTP testing).
*   **Multi-Stage Builds:** Dockerfiles in the `deploy/` directory use multi-stage builds to minimize image size for production.
*   **Infrastructure Sharding:** The system is designed to run multiple `worker` instances to scale horizontal throughput independently of the `api`.

### 2. 🛣 Architectural Evolution: The `template_service` Split
As part of the Scale-Out Strategy (Phase 13), the **Template Engine** is currently being extracted into a standalone microservice (`platform/services/template_service`).
*   **Reasoning:** MJML compilation is CPU-intensive. By moving it to a separate service, the core API remains responsive even during heavy template editing sessions.
*   **Mainframe Ready:** The split includes its own `main.py`, `models.py`, and `routes.py`, signaling a move toward a true service-oriented architecture (SOA).

### 3. 🛠 DevOps & Maintenance Tooling (`scripts/`)
A collection of utility scripts provides operational control over the system:
*   **`region_monitor.py`:** Monitors AWS SES region health and availability.
*   **`e2e_readiness_check.py`:** A system-wide "Pulse Check" that verifies DB, Redis, and RabbitMQ connectivity before service startup.
*   **`seed_templates.py`:** A high-fidelity seeder that populates the library with production-ready MJML templates.

---

## 🛡 Security & Compliance Depth

ShrFlow implements several "Hidden" security layers that aren't explicitly visible in the UI but are critical for Enterprise-grade stability.

### 1. 🤖 Anti-Bot Protection (`utils/captcha.py`)
The platform integrates **reCAPTCHA v3** and **Cloudflare Turnstile** verification at the API level.
*   **Score-Based Gating:** The system rejects any authentication or signup request with a bot score below `0.5`.
*   **Action-Specific Tokens:** Tokens are tied to specific actions (e.g., `login`, `signup`) to prevent replay attacks.

### 2. 🚨 Intelligent Audit Alerting (`audit_service.py`)
The audit system is not just a passive log; it is an active security monitor.
*   **Bulk Deletion Detection:** If a user deletes more than 1,000 contacts in a single action, the `audit_service` triggers an automated **Critical Security Alert** to the system admins.
*   **Suspicious Activity Scoring:** Logic is in place to flag anomalous behavior patterns (e.g., rapid login failures or unauthorized resource access attempts).

### 3. 🇪🇺 GDPR & Privacy Integrity (`account_deletion_service.py`)
To comply with global privacy laws, the system implements a robust "Right to be Forgotten" workflow.
*   **Hard vs. Soft Delete:** The `account_deletion_service` handles the complex cascading deletion of all tenant assets (S3 files, campaign history, and contact records) while preserving mandatory financial/billing audit trails.

---

## 🏁 Conclusion & Architectural Verdict

ShrFlow is currently in a **"Transitionary Modular Monolith"** state. It has successfully moved past the MVP stage (Phase 1-4) and has implemented some very advanced "Enterprise" features from Phase 8 (Franchise) and Phase 5.7 (Backpressure) earlier than planned.

### 🚀 Strategic Strengths:
1.  **Data Isolation:** The PostgreSQL RLS + `asyncpg` session logic is world-class and provides a "Zero-Leak" guarantee.
2.  **Worker Resiliency:** The distributed locking in `scheduler.py` prevents the most common "Double-Send" bugs found in SaaS platforms.
3.  **Architectural Foresight:** The ongoing split of the `template_service` demonstrates a proactive approach to microservice scaling.

### ⚠️ Critical Gaps (Action Required):
1.  **AI & RAG (Phase 10):** Completely missing. This is a high-value feature that should be prioritized to stay competitive.
2.  **MCP Framework (Phase 1.9):** Missing. Implementing this will significantly speed up future development by allowing AI-driven audits.
3.  **Analytics Scaling:** The `email_events` table is a ticking time bomb. Migration to ClickHouse should be moved forward to the next sprint.

**Final Status:** The system is **Scalable, Secure, and Architecturally Sound**, with a clear path toward a high-performance microservice future.

---
*Generated by Senior Staff Engineer + System Architect (AI Assistant)*






