Strategic Briefing: ShrFlow Email Engine Platform

Executive Summary

The ShrFlow Email Engine is a highly scalable, multi-tenant SaaS platform designed for high-volume email delivery and sophisticated audience management. The platform’s core philosophy centers on Tenant Isolation, Deliverability Protection, and Asynchronous Scalability.

The architecture utilizes a "Dual Email Engine" strategy to segregate critical system alerts from bulk marketing campaigns, ensuring platform reliability even during tenant-level deliverability crises. Technical foundations rely on a modern stack including FastAPI, Next.js, RabbitMQ for task queuing, and PostgreSQL with Row Level Security (RLS) for bulletproof data isolation. The development roadmap progresses from a foundational UI/UX and auth system through sophisticated campaign orchestration, ending with enterprise-grade microservices and Retrieval-Augmented Generation (RAG) AI capabilities.


--------------------------------------------------------------------------------


I. Core Architecture and Infrastructure

The Dual Email Engine Strategy

A defining feature of the platform is the physical separation of email traffic based on intent:

1. System Emails: (OTPs, password resets, invites) Sent via Gmail SMTP (shrflow.app@gmail.com). This leverages Gmail’s high trust reputation to ensure critical alerts land in the inbox.
2. Campaign Emails: (Newsletters, bulk marketing) Sent via AWS SES using the tenant’s verified domain.

Strategic Impact: This design isolates sender reputations. A spam complaint against one tenant’s campaign cannot impede the delivery of critical system notifications for another user.

Technical Stack and Evolution

The platform has evolved from a standard Supabase implementation to a high-performance custom architecture:

* Database: PostgreSQL with a transition from Supabase PostgREST to asyncpg connection pooling. This shift allows for transaction-level context setting (e.g., SET LOCAL app.current_tenant_id) necessary for Row Level Security (RLS).
* Messaging & Workers: RabbitMQ (via aio-pika) manages heavy workloads like CSV imports and email dispatch.
* State & Caching: Redis handles rate limiting, distributed locking (to prevent double-sends), and WebSocket Pub/Sub for real-time UI updates.
* Developer Intelligence: Implementation of the Model Context Protocol (MCP) provides a standardized bridge for AI agents to assist in system monitoring and debugging.


--------------------------------------------------------------------------------


II. Key Functional Engines

1. Contacts and Audience Management

The Contacts Engine is designed for "gigabyte-scale" datasets using a Storage-First and Queue-Second pipeline:

* S3-First Ingestion: Users upload files directly to S3/MinIO via presigned URLs, bypassing API memory limits.
* Streaming Workers: Dedicated workers stream data from storage in 500-row chunks to prevent Out-Of-Memory (OOM) errors.
* Data Integrity: Includes syntax validation, MX record checks, and disposable email detection.
* Anonymization: To comply with GDPR's "Right to be Forgotten," the system uses an anonymization endpoint (deleted@gdpr.invalid) to preserve aggregate analytics while removing PII.

2. Template and Content Engine

The system prioritizes responsive rendering and AI assistance:

* MJML Pipeline: Abstract template JSON is compiled into MJML and then into highly compliant HTML for Outlook/Gmail compatibility.
* AI Integration: A "Magic-wand" UI generates subject lines and rewrites copy using LLMs.
* Visual Editor: A structured, section-based editor (CKEditor 5) prevents users from "breaking" MJML layouts.

3. Campaign Orchestration

Campaigns are managed through a state-controlled machine:

* Pre-Send Integrity Guard: A hard stop that validates tokens and audience data before dispatching.
* Optimistic Locking: Versioning on campaign records prevents "Approval Race Conditions" between Admins and Creators.
* Dispatch Throttling: Controls injection rates to prevent SMTP flooding and reputation damage.


--------------------------------------------------------------------------------


III. Delivery, Compliance, and Analytics

Delivery Logic and Backpressure

The Delivery Engine manages the "last mile" of email transit:

* Bounce Classification: Distinguishes between Hard Bounces (permanent suppression) and Soft Bounces (exponential retry).
* Kill-Switch: A Redis-backed mechanism allows administrators to halt a campaign across all workers in milliseconds.
* Rate Limiting: Implemented via a Token Bucket algorithm in Redis, with tiers ranging from Free (60/min) to Enterprise (18,000/min).

Observability and Tracking

* Engagement Tracking: Uses 1x1 image pixels for opens and HMAC-signed tokens for click tracking.
* Bot Detection: Heuristic rules distinguish between human opens and privacy proxies (Apple MPP, Google).
* Event Archival: A tiered strategy moves data from PostgreSQL to ClickHouse after 90 days to maintain query performance at 100M+ row scales.


--------------------------------------------------------------------------------


IV. Enterprise Governance and Multi-Tenancy

The platform provides a "Franchise" model for large-scale organizational management:

Role	Permissions
Owner	Full access, billing, team invites, ownership transfer.
Admin	Operational controls, can invite others but cannot manage roles.
Creator	Can create and request campaign approvals; no management rights.
Viewer	Read-only access to analytics and dashboard.

Administrative Safeguards

* Franchise Governance: Parent workspaces can spawn, suspend, and monitor child workspaces with absolute data isolation.
* Onboarding Escape Guard: A specialized mechanism in the AuthContext that rescues users trapped in "ghost" (incomplete) workspaces by redirecting them to active contexts.
* Audit Logging: An immutable, write-only table records every critical action (who, what, when) with severity levels (INFO, WARNING, CRITICAL).


--------------------------------------------------------------------------------


V. Future Roadmap and Scaling (Phases 10-17)

The long-term strategy focuses on automation and deep intelligence:

* Phase 10.5 (AI & RAG): Implementation of a Vector Database (pgvector) to index successful campaigns, enabling a RAG bot to suggest strategies based on historical data.
* Phase 13 (Microservices): Decomposing the monolith into five dedicated workers: sender, webhook-handler, reputation-worker, warmup-scheduler, and dispatch-logger.
* Phase 14 (Platform Command Center): A "God Mode" for the platform managing team featuring "Shadow Mode" for debugging (with PII masking) and a global "Kill-Switch" for malicious tenants.
* Phase 17 (Advanced Intelligence): Machine Learning for Send-Time Optimization (STO) and Bayesian A/B testing using Multi-Armed Bandit algorithms.


--------------------------------------------------------------------------------


VI. Critical Risks and Mitigations

Risk	Mitigation Strategy
Gmail Send Limits	The current 2,000/day cap on system emails will be mitigated by migrating to a dedicated AWS SES sub-domain (mail.shrflow.app) in Phase 9.
Database Performance	Monthly PostgreSQL table partitioning and eventual migration of historical events to ClickHouse/TimescaleDB.
Cross-Tenant Leaks	Heavy enforcement of PostgreSQL Row Level Security (RLS) and standardized Redis key namespacing (tenant:{id}:*).
Worker Zombie Tasks	Implementation of a locked_by column in the database and Redis-based heartbeats for every active worker.
Double-Dispatch	Use of Redis SET NX EX 90 distributed locks in the standalone scheduler to prevent duplicate campaign fires in multi-replica deployments.
