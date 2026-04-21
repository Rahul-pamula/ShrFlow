# Phase 2 — Contacts Engine
## The Theoretical Architecture & "The Why" Behind Every Decision

> **Who is this for?** Anyone new to this project. This document explains what Phase 2 is, the reasoning behind every task we built, and what would go catastrophically wrong without it.

---

## What is Phase 2? (Start Here)

Phase 1 built the vault and gave every user a keycard. Phase 2 is the point where the platform moves from "who you are" to "who you're talking to."

**Phase 2 is the Contacts Engine — the audience data layer that every future email campaign depends on.**

Without Phase 2, the platform has authentication and a dashboard but nothing to send to. No contacts means no campaigns, no open rates, no revenue, no product. Contacts are the single most important raw asset an email marketing company owns. A business uploads a list of 200,000 subscribers that they spent years collecting — it is irreplaceable. Phase 2 must handle that list with extreme engineering care: never lose a row, never corrupt a record, never allow Company A to see Company B's data.

Phase 2 also introduces the first serious distributed systems architecture in the product. When a user uploads a CSV file with 100,000 rows, a synchronous HTTP request cannot handle it — the connection would timeout after 30 seconds and lose everything. Phase 2 solves this with a multi-stage pipeline: the file goes directly to object storage, a background worker processes it asynchronously in safe chunks, and the user watches live progress without ever waiting for a frozen screen.

---

## Section 1 — The Import Pipeline Architecture

### CSV/XLSX Ingestion (Phase 2 Master Refactor — Storage-First, Queue-Second)

A naive implementation of file import sends the CSV file to the API server, which reads the entire thing into RAM and processes it synchronously in the HTTP request cycle. For a 50,000-row CSV file, this takes 45 seconds, exceeds the HTTP timeout window, and crashes with an out-of-memory error on the server — and the user loses their entire upload with no feedback. We rebuilt the import pipeline from scratch around a "Storage-First, Queue-Second" principle: the file never touches the API server's memory at all. It goes directly from the user's browser to permanent object storage, and a separate background queue processes it safely on its own timeline. Without this architectural decision, any import over a few thousand rows would be unreliable and the platform would be fundamentally unusable at the scale our customers operate.

### `POST /contacts/import/initialize` — Presigned URL Generator

The first step of an import is generating a one-time presigned upload URL, which is a temporary signed link that gives the user's browser permission to write directly to our object storage bucket (Supabase Storage / S3 / MinIO). This call also creates a `Job ID` that will be used to track the import's progress. This endpoint exists because the frontend needs a secure, authorized upload target — without it, either the file would have to pass through the API server's RAM (which we deliberately avoided) or uploads would be completely unauthenticated and any person on the internet could write files to our storage bucket.

### `POST /contacts/import/process` — Queue Signal

Once the browser has confirmed the file is uploaded to object storage, it calls this second endpoint to signal "the file is ready, please process it." This endpoint creates the `import_batches` row, publishes a message to the RabbitMQ `import_tasks` queue, and immediately returns a `batch_id` and `job_id` to the frontend. The actual import work starts asynchronously in the background worker. Without this two-step separation, the API would have to block the HTTP connection while waiting for the worker — tying up server threads and creating timeouts for large files.

### Dedicated RabbitMQ Import Worker

The import worker is an independent Python process that runs separately from the API server. It listens to the RabbitMQ `import_tasks` queue, fetches the CSV file from object storage using a streaming reader (meaning it downloads and processes 500 rows at a time, never loading the full file into RAM), validates each row, and upserts contacts into the database. Because this runs in a separate process, the API server stays free to handle other requests simultaneously. Without a dedicated worker, the platform could only process one import at a time, and every API route would slow down while an import was running.

### Async Import Job Creation

Every import creates a `jobs` row in the database with a unique `job_id`. This job record tracks the import's status (`pending`, `processing`, `completed`, `failed`), progress count (`processed_rows`, `total_rows`), and error details. The frontend polls `GET /contacts/jobs/{job_id}` every few seconds to get live progress updates. Without this job tracking system, the user would click "Import" and see nothing — no progress, no confirmation, no way to know if their 50,000 contacts were successfully imported or silently lost.

### Import Batch History

Every import also creates an `import_batches` row that permanently records the filename, total rows, imported count, failed count, error details, and timestamp. This history is surfaced in the "Import History" tab of the contacts page so users can audit every past import: when it happened, how many contacts were added, and which rows failed with what error reason. Without batch history, users have no audit trail for their data — they cannot answer a compliance question like "when did you add this email address to your list?" which is an essential legal requirement.

### Import Rejected Rows Table and Audit Service (Partial Success Logic)

Not every row in a CSV file is valid. A user's spreadsheet might have a row with a typo in the email (`john@`, no domain), a blank row, or an email from a known disposable provider. Rather than silently skipping bad rows or rejecting the entire file, we store every failed row in `import_batches.errors` with a specific reason per row (`invalid_email`, `duplicate`, `plan_limit_exceeded`). This partial success model means a file with 10,000 valid rows and 50 bad rows will still import the 9,950 valid contacts while surfacing a precise error report. Without this, every import would be an all-or-nothing gamble — one formatting mistake in 500 rows would reject a production customer's entire list.

### RabbitMQ Dead-Letter Queue (DLQ) for Failed Chunks

A Dead-Letter Queue is a special RabbitMQ destination that receives messages which have failed processing three consecutive times. If the database goes down momentarily during an import, the chunk of 500 rows that was being processed doesn't get silently lost — it goes to the DLQ. An engineer can inspect the DLQ, diagnose the failure, and re-queue those rows for reprocessing. Without a DLQ, any transient infrastructure failure during an import permanently loses a portion of the user's contact data with no recovery path and no alert that anything went wrong.

### WebSocket Progress Updates via Redis Pub/Sub

While the background worker is processing an import, the user is sitting on the contacts page watching a progress bar. This works through a real-time broadcast mechanism: the worker publishes progress events (like `{"processed": 5000, "total": 50000}`) to a Redis Pub/Sub channel keyed by `job_id`. The WebSocket Gateway server subscribes to that channel and broadcasts the event to any browser connection that is watching that specific import. Without real-time progress, the user's only feedback during a 3-minute large import is a static spinner — they have no idea if the import is working or frozen, and many will close the tab and lose track of their import entirely.

### Upload Preview Endpoint

Before committing to a full import, the user needs to see what they're about to import. The preview endpoint reads the first 5–10 rows of the uploaded file and returns the detected column headers and a sample of the data. This allows the user to verify the file parsed correctly and map which column contains emails before starting the actual import job. Without a preview step, users would regularly import files with the wrong column mapping — importing emails as first names, or importing a file they accidentally uploaded wrong — corrupting their contact database with no easy rollback.

---

## Section 2 — Email Validation & Data Quality

### Email Validation: Syntax Check + MX Record Check + Disposable Email Detection

Importing invalid or low-quality email addresses is one of the most damaging things that can happen to an email sender's domain reputation. If we allow 50,000 fake or invalid emails onto a list and a campaign is sent to them, a large percentage will hard-bounce, triggering spam filters at Gmail and Outlook to flag all of our sending domains as untrustworthy. We validate at three layers: first a regex syntax check (`john@domain.com` format), then an MX record lookup (verifying the domain actually has a mail server configured), and finally a check against a list of known disposable email providers (temp-mail.org, guerrilla mail, etc.) that produce infinite fake addresses. Without this tiered validation, users would unknowingly import garbage lists that would poison their sending reputation within the first campaign.

### Smart Data Mapping & Splitting (Merge Tag Normalization)

CSV files from different sources use wildly different column names. One file might have a column named "Full Name", another might have "Customer Name", and another might have "first name" with a space. We enforce strict JSON key normalization during import: a column named "Full Name" is automatically split and mapped to `first_name` and `last_name`. This normalization is critical because later phases use Merge Tags (like `{{first_name}}` in email copy) — if the underlying data key is `full_name` instead of `first_name`, the merge tag silently fails and every recipient gets an email that reads "Hello, !" with no name filled in. 

---

## Section 3 — Deduplication & Plan Limits

### Deduplication (In-Memory + Supabase Upsert on `tenant_id, email`)

Email lists inevitably contain duplicates — a user uploads a list that overlaps with a previous import, or the same person subscribed twice from two different web forms. Without deduplication, a user could end up with the same email address stored 10 times, receiving 10 copies of every campaign (which triggers spam complaints), and counting against their contact quota 10 times. We deduplicate at two layers simultaneously: within the uploaded file using a Python `set()` to discard repeated emails in the same upload, and at the database layer using a Supabase upsert with `on_conflict=["tenant_id", "email"]` so importing an already-existing contact updates their record instead of creating a duplicate row.

### Plan-Limit Enforcement for New Contacts Only

Email marketing plans charge by contact count. A fair enforcement model should only count genuinely new contacts against the quota — re-importing an existing contact to update their name or custom fields shouldn't consume additional quota. Our `check_plan_limits` logic counts current tenant contacts, then separately counts how many uploaded emails are already in the database, and only counts the difference as net-new. Without this distinction, a customer with 10,000 contacts who re-imports their full list to update phone numbers would be told they've exceeded their plan limit and have their import rejected — despite not actually adding a single new contact.

---

## Section 4 — Contact Management

### Contact Status (subscribed, unsubscribed, bounced, complained)

Every contact in the system carries a status that controls whether they are eligible to receive emails. A `subscribed` contact receives all campaigns. An `unsubscribed` contact has explicitly opted out and must never receive another email (CAN-SPAM legal requirement). A `bounced` contact's email address doesn't exist or persistently rejects delivery. A `complained` contact selected "Mark as Spam" in their email client. Without these status states and without checking them during campaign sending, every send would go to every contact regardless of their deliverability or legal opt-out status — resulting in regulatory violations, blacklisting, and destroyed domain reputation.

### Suppression List API (`GET /contacts/suppression`)

The suppression list is the consolidated view of all contacts who must never receive further emails from this tenant: bounces, unsubscribes, and complaints in one filterable page. This is not just a UI convenience — it is a compliance tool. If an email marketer is audited under GDPR or CAN-SPAM, they need to demonstrate that every person who unsubscribed was immediately and permanently suppressed. Without a dedicated suppression list page and API, tracking these opt-outs across a list of 200,000 contacts would require manually filtering the main contacts table, which is both tedious and error-prone.

### Deduplication Resolution UI (Show Conflict, Let Tenant Choose)

When a user imports an email that already exists in their database with different data (e.g., the existing record has `first_name=John` but the import says `first_name=Jonathan`), we need a decision: overwrite, or keep original? Automatically always overwriting destroys potentially correct existing data. Automatically keeping the original defeats the purpose of the re-import. The resolution UI surfaces these conflicts explicitly so the user can choose which values to keep. Without this, every re-import silently makes choices the user didn't authorize, slowly corrupting the contact database with no visibility or control.

### Contact Search Endpoint (Email, Name, Tag)

Users managing lists of 100,000 contacts cannot scroll through a paginated table to find a specific person. A search bar backed by a performant backend query is essential for day-to-day management. The contact search endpoint queries across `email`, `first_name`, and `last_name` simultaneously. Without search, every time a support team member needs to check whether a specific customer is on the list, they need to export the entire CSV and use Ctrl+F locally — completely impractical and slow.

### Contact Update Endpoint (Email + Custom Fields)

Subscriber data changes over time — people change companies, update their email addresses, or provide new phone numbers through a form. A PATCH endpoint allows updating any contact's stored data without deleting and re-importing. Without an update mechanism, correcting a single contact's data requires a full re-import of the entire list — an enormous operational burden that also risks introducing new import errors.

### Tags CRUD API (add/remove/list tags per contact)

Tags are flexible, user-defined labels for organizing contacts (`VIP`, `enterprise`, `event-signup-2025`). They are the foundation of manual segmentation — users tag specific contacts and then build campaigns targeting `VIP` contacts only, or exclude `churned` contacts. The API allows adding and removing tags from individual contacts and from the contacts list page in bulk. Without tags, the only way to group contacts is by which import batch they came from — a completely inadequate organizational model for a real marketing team.

### Bulk Delete & Delete All

Users regularly need to mass-delete contacts — clearing a bounced list, removing all contacts from a bad import, or starting fresh before a major list cleanup. Individual row deletions for a 50,000-contact list would require 50,000 API calls. Bulk delete accepts an array of contact IDs and deletes them in a single database operation. Delete all removes every contact for the tenant in one truncation-style call. Without these bulk operations, list management becomes impractical at real-world scale.

### Domain Summary Endpoint & `email_domain` Storage

We extract and store the domain portion of every contact's email address (`gmail.com`, `accenture.com`, `microsoft.com`) as a dedicated `email_domain` field. A domain summary endpoint aggregates these into a count per domain. This has two powerful uses: the user can see at a glance that 40% of their list is Gmail users and 15% are enterprise Outlook users (informing deliverability strategy), and campaigns can be targeted by domain — send only to contacts with a `salesforce.com` domain for a specific enterprise outreach. Without domain storage and summarization, this entire segmentation dimension is invisible.

### Batch-Scoped Domain Filtering & Suspicious Domain Suggestions

When reviewing a specific import batch, users need to see the domain breakdown within that batch and filter to show only contacts from a specific domain. We also surface typo-domain warnings (if a batch contains 500 `gmail.com` contacts and 3 `gmial.com` contacts, we flag the 3 as likely typos and suggest the corrected domain). Without typo-domain detection, users unknowingly keep misspelled email addresses on their lists — addresses that will always hard-bounce, slowly damaging their sender reputation without any obvious cause.

### Segmentation Filters (Filter by Field/Operator/Value)

A segment builder allows users to define a reusable audience rule like "all contacts where `country = US` AND `plan = enterprise` AND `status = subscribed`". This creates named audience groups that update dynamically as new contacts are imported. Without segmentation, users must export their full list to Excel, filter it manually, and re-import a subset for every targeted campaign — a multi-hour workflow that should be a 30-second UI interaction.

### Contact Scoring System (Engaged / At-Risk / Inactive / Risky)

Not all contacts on a list are equally valuable. A contact who opened the last 10 campaigns is "Highly Engaged" and should be in the premium segment. A contact who hasn't opened an email in 18 months is "Inactive" and may be harming deliverability by being a "dead" address that may eventually bounce. Automatically scoring every contact based on open/click history and assigning a badge (`engaged`, `at-risk`, `inactive`, `risky`) gives marketers an immediate visual signal about list health and helps them make intelligent decisions about who to send to and at what volume.

### Export Contacts API & Button

Users need to take their contacts out of the platform for analysis in Excel, migration to another tool, compliance reporting, or backup. The export endpoint fetches all tenant contacts and streams them as a CSV, dynamically including all custom field columns that exist in the tenant's contact data. Without export, the platform holds user data "hostage" — violating GDPR data portability rights (Article 15) and creating an enormous trust barrier for any customer who is evaluating whether to move their list into our system.

### Contact Detail Page (Individual Contact Activity)

When a customer calls support saying "I didn't receive your email," the support agent needs to instantly look up that specific contact, see their status, see their last import batch, see any custom fields, and see their tag history. The contact detail page provides this individual-level view. Without a detail page, every per-contact investigation requires running a raw database query — completely impractical for non-technical support staff.

### Campaign Audience Selection Supports Batch-Domain Targeting

When setting up a campaign, users need to choose who receives it. Beyond "send to all contacts", they need to send to a specific batch, to a specific domain within a batch, or to multiple specific domains. This directly integrates the Phase 2 domain model into the campaign creation flow. Without this, users who manage multiple client lists within one workspace (e.g., an agency) cannot target campaigns to a specific client's contacts without creating separate workspaces.

---

## Section 5 — Developer & Infrastructure

### `POST /v1/contacts` — Real-Time Contact Ingestion API (for Forms/CRM Webhooks)

Not all contacts arrive via CSV upload. A web signup form, a CRM like HubSpot, or a custom application needs to add contacts to the platform in real time as users sign up. This REST endpoint accepts a single contact payload (`email`, `first_name`, optional custom fields) and immediately inserts or updates the contact. It is designed for programmatic integration — it is the public-facing API surface for external systems. Without it, the platform only handles batch file imports and cannot serve as a real-time data sink for live web traffic.

### Import History Tab and Batch Detail Page

The import history tab shows every past import: filename, date, row counts, success/failure ratio. Clicking into a batch opens the batch detail page showing exactly which contacts came from that file, with per-domain breakdown and error details for failed rows. Without import history, users have no auditability over how their list was built — they cannot answer "where did this contact come from?" which is a routine compliance and deliverability question.

### FIX: `GET /suppression` Route Collision with `/{contact_id}` Resolved

FastAPI route matching resolves from top to bottom. If a route `GET /contacts/{contact_id}` is registered before `GET /contacts/suppression`, FastAPI will match the string `suppression` as a contact ID and attempt a database lookup for a contact with ID "suppression" — returning 404 for every suppression page load. We fixed the route ordering so the specific `/suppression` path is registered first, ensuring it is matched correctly before the generic `/{contact_id}` wildcard. Without this fix, the suppression list page is permanently broken.

### FIX: Suppression List `jwt_payload` Argument Bug Fixed

A function signature bug in the suppression list endpoint was passing the JWT payload object where the suppression query function expected a raw tenant_id string. This caused the query to filter on the entire object rather than the string value, returning zero results for every suppression list request regardless of how many suppressed contacts exist. Without this fix, the suppression list always shows empty, giving users a false impression that their bounce and unsubscribe history is clean when it isn't.

### Streaming CSV Uploads — Replace Pandas In-Memory Parser (AUDIT FIX 18)

The original import parser loaded the entire CSV file into a pandas DataFrame in server RAM before processing. For a 500,000-row file, this could occupy 2GB+ of RAM on the API server, potentially crashing it entirely and taking down all API surfaces simultaneously. The fix replaces the pandas-based parser with an async chunked byte-stream parser that reads 500 rows at a time from object storage, processes them, and releases memory before reading the next chunk. The server's RAM usage during an import becomes constant regardless of file size.
