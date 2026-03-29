# Email Engine — Complete Phase Plan

> This document is the **strategic planning guide** for the Email Engine platform.
> It describes what each phase is, why it exists, what it covers, and the technical architecture behind it.
> Progress tracking (what is done vs. pending) lives in the **interactive HTML tracker** (`docs/progress.html`).
> Live URL: https://rahul-pamula.github.io/Sh_R_Mail/progress.html (redirect available at https://rahulpamula.me/Sh_R_Mail/)

Each phase is divided into TWO parts:
  [BACKEND] — API, database, worker logic
  [FRONTEND] — Pages, components, UX flows

---

## 🏗 CRITICAL ARCHITECTURE: DUAL EMAIL ENGINE

Before phases — explain this first:

Our system sends two completely different types of emails:

1. **System Emails** — OTPs, welcome emails, team invites, password reset → sent via `shrmail.app@gmail.com` (Gmail SMTP) — almost always lands in the inbox because Gmail has a trusted reputation.
2. **Campaign Emails** — Bulk newsletters to thousands of subscribers → sent via the tenant's own verified domain (e.g. `sales@theircompany.com`) via **AWS SES** — isolates sender reputation per tenant.

> **Why this matters:** This design means even if one tenant's campaign has deliverability issues or spam complaints, it never affects our platform's ability to deliver critical OTPs and system alerts to another user.

### Architecture Flow

```mermaid
graph TD
    classDef userNode fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:10px,ry:10px;
    classDef coreApp fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef sysWorker fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef tenWorker fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef provider fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff,font-weight:bold,rx:10px,ry:10px;
    classDef db fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff,rx:5px,ry:5px;
    
    User([Platform User / Tenant]) --> |Interacts with| App[Sh_R_Mail Platform]
    class User userNode;
    class App coreApp;
    
    subgraph AppLogic [App Logic]
        Auth[Auth & Core Logistics]
        Campaigns[Campaign Engine]
        App --> Auth
        App --> Campaigns
        class Auth coreApp;
        class Campaigns coreApp;
    end

    subgraph DualProcessingQueues [Dual Processing Queues]
        SysQueue[(System Queue)]
        TenantQueue[(Campaign Queue)]
        Auth --> |"OTP, Invites, Password Resets"| SysQueue
        Campaigns --> |"Newsletters, Bulk Promos"| TenantQueue
        class SysQueue db;
        class TenantQueue db;

        SysWorker[System Mail Worker]
        TenantWorker[Tenant Mail Worker]
        SysQueue --> SysWorker
        TenantQueue --> TenantWorker
        class SysWorker sysWorker;
        class TenantWorker tenWorker;
    end

    subgraph EmailDeliveryProviders [Email Delivery Providers]
        Gmail[Gmail SMTP]
        SES[AWS SES]
        SysWorker --> |"shrmail.app@gmail.com"| Gmail
        TenantWorker --> |"sales@tenantdomain.com"| SES
        class Gmail provider;
        class SES provider;
    end

    Inbox1([User Inbox])
    Inbox2([Subscriber Inbox])
    Gmail --> |"Guaranteed Inbox Delivery"| Inbox1
    SES --> |"Isolated Tenant Reputation"| Inbox2
    class Inbox1 userNode;
    class Inbox2 userNode;

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 5 5;
    class DualProcessingQueues dualBox;
    class EmailDeliveryProviders dualBox;
```

---

## Phase 0 — UI/UX Foundation & Design System
**WHY:** Establishes the visual language, reusable UI primitives, interaction rules, and accessibility baseline before feature work scales.

### Phase 0 Architecture Flow

```mermaid
graph TD
    classDef foundation fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef component fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef a11y fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef devtool fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph TheDesignSystem [The Design System & Styling]
        Tokens[Global CSS Tokens]
        Tailwind[Tailwind Config Mapper]
        Theme[Dark/Light Mode Swapper]
        Tokens --> Tailwind
        Tokens --> Theme
        class Tokens foundation;
        class Tailwind foundation;
        class Theme foundation;
    end

    subgraph ComponentLibrary [shadcn UI Component Library]
        Atoms[Atoms: Button, Badge, Toast, Spinner]
        Molecules[Molecules: StatCard, PageHeader, EmptyState]
        Organisms[Organisms: DataTable, ConfirmModal]
        Atoms --> Molecules
        Molecules --> Organisms
        class Atoms component;
        class Molecules component;
        class Organisms component;
    end

    subgraph AccessibilityLayer [Global Accessibility Specs]
        Focus[Modal Focus Traps]
        Touch[44x44 Min Touch Targets]
        Aria[ARIA Icon Labels]
        Contrast[WCAG 2.1 AA Contrast]
        class Focus a11y;
        class Touch a11y;
        class Aria a11y;
        class Contrast a11y;
    end

    subgraph LocalDeveloperTools [Local Dev Environment]
        Mailhog[Mailhog Docker / Email Catcher]
        Seeder[Python DB Seeder]
        Env[Standardized .env.example]
        class Mailhog devtool;
        class Seeder devtool;
        class Env devtool;
    end

    TheDesignSystem --> ComponentLibrary
    AccessibilityLayer -.-> ComponentLibrary

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class TheDesignSystem dualBox;
    class ComponentLibrary dualBox;
    class AccessibilityLayer dualBox;
    class LocalDeveloperTools dualBox;
```

**[BACKEND]**
- Mailhog added to docker-compose for local email testing and debugging.
- Database seed script (`seed_dev_data.py`) for reproducible development states.
- Standardized environment variables fully documented in `.env.example`.

**[FRONTEND]**
- Dark-mode first design tokens in `globals.css` bridged via `tailwind.config.ts`.
- Typography scale and semantic color set defined.
- Reusable UI component library (`Button`, `Badge`, `StatCard`, `DataTable`, `Toast`, `ConfirmModal`, `EmptyState`, etc.).
- Standard page layout pattern: Breadcrumb -> PageHeader -> Stat row -> DataTable -> EmptyState.
- Accessible modal implementations with focus traps, escape-to-close, and visible outlines.
- WCAG 2.1 AA color contrast validation and minimum 44x44px touch-target guidance enforced.

---

## Phase 1 — Foundation, Auth, Tenant Identity & Onboarding
**WHY:** Before any email can be sent, we need a secure multi-tenant foundation. Every query, row, and action must be strictly isolated by `tenant_id`.

### Phase 1 Architecture Flow

```mermaid
graph TD
    classDef frontend fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef auth fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef security fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph UserInterface [Frontend UX & Onboarding]
        Login[Login & Signup Pages <br> w/ Google/GitHub OAuth]
        Wizard[Multi-Step Wizard <br> Workspace > Use-Case]
        DashboardShell[Dashboard Sidebar & Layout]
        Context[Global AuthContext state]
        
        Login --> Context
        Wizard --> DashboardShell
        class Login frontend;
        class Wizard frontend;
        class DashboardShell frontend;
        class Context frontend;
    end

    subgraph SecurityMiddleware [Next.js & FastAPI Middleware]
        RouteGuard[Next.js Route Protection Redirects]
        FastAPIGuard[FastAPI Active-Tenant Resolver]
        RateLimit[IP / Email Login Rate Limiter]
        
        Context -.-> |"Carries JWT"| RouteGuard
        RouteGuard --> RateLimit
        RateLimit --> FastAPIGuard
        class RouteGuard security;
        class FastAPIGuard security;
        class RateLimit security;
    end

    subgraph AuthEngine [Authentication & Tenancy API]
        JWT[Custom JWT Issuer <br> Short-Lived Access]
        Revocation[Token Version Revocation]
        Bcrypt[Bcrypt Password Hashing]
        
        FastAPIGuard --> JWT
        JWT --> Revocation
        class JWT auth;
        class Revocation auth;
        class Bcrypt auth;
    end

    subgraph TenantModel [Tenant Database Architecture]
        Users[(Users Table)]
        Tenants[(Tenants Table)]
        TenantUsers[(Tenant_Users Join)]
        
        Users --> TenantUsers
        Tenants --> TenantUsers
        Bcrypt --> Users
        JWT --> TenantUsers
        class Users database;
        class Tenants database;
        class TenantUsers database;
    end

    UserInterface --> |"Sends Credentials"| SecurityMiddleware
    SecurityMiddleware --> |"Validates Payload"| AuthEngine
    AuthEngine --> |"Queries Membership"| TenantModel

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class UserInterface dualBox;
    class SecurityMiddleware dualBox;
    class AuthEngine dualBox;
    class TenantModel dualBox;
```

**[BACKEND]**
- Custom email/password auth using bcrypt and JWT validation.
- JWT payloads carry `tenant_id`, `user_id`, `role`, and `email` for rapid authorization.
- Tenant membership model linking `users`, `tenants`, via a `tenant_users` join table.
- Onboarding APIs providing step-by-step wizard endpoints (workspace creation, use-case selection).
- Active-tenant request-time guards verifying valid workspace context.

**[FRONTEND]**
- Modern Login and Signup pages supporting Social Auth (Google/GitHub context).
- Multi-step interactive onboarding wizard (`workspace` -> `use-case` -> `integrations` -> `scale` -> `complete`).
- Sidebar navigation layout governing the dashboard shell.
- Global `AuthContext` distributing verified session state across components.
- Middleware executing route protection and redirecting unauthenticated traffic safely.

---

## Phase 1.5 — Auth Hardening & Audit Logging
**WHY:** Secures the core authentication layer and introduces deep observability for crucial tenant actions.

**[BACKEND]**
- Immutable audit log table recording metadata securely (`user_id`, `tenant_id`, `action`, `resource_type`, timestamp). Never logs sensitive email contents or PII lists.
- Log severity levels distinguishing INFO, WARNING, and CRITICAL actions.
- Automated system alerts via Centralized System Emailer triggering when CRITICAL events occur (e.g., massive contact deletion).
- Two-factor auth (TOTP) generation capability for workspace administrators.

**[FRONTEND]**
- Audit log viewer UI component allowing workspace owners to filter team actions chronologically.
- 2FA setup screen rendering secure QR codes and validating TOTP generation.

---

## Phase 1.6 — GDPR & Legal Compliance
**WHY:** Ensures the system complies with EU data regulations securely before enterprise deployment.

**[BACKEND]**
- Async data export API generating ZIP files of all tenant contact data using a job queuing system avoiding HTTP timeouts.
- "Right to be Forgotten" endpoint triggering PII anonymization (`deleted@gdpr.invalid`) instead of hard deletion to perfectly preserve aggregate analytics history.
- Soft-delete architectural pattern utilizing `deleted_at` timestamps establishing a 30-day "recycle bin" restoration window.
- Consent tracking capturing import source, exact timestamp, and originating IP upon list ingestion.

**[FRONTEND]**
- Quick data export request functionality in Settings routing download instructions to email.
- Restoration action flows permitting users to undelete soft-deleted items.
- Specific consent and source columns visibly rendered in the contacts data table.

---

## Phase 2 — Contacts Engine
**WHY:** Contacts are the core dataset. This phase creates a stable, scalable lifecycle for importing, managing, suppressing, and tagging audiences.

### Phase 2 Architecture Flow

```mermaid
graph TD
    classDef frontend fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef api fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef worker fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph ContactsInterface [Frontend Contacts UI]
        List[Contacts List & Search Grid]
        Segments[Segment Builder & Tag UI]
        ImportModal[CSV / XLSX Import <br> Modal & Mapper]
        
        List --> Segments
        List --> ImportModal
        class List frontend;
        class Segments frontend;
        class ImportModal frontend;
    end

    subgraph ContactsAPI [Contacts API Layer]
        ContactCRUD[Contact CRUD & Filtering]
        SyncInsert[Real-Time POST Insertion]
        PreviewAPI[CSV Stream Previewer]
        
        ContactsInterface -.-> |"Search/Filter"| ContactCRUD
        ImportModal --> |"Form Upload"| PreviewAPI
        class ContactCRUD api;
        class SyncInsert api;
        class PreviewAPI api;
    end

    subgraph ImportWorker [RabbitMQ Async Worker]
        Chunker[Async Byte Stream Parser]
        Validator[MX / Syntax Validator]
        DeDupe[In-Memory Deduplicator]
        
        PreviewAPI --> |"Dispatches Job"| Chunker
        Chunker --> Validator
        Validator --> DeDupe
        class Chunker worker;
        class Validator worker;
        class DeDupe worker;
    end

    subgraph DataLayer [Storage & Data Integrity]
        Contacts[(Contacts Table <br> Soft Delete)]
        Tags[(Tags / Segments)]
        Batches[(Import Batches)]
        
        ContactCRUD --> Contacts
        DeDupe --> |"Upsert tenant_id+email"| Contacts
        Contacts --> Tags
        DeDupe --> Batches
        class Contacts database;
        class Tags database;
        class Batches database;
    end

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class ContactsInterface dualBox;
    class ContactsAPI dualBox;
    class ImportWorker dualBox;
    class DataLayer dualBox;
```

**[BACKEND]**
- High-performance, streaming CSV/XLSX ingestion running asynchronously via RabbitMQ to support gigabyte-scale datasets.
- Real-time single contact insertion REST API designed for external CRM or web-form integrations.
- Tiered validation sequence rejecting malformed domains and detecting Disposable Email Providers instantly.
- Complex deduplication and append behavior preventing collisions.
- Contact scoring system assigning Engagement Scores (e.g., "Inactive", "Highly Engaged").
- **Smart Data Mapping & Splitting**: Enforce strict JSON key normalization during CSV imports (e.g., mapping "Full Name" to `first_name` and `last_name` via automatic string splitting) to guarantee Merge Tags resolve correctly.

**[FRONTEND]**
- robust Contacts grid implementing native search, sorting, and pagination logic.
- Import modal UI presenting column mapping and visualizing background polling progress.
- Specific status badges illustrating Subscribed, Bounced, or Unsubscribed states.
- Dedicated Suppression List view exposing spam complaints and hard bounces.
- Dynamic segment builder targeting specific field permutations.

---

## Phase 3 — Template Engine & AI Content Creation
**WHY:** Email content must be responsive, dynamic, and perfectly rendered across extreme client environments (Outlook, Gmail, Apple).

### Phase 3 Architecture Flow

```mermaid
graph TD
    classDef frontend fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef engine fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef ai fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph TemplateBuilder [Visual Block Editor]
        Grid[Template Gallery & Presets]
        Canvas[Drag-and-Drop Canvas <br> Rows/Cols/Blocks]
        Preview[Mobile / Inbox Simulation UI]
        
        Grid --> Canvas
        Canvas --> Preview
        class Grid frontend;
        class Canvas frontend;
        class Preview frontend;
    end

    subgraph ContentEngine [Template Processing API]
        Compiler[MJML compiler <br> JSON > HTML]
        Plain[Plain-Text Auto-Generator]
        Spam[Heuristic Spam Score Checker]
        
        Canvas -.-> |"Sends design_json"| Compiler
        Compiler --> Plain
        Compiler --> Spam
        class Compiler engine;
        class Plain engine;
        class Spam engine;
    end

    subgraph AIModule [AI Generation Layer]
        Prompt[LLM Proxy Service]
        Tone[Tone / Rewrite Adjustments]
        
        Canvas --> |"Context Request"| Prompt
        Prompt --> Tone
        Tone -.-> |"Returns Text"| Canvas
        class Prompt ai;
        class Tone ai;
    end

    subgraph TemplateData [Storage & Versioning]
        Templates[(Templates Table <br> design_json + HTML)]
        Versions[(Version History <br> Snapshots)]
        
        Compiler --> Templates
        Templates --> Versions
        class Templates database;
        class Versions database;
    end

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class TemplateBuilder dualBox;
    class ContentEngine dualBox;
    class AIModule dualBox;
    class TemplateData dualBox;
```

**[BACKEND]**
- Layout preservation logic persistently tracking complex Template JSON constructs.
- MJML processing pipeline compiling abstract blocks into highly compliant render-safe HTML.
- Template versioning creating immutable snapshots for draft restorations.
- Plain-text auto-generation matching HTML changes automatically.
- Email spam heuristic checker rating subject/body language.
- **AI-Assisted Content Generation API**: Backend proxy to LLM endpoints designed to rewrite, adjust tone, or generate email copy dynamically based on tenant prompts.

**[FRONTEND]**
- Visually rich template gallery with selectable preset starting points.
- Interactive structured block editor (Rows -> Columns -> Content Blocks).
- Responsive view toggles forcing desktop vs mobile rendering simulation inside the canvas.
- Inbox preview mode mocking specific visual anomalies of major clients.
- Send test email functionality seamlessly embedding custom merge-tag dummy data.
- **AI Copywriting Assistant UI**: Magic-wand contextual buttons generating subject lines or rewriting paragraphs inline inside the editor canvas.

---

## Phase 4 — Campaign Orchestration
**WHY:** Orchestrates the core action of filtering audiences, attaching content, validating legality, and queuing dispatches.

### Phase 4 Architecture Flow

```mermaid
graph TD
    classDef frontend fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef logic fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef background fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph CampaignUI [Frontend Orchestration]
        Wizard[Multi-Step Campaign Wizard]
        Checklist[Pre-Send Validation UI]
        Controls[Pause / Cancel Mid-Send]
        
        Wizard --> Checklist
        Checklist --> Controls
        class Wizard frontend;
        class Checklist frontend;
        class Controls frontend;
    end

    subgraph CampaignAPI [Campaign Processing Logic]
        Snapshot[HTML Template Snapshot Generator]
        Spintax[Spintax & Merge Tag Resolver]
        Rate[Throttling / Send Rate Limit Engine]
        
        Checklist --> |"Triggers Dispatch"| Snapshot
        Snapshot --> Spintax
        Spintax --> Rate
        class Snapshot logic;
        class Spintax logic;
        class Rate logic;
    end

    subgraph ScheduledWorker [Background Schedulers]
        Cron[Schedule Poller <br> 60s Check]
        DistLock[Redis Distributed Lock]
        
        Cron <--> DistLock
        Cron --> |"Fires Due Campaigns"| Snapshot
        class Cron background;
        class DistLock background;
    end

    subgraph CampaignData [Orchestration Storage]
        Campaigns[(Campaign Metadata)]
        Intents[(Dispatch Intents <br> Per-Recipient Row)]
        
        Wizard --> Campaigns
        Rate --> Intents
        Campaigns --> Intents
        class Campaigns database;
        class Intents database;
    end

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class CampaignUI dualBox;
    class CampaignAPI dualBox;
    class ScheduledWorker dualBox;
    class CampaignData dualBox;
```

**[BACKEND]**
- Snapshotting logic immutably locking campaign HTML and metadata exactly at send time.
- Spintax capability injecting alternating subject variations and localized merge-tag parsing.
- **Merge Tag Fallback Engine**: Systematically injects default fallback strings (e.g., "Customer") when a personalization token like `{{first_name}}` attempts to map to an empty database field, preventing broken or awkward emails.
- Scheduling engine committing tasks to execution timestamps.
- Dispatch throttling gate controlling total per-minute injection rates preventing SMTP connection flooding.

**[FRONTEND]**
- Multi-step Campaign Creation Wizard sequentially ordering details, audience targeting, content review, and summary checks.
- Pre-send checklist enforcing presence of Unsubscribe links, physical addresses, and blank subjects before enabling the Send action.
- Schedule picker allowing exact timezone-aware delivery planning.
- "Send to 5% sample" interactive switch for risk-free trial runs.
- Instant Pause and Cancel actions surfaced on active dashboard panels.

---

## Phase 5 — Delivery Engine
**WHY:** Connects the system to the internet via SMTP, automatically responding to bounces, spam complaints, and user unsubscriptions securely.

### Phase 5 Architecture Flow

```mermaid
graph TD
    classDef worker fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef external fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef api fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph DispatchWorker [RabbitMQ Delivery Worker]
        RMQ[(RabbitMQ Queue)]
        Injector[CAN-SPAM / HMAC Unsub Injector]
        SMTP[Dynamic TLS SMTP Sender]
        DLQ[(Dead Letter Queue)]
        
        RMQ --> Injector
        Injector --> SMTP
        SMTP -.-> |"Failure / Retry 3x"| DLQ
        class RMQ worker;
        class Injector worker;
        class SMTP worker;
        class DLQ worker;
    end

    subgraph ExternalProvider [Email Delivery Provider]
        SES[AWS SES / Mailtrap]
        Inbox[Recipient Inbox]
        
        SMTP --> |"Authenticates & Sends"| SES
        SES --> Inbox
        class SES external;
        class Inbox external;
    end

    subgraph FeedbackLoop [Webhook Resolution API]
        Webhook[SES Complaint/Bounce Receiver]
        HardBounce[Hard Bounce Isolator]
        Spam[Spam Complaint Isolator]
        
        SES -.-> |"Fires Event"| Webhook
        Webhook --> HardBounce
        Webhook --> Spam
        class Webhook api;
        class HardBounce api;
        class Spam api;
    end

    subgraph ContactState [Contact Integrity DB]
        Contacts[(Contacts Table)]
        Reputation[(Tenant Reputation <br> Warmup Stats)]
        
        HardBounce --> |"Sets status=bounced"| Contacts
        Spam --> |"Sets status=unsubscribed"| Contacts
        HardBounce --> Reputation
        class Contacts database;
        class Reputation database;
    end

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class DispatchWorker dualBox;
    class ExternalProvider dualBox;
    class FeedbackLoop dualBox;
    class ContactState dualBox;
```

**[BACKEND]**
- RabbitMQ consumer loop maintaining persistent connections, dynamically executing TLS handshakes, and nacking failures into Dead Letter Queues gracefully.
- Legal footer injection statically appending CAN-SPAM compliant company addresses and HMAC-secure unsubscribe tokens.
- Immediate bounce classification logic segregating Soft Bounces (retried exponentially) from Hard Bounces (instantly placed on permanent suppression list).
- Spam complaint webhook ingestion directly suppressing contacts from further dispatches preventing reputation destruction.
- Domain warmup throttler incrementally raising outbound execution limits across 30 days.
- Tenant reputation tracking evaluating 30-day rolling bounce/spam statistics against critical suspension thresholds.

**[FRONTEND]**
- Clean Unsubscribe landing page capturing voluntary removal events effortlessly.
- Re-subscribe form confirming reversal of accidental unsubscribes.

---

## Phase 6 — Observability & Analytics (Heatmaps & Time Tracking)
**WHY:** Displays critical performance markers allowing users to judge campaign effectiveness accurately.

### Phase 6 Architecture Flow

```mermaid
graph TD
    classDef external fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef api fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef frontend fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph RecipientAction [Client Behaviors]
        EmailOpen[Client Dislays 1x1 Pixel]
        EmailClick[User Clicks Wrapped Link]
        class EmailOpen external;
        class EmailClick external;
    end

    subgraph TrackingEngine [Telemetry Resolution API]
        Pixel[HMAC Pixel Validator]
        LinkWrapper[Link Redirect Handler]
        Attribution[User-Agent Attribution <br> Apple MPP / Gmail Proxy]
        
        EmailOpen --> Pixel
        EmailClick --> LinkWrapper
        Pixel --> Attribution
        class Pixel api;
        class LinkWrapper api;
        class Attribution api;
    end

    subgraph AnalyticsData [Event Fast-Storage Matrix]
        Events[(email_events Timeline)]
        TimeSeries[72h Rolling Aggregation]
        
        Attribution --> Events
        LinkWrapper --> Events
        Events --> TimeSeries
        class Events database;
        class TimeSeries database;
    end

    subgraph AnalyticsUI [Frontend Stat Reporting]
        StatCards[CTR & Overview Stat Cards]
        Graphs[72H Time-Series Charts]
        Proxy[Proxy vs Human Traffic Ring]
        
        TimeSeries --> StatCards
        TimeSeries --> Graphs
        TimeSeries --> Proxy
        class StatCards frontend;
        class Graphs frontend;
        class Proxy frontend;
    end

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class RecipientAction dualBox;
    class TrackingEngine dualBox;
    class AnalyticsData dualBox;
    class AnalyticsUI dualBox;
```

**[BACKEND]**
- 1x1 image pixel endpoint logging secure opens, guarded by heuristic Bot Detection rules distinguishing Google/Apple privacy proxies from malicious scanners or true humans.
- Click tracking honeypots dropping bots mimicking link engagement.
- Stats aggregation routines executing asynchronously to compile real-time summaries.
- **Time Spent Tracking Calculation**: Multi-ping pixel tracking logic classifying the duration a recipient hovered over the message.
- **Click Heatmap Calculation Job**: Aggregation engine correlating click event URLs directly back to their DOM position in the exact sent template.

**[FRONTEND]**
- Detailed Campaign Analytics Dashboard exhibiting exact unique open, click, and bounce matrices.
- Recipient timeline exposing chronological interactions per individual contact.
- Time Series graph plotting engagement velocity across the immediate 72 hours post-send.
- **Click Heatmap Overlay Presentation**: Visually injecting heat maps directly onto the template preview canvas illustrating intense link engagement locations.
- **Engagement Duration Card**: UI stat displaying average read times effectively.

---

## Phase 7 — Plan Enforcement & Billing
**WHY:** Regulates computational exhaustion, prevents abuse, and ties usage directly to recurring revenue tiers.

### Phase 7 Architecture Flow

```mermaid
graph TD
    classDef frontend fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef logic fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef external fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph BillingUI [Frontend Subscription UI]
        PlanPage[Plan & Usage Dashboards]
        Banner[80% / 100% Limit Banners]
        Upgrade[Upgrade Modals / Blockers]
        
        PlanPage --> Banner
        Banner --> Upgrade
        class PlanPage frontend;
        class Banner frontend;
        class Upgrade frontend;
    end

    subgraph QuotaEngine [Enforcement API Logic]
        MonthCounter[Monthly Send Counter]
        Gate[Dispatch Block Interceptor]
        Overage[Overage Pricing Calculator]
        
        Upgrade --> |"Attempts Action"| Gate
        Gate <--> MonthCounter
        MonthCounter --> Overage
        class MonthCounter logic;
        class Gate logic;
        class Overage logic;
    end

    subgraph StripeIntegration [Stripe Billing Handlers]
        Webhook[Stripe Payment Webhooks]
        GracePeriod[7-Day Grace Degradation]
        
        Webhook --> GracePeriod
        class Webhook external;
        class GracePeriod external;
    end

    subgraph BillingData [Subscription State DB]
        Plans[(Plans Limits Matrix)]
        Tenants[(Tenant Billing State)]
        
        Overage --> Tenants
        GracePeriod --> Tenants
        Gate -.-> |"Reads Max Limits"| Plans
        class Plans database;
        class Tenants database;
    end

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class BillingUI dualBox;
    class QuotaEngine dualBox;
    class StripeIntegration dualBox;
    class BillingData dualBox;
```

**[BACKEND]**
- Quota limiting services tracking precise daily and monthly volumetric outputs per tenant against defined tier maximums.
- Overage pricing intercept logic preventing hard-blocks while securely calculating micro-payments for excess bursts.
- Billing state watcher gracefully degrading system access rather than violently deleting instances upon payment failure.
- Auto-pause directives halting massive campaigns if quotas breach mid-flight.

**[FRONTEND]**
- Beautiful Plan & Usage page projecting consumption visuals natively via animated progress bars.
- Strategic warning banners displaying precisely at 80% usage and 100% capacity triggers.
- Blocking overlays actively freezing specific forms when quotas permanently prevent initiation.

---

## Phase 7.5 — Infrastructure & DevOps
**WHY:** Solidifies architectural foundations ensuring deployment stability, fault tolerance, and developer sanity.

### Phase 7.5 Architecture Flow

```mermaid
graph TD
    classDef infra fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef security fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef monitor fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef pipeline fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph ContainerOrchestration [Docker Deployment]
        Compose[docker-compose Framework]
        Nginx[Nginx Reverse Proxy]
        Services[FastAPI / Next.js / Worker Images]
        
        Compose --> Nginx
        Nginx --> Services
        class Compose infra;
        class Nginx infra;
        class Services infra;
    end

    subgraph CICDPipeline [Continuous Integration]
        GitHub[GitHub Actions]
        Tests[Test Suite & Linting Gate]
        Deploy[Auto-Build & Push to Prod]
        
        GitHub --> Tests
        Tests --> Deploy
        Deploy -.-> |"Reloads"| Compose
        class GitHub pipeline;
        class Tests pipeline;
        class Deploy pipeline;
    end

    subgraph SecurityDefense [Resilience & Stability]
        SSL[Let's Encrypt Auto-TLS]
        Idempotent[external_msg_id De-duper]
        RateLimit[Tenant API DDoS Limiter]
        
        SSL --> Nginx
        RateLimit --> Services
        Idempotent --> Services
        class SSL security;
        class Idempotent security;
        class RateLimit security;
    end

    subgraph ObservabilityLayer [DevOps Monitoring]
        Sentry[Sentry UI / API Crash Logs]
        ELK[Centralized Logs ELK/Loki]
        Backup[Daily pg_dump Backups + 30d]
        
        Services --> Sentry
        Services --> ELK
        Backup -.-> |"Secures"| Services
        class Sentry monitor;
        class ELK monitor;
        class Backup monitor;
    end

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class ContainerOrchestration dualBox;
    class CICDPipeline dualBox;
    class SecurityDefense dualBox;
    class ObservabilityLayer dualBox;
```

**[BACKEND]**
- Docker orchestration wrapping APIs, Frontend frameworks, Queues, and Caches synchronously.
- Nginx configuration restricting ports and terminating SSL properly.
- Strict API Rate limiter specifically keying on `tenant_id` to prevent single-tenant database DOS attacks.
- Background Job Status synchronization allowing decoupled UI systems to query asynchronous progression globally.
- Error interception hooks funneling unhandled exceptions directly into centralized monitoring stations (Sentry).

**[FRONTEND]**
- Stringent Content-Security-Policy responses blocking inline execution preventing cross-site scripting natively.
- UI Toasts dynamically connected to generic job endpoints simulating real-time progress for heavy tasks.

---

## Phase 8 — Account Settings & Administration
**WHY:** Enables self-serve technical configuration for tenants removing the need for manual support intervention.

### Phase 8 Architecture Flow

```mermaid
graph TD
    classDef frontend fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef logic fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef security fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph AdminUI [Tenant Settings Dashboard]
        APIView[API Key Generation UI]
        SenderView[Sender Email Setup]
        TeamView[Workspace Isolation Selector]
        
        APIView --> TeamView
        SenderView --> TeamView
        class APIView frontend;
        class SenderView frontend;
        class TeamView frontend;
    end

    subgraph ProvisionAPI [Administration Logic]
        OTP[Sender OTP Dispatcher]
        KeyGen[Cryptographic API Key Gen]
        AuthGate[Workspace RBAC Gate]
        
        SenderView --> |"Requests Verification"| OTP
        APIView --> |"Requests Secret"| KeyGen
        TeamView --> AuthGate
        class OTP logic;
        class KeyGen logic;
        class AuthGate logic;
    end

    subgraph SecurityHash [Secret Resolution Layer]
        Hasher[Bcrypt/Argon2 API Key Hasher]
        TokenCache[Temporary OTP Redis Cache]
        
        KeyGen --> |"Plaintext"| Hasher
        OTP <--> TokenCache
        class Hasher security;
        class TokenCache security;
    end

    subgraph ConfigData [Tenant State Configuration]
        Senders[(Verified Senders Table)]
        APIKeys[(Hashed API Keys Table)]
        Workspaces[(Team Isolation Boundaries)]
        
        Hasher --> APIKeys
        OTP --> |"Verifies"| Senders
        AuthGate -.-> Workspaces
        class Senders database;
        class APIKeys database;
        class Workspaces database;
    end

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class AdminUI dualBox;
    class ProvisionAPI dualBox;
    class SecurityHash dualBox;
    class ConfigData dualBox;
```

**[BACKEND]**
- Secure sender verification logic dispatching short-lived OTP tokens confirming access over custom sender addresses.
- API Key management infrastructure storing hashes rather than plain text.
- Team workspace isolation logic respecting `team` vs `agency` data boundary matrices.
- Fine-grained role evaluation checks separating Viewer, Operator, Manager, and Admin actions cleanly.

**[FRONTEND]**
- Organizational configuration sub-panels modifying required CAN-SPAM geographical details natively.
- Sender Identity Verification wizard visually explaining complex SPF/DKIM/DMARC DNS insertions succinctly.
- Member invitation flow rendering distinct role assignment dropdowns intuitively.
- Comprehensive API Dashboard detailing exact daily consumption and tracking rejection trends visually.

---

## Phase 9 — Security, Compliance & Deliverability Infrastructure
**WHY:** Ensures emails reach the inbox natively without landing in spam, maintaining strict data compliance and backup integrity.

### Phase 9 Architecture Flow

```mermaid
graph TD
    classDef infra fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef pipeline fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef monitor fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph ComplianceUI [Domain & Legal Dashboard]
        DNSView[DNS Setup Instructions <br> CNAME/TXT]
        IPView[Dedicated IP Assignment]
        ConsentView[Opt-in Consent Log Viewer]
        
        DNSView --> IPView
        class DNSView frontend;
        class IPView frontend;
        class ConsentView frontend;
    end

    subgraph InfrastructureLayer [Routing & Identity]
        DNSCRON[Automated DNS Verification CRON]
        IPRouter[Dedicated IP Allocation Engine]
        SNS[AWS SNS/SQS Bounce Queue]
        
        DNSView --> DNSCRON
        IPView --> IPRouter
        class DNSCRON infra;
        class IPRouter infra;
        class SNS infra;
    end

    subgraph DataProtection [Backup Automation]
        BackupCRON[Nightly pg_dump DB Extract]
        S3[AES-256 S3 Bucket Array]
        Lifecycle[30-Day Retention Policy]
        
        BackupCRON --> S3
        S3 --> Lifecycle
        class BackupCRON monitor;
        class S3 monitor;
        class Lifecycle monitor;
    end

    subgraph TrustData [Verification Datastores]
        Domains[(Verified Domains DB)]
        Consent[(Compliance/Consent Logs)]
        
        DNSCRON --> |"Approves DKIM/SPF"| Domains
        ConsentView <--> Consent
        IPRouter -.-> Domains
        SNS -.-> Consent
        class Domains database;
        class Consent database;
    end

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class ComplianceUI dualBox;
    class InfrastructureLayer dualBox;
    class DataProtection dualBox;
    class TrustData dualBox;
```

**[BACKEND]**
- Dedicated IP Allocation engine attaching isolated IPs per high-tier tenant.
- Automated DNS Verification CRON constantly scanning CNAME/TXT records for DMARC/SPF/DKIM validity.
- Bounce & Spam complaint SNS/SQS queue ingestion.
- Nightly `pg_dump` backups natively pushing AES-256 encrypted payloads to S3 with 30-day retention policies.

**[FRONTEND]**
- DNS Setup Instructions rendering exact copy-paste values for external providers natively.
- Dedicated IP health monitoring widget.
- GDPR Compliance / Opt-in consent log viewer.

---

## Phase 10 — Advanced Campaigns & Knowledge RAG Bot
**WHY:** Deep automation workflows and intelligence mechanisms dramatically optimizing open rates naturally.

### Phase 10 & 10.5 Architecture Flow (Advanced Campaigns & Deep RAG)

```mermaid
graph TD
    classDef frontend fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef ai fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef logic fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph IntelligenceUI [Advanced Tenant Interfaces]
        ChatWidget[Floating AI Chat Assistant]
        DripCanvas[Visual Drip Workflow Builder]
        ABSplit[A/B Variant Creation Matrix]
        
        ChatWidget --> DripCanvas
        ABSplit --> DripCanvas
        class ChatWidget frontend;
        class DripCanvas frontend;
        class ABSplit frontend;
    end

    subgraph DripEngine [Advanced Logic Core]
        StateMachine[Chronological Drip State Machine]
        STOptimizer[Send-Time Optimization Logic]
        WinnerBot[A/B Autonomous Winner Selector]
        
        DripCanvas --> StateMachine
        ABSplit --> WinnerBot
        StateMachine --> STOptimizer
        class StateMachine logic;
        class STOptimizer logic;
        class WinnerBot logic;
    end

    subgraph RAGOrchestration [AI Inference Pipeline]
        Langchain[LangChain / LlamaIndex Orchestrator]
        Embeddings[Realtime Embedding Model]
        ContextBuilder[Cosine Similarity Context Ingestion]
        
        ChatWidget --> |"Natural Language Ask"| Langchain
        Langchain <--> ContextBuilder
        Embeddings --> ContextBuilder
        class Langchain ai;
        class Embeddings ai;
        class ContextBuilder ai;
    end

    subgraph KnowledgeData [Vector Datastore]
        TenantSets[(Tenant Campaign Datasets)]
        pgvector[(pgvector / Pinecone <br> High-Dimensional Array)]
        
        WinnerBot -.-> |"Ingests Winners"| TenantSets
        TenantSets --> Embeddings
        ContextBuilder <--> pgvector
        class TenantSets database;
        class pgvector database;
    end

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class IntelligenceUI dualBox;
    class DripEngine dualBox;
    class RAGOrchestration dualBox;
    class KnowledgeData dualBox;
```

**[BACKEND]**
- Audience A/B split logic partitioning recipients evenly and identifying open-rate winners autonomously.
- Drip campaign orchestration routing logic based on predefined chronological state machines.
- Send-time optimization evaluating historical recipient logs and distributing emails perfectly to the exact peak individual window.
- **Knowledge RAG Bot Service**: Advanced Vector-Database connection (Retrieval-Augmented Generation) continuously indexing the tenant's exact successful templates, tone definitions, and audience responses mathematically.

**[FRONTEND]**
- Multi-variant A/B creation UI integrating directly inside the campaign builder cleanly.
- Visual canvas implementing drag-and-drop conditions creating Drip automated sequence flows.
- **Strategy Chatbot RAG Widget**: Sliding sidebar chatbot specifically contextualized on the tenant's data enabling advanced interrogations ("Write me a follow-up heavily replicating the absolute best subject line we utilized in Q2").
---

## Phase 10.5 — AI & Deep RAG Integration
**WHY:** Transforms the platform from a manual sending tool into an intelligent marketing assistant leveraging the tenant's own historical data.

**[BACKEND]**
- **Vector Database Provisioning**: Setup pgvector (or Pinecone) to store high-dimensional embeddings.
- **Data Ingestion Pipeline**: Asynchronously chunk and embed successful campaign HTML, subject lines, and send-time metrics every time a campaign completes.
- **Semantic Search API**: Endpoint taking natural language queries, embedding them, and performing cosine-similarity searches against the tenant's vector namespace.
- **LLM Orchestration Layer**: LangChain/LlamaIndex implementation processing retrieved context and generating grounded responses without hallucinations.

**[FRONTEND]**
- **Global AI Assistant Widget**: Floating chat module available across all pages maintaining conversation history.
- **Prompt Library UI**: Curated list of starter questions ("Analyze my last 3 campaigns", "Generate a segment for unengaged users").
- **Segment / Filter Generator**: Natural language input box on the Contacts page that auto-configures complex dropdown filters based on AI interpretation.
- **Deliverability Explainer Modal**: "Explain this" button next to raw SMTP bounce codes that opens an AI-generated, plain-English summary of the exact fix needed.

---

## Phase 11 — API & Integrations
**WHY:** Creates extreme extensibility via headless consumption and outgoing system webhooks.

### Phase 11 Architecture Flow

```mermaid
graph TD
    classDef frontend fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef api fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef external fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;

    subgraph PortalUI [External Integrator Facing]
        OpenAPI[Interactive Swagger OpenAPI Docs]
        WebhookUI[Event Subscription Manager]
        DevDash[API Consumption Dash]
        
        DevDash --> OpenAPI
        DevDash --> WebhookUI
        class OpenAPI frontend;
        class WebhookUI frontend;
        class DevDash frontend;
    end

    subgraph HeadlessAPI [Inbound Transactional API]
        RESTAPI[/v1/send Protected Endpoint/]
        PayloadValidation[JSON Schema Payload Validator]
        AuthCache[API Key Redis Validation]
        
        RESTAPI --> PayloadValidation
        RESTAPI --> AuthCache
        PayloadValidation --> |"Injects to RMQ"| DeliveryQueue
        class RESTAPI api;
        class PayloadValidation api;
        class AuthCache api;
    end

    subgraph WebhookDispatcher [Outbound Event Engine]
        EventTracker[Open / Bounce Listener]
        Retrier[Exponential Backoff Retrier]
        PayloadBuilder[System-to-Tenant Webhook Dispatcher]
        
        EventTracker --> PayloadBuilder
        PayloadBuilder -.-> |"Attempts Deliver"| Retrier
        class EventTracker api;
        class Retrier api;
        class PayloadBuilder api;
    end

    subgraph ExternalClients [Tenant Systems]
        CRM[External Hubspot / Salesforce]
        CustomApp[Tenant Custom Codebases]
        Endpoints[(Tenant Webhook Subscriptions)]
        
        HeadlessAPI <--> CustomApp
        PayloadBuilder --> |"HTTP POST"| CRM
        WebhookUI --> Endpoints
        class CRM external;
        class CustomApp external;
        class Endpoints database;
    end

    classDef dualBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class PortalUI dualBox;
    class HeadlessAPI dualBox;
    class WebhookDispatcher dualBox;
    class ExternalClients dualBox;
```

**[BACKEND]**
- Dedicated `/v1/send` REST API architecturally prioritizing transactional payload executions reliably.
- Webhook notification engine repeatedly attempting (via exponential backoff) to alert external tenant interfaces upon open/click/bounce milestones.

**[FRONTEND]**
- Developer portal natively hosting interactive OpenAPI documentation components cleanly.
- Webhook management interface facilitating specific event subscriptions visually.

---

## Phase 12 — Enterprise Domain Auto-Discovery (JIT Provisioning)
**WHY:** Reduces extreme onboarding friction for massive organizations via automatic corporate-domain correlation.

**[BACKEND]**
- JIT provisioning processor intercepting recognized corporate domains reliably.
- PDEP Filter aggressively blocking free providers (Gmail, Yahoo) from discovery mechanisms.
- VBD (Verification-Before-Disclosure) forcing OTP entry identically before confirming domain existence preventing reconnaissance.
- Active Directory SSO integrations via secure SAML/LDAP bridges mapping user roles reliably.

**[FRONTEND]**
- Custom waiting room interfaces reassuring unapproved employees cleanly.
- Governance Portal rendering direct approval matrices prioritizing swift IT Administrator workflow ingestion natively.

---

## Phase 13 — Scale & Microservices
**WHY:** Separating bounded contexts logically when extreme transaction volumes demand independent scaling axes natively.

**[BACKEND]**
- Complete decomposition partitioning Auth, Contacts, Delivery, Templates, and Analytics functionally across separated containers.
- Message bus replacements upgrading database-polling directly into Redis-backed asynchronous workers natively.
- Blacklist verification CRON continuously pinging MXToolbox API monitoring IP health perpetually.

**[FRONTEND]**
- Degraded-state conditional rendering preserving essential UI functionality even when sub-scale internal matrices disconnect slightly (e.g. allowing editing while analytics systems update).

---

## Notification Strategy

**In-App (Toast/Banner UI)**
- Campaign dispatched, Campaign paused, SMTP error warnings, Quota limit alerts, Daily list validations.

**System Emails (Sent via Centralized System Emailer)**
- Sender Identity OTPs, Campaign completion analytical summaries, Password resets, Payment failed alerts, Monthly usage recitals.

**System/Legal Emails (Appended internally to every dispatched campaign)**
- Clean un-subscription notifications natively respecting external click intercepts securely.
- Mandatory CAN-SPAM/GDPR entity address placements enforcing platform legality completely.

---

## Database Index Strategy (Critical for Scale)
- `contacts(tenant_id, email)` — Fast deduplication.
- `email_tasks(status, scheduled_at)` — Ultra-fast worker polling.
- `campaigns(tenant_id, status)` — Fast dashboard loading.
- `audit_logs(tenant_id, timestamp)` — Fast compliance fetching.
- `email_events(campaign_id, contact_id)` — Fast analytical aggregations.
- `sender_identities(verification_token)` — Secure fast-lookups during identity validation.
