# ShrFlow (Email Engine) — Complete Architectural Overview

This document serves as the high-level, definitive blueprint of the entire ShrFlow infrastructure. It synthesizes all technical decisions spanning Frontend UX, Backend microservices, Asynchronous Message Queues, Data Stores, API gateways, Artificial Intelligence (RAG), and dual SMTP Delivery pipelines into a single cohesive ecosystem.

---

## 🏗 The Complete Platform Architecture

The architecture below illustrates how data flows from the Tenant (User Interface) down through the various application tiers, all the way to explicit email dispatch and open/click analytical feedback loops.

*(You can view this diagram natively in any Markdown previewer that supports Mermaid.js)*

```mermaid
graph TD
    classDef frontend fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef gateway fill:#0f172a,stroke:#334155,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef microservice fill:#059669,stroke:#047857,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef ai fill:#7c3aed,stroke:#5b21b6,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef queue fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef database fill:#475569,stroke:#334155,stroke-width:2px,color:#fff,rx:10px,ry:10px;
    classDef delivery fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#fff,font-weight:bold,rx:5px,ry:5px;
    classDef client fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,font-weight:bold,rx:10px,ry:10px;

    %% FRONTEND LAYER
    subgraph FrontendLayer [Frontend & UI Layer]
        UI_Dash[Web Dashboard / Core UX]
        UI_Builder[Template Canvas & MJML Builder]
        UI_AI[Global AI Assistant Widget]
    end
    class UI_Dash frontend;
    class UI_Builder frontend;
    class UI_AI frontend;

    %% EXTERNAL TRAFFIC
    Tenant([Platform Tenant/User]) --> |HTTPS/WSS| Nginx[Nginx API Gateway / Load Balancer]
    ExternalAPI([External Webhooks & CRM Integration]) --> |REST| Nginx
    class Tenant client;
    class ExternalAPI client;
    class Nginx gateway;
    
    Nginx --> UI_Dash
    Nginx --> UI_Builder
    Nginx --> UI_AI

    %% BACKEND CORE MICROSERVICES
    subgraph Microservices [Backend Microservice Layer]
        API_Auth[Auth, Tenancy & Security API]
        API_Contact[Contacts Ingestion Engine]
        API_Campaign[Campaign Orchestrator]
        API_Analytics[Tracking & Analytics Engine]
    end
    class API_Auth microservice;
    class API_Contact microservice;
    class API_Campaign microservice;
    class API_Analytics microservice;
    
    UI_Dash --> |REST / JWT| API_Auth
    UI_Dash --> API_Campaign
    UI_Builder --> API_Campaign
    ExternalAPI --> API_Contact

    %% ARTIFICIAL INTELLIGENCE LAYER
    subgraph ArtificialIntelligence [AI & Deep RAG Integration]
        AI_Orchestrator[LangChain/LlamaIndex LLM Proxy]
        AI_Embed[Semantic Embedding Pipeline]
        UI_AI --> |NL Prompts| AI_Orchestrator
        API_Campaign -.->|Completed Templates| AI_Embed
    end
    class AI_Orchestrator ai;
    class AI_Embed ai;

    %% DATABASES & CACHE
    subgraph DataStorage [Persistent Storage & Caches]
        DB_Postgres[(PostgreSQL: Core Relational DB)]
        DB_Vector[(PgVector/Pinecone: Neural Embeddings)]
        Cache_Redis[(Redis: Real-time PubSub / Sessions)]
        
        API_Auth --> DB_Postgres
        API_Contact --> DB_Postgres
        API_Analytics --> DB_Postgres
        API_Campaign --> Cache_Redis
        
        AI_Orchestrator <--> DB_Vector
        AI_Embed --> DB_Vector
    end
    class DB_Postgres database;
    class DB_Vector database;
    class Cache_Redis database;

    %% QUEUING & ASYNC WORKERS
    subgraph AsyncOrchestration [Message Brokers & Async Workers]
        MQ_Rabbit[(RabbitMQ Message Broker)]
        Worker_CSV[CSV/XLSX Ingestion Worker]
        Worker_Heatmap[Click/Heatmap Aggregator Job]
        
        API_Contact --> |"Gigabyte File Chunks"| MQ_Rabbit
        MQ_Rabbit --> Worker_CSV
        Worker_CSV --> DB_Postgres
        
        API_Analytics --> |"Batch Events"| MQ_Rabbit
        MQ_Rabbit --> Worker_Heatmap
        Worker_Heatmap --> DB_Postgres
    end
    class MQ_Rabbit queue;
    class Worker_CSV queue;
    class Worker_Heatmap queue;

    %% CRITICAL ARCHITECTURE: DUAL EMAIL ENGINE
    subgraph DualDeliveryEngine [Dual Email Engine Pipelines]
        Queue_System[(System Priority Queue)]
        Queue_Tenant[(Tenant Dispatch Queue)]
        
        API_Auth --> |"OTPs, Invites"| Queue_System
        API_Campaign --> |"Bulk Newsletters"| Queue_Tenant
        
        Worker_System[System Mail Dispatcher]
        Worker_Tenant[Campaign Mail Dispatcher]
        
        Queue_System --> Worker_System
        Queue_Tenant --> Worker_Tenant
        
        SMTP_Gmail[Gmail Core SMTP]
        SMTP_SES[AWS SES Transact API]
        
        Worker_System --> |"shrmail.app@gmail.com"| SMTP_Gmail
        Worker_Tenant --> |"sales@tenantdomain.com"| SMTP_SES
    end
    class Queue_System queue;
    class Queue_Tenant queue;
    class Worker_System delivery;
    class Worker_Tenant delivery;
    class SMTP_Gmail delivery;
    class SMTP_SES delivery;

    %% RECIPIENT & OBSERVABILITY
    Subscriber([End Recipient / Inbox])
    SMTP_Gmail --> |"Guaranteed Inbox"| Subscriber
    SMTP_SES --> |"Isolated Reputation"| Subscriber
    class Subscriber client;
    
    %% Analytics Feedback Loop
    Subscriber -.-> |"1x1 Pixel Open / Link Clicks"| Nginx
    
    %% Bounding Box Styles
    classDef boundedBox fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,stroke-dasharray: 4 4;
    class Microservices boundedBox;
    class DataStorage boundedBox;
    class AsyncOrchestration boundedBox;
    class DualDeliveryEngine boundedBox;
    class ArtificialIntelligence boundedBox;
```

---

## Technical Summaries of Key Layers

### 1. The Gateway & Frontend
*   **The Hub:** All external user traffic, integrations, and webhook injections hit the heavily protected **Nginx API Gateway**, which enforces strict Rate Limiting (`tenant_id` based blocks prevent single-app flooding) and terminates SSL layers.
*   **User interfaces:** Contains robust React components including the Drag-and-Drop MJML Editor and multi-step Wizards.

### 2. Backend Microservice Layer
*   To enable "Phase 13 – Massive Scale," responsibilities are split:
    *   **Auth & Tenancy:** Validates JWTs, handles SAML/Active Directory (JIT) provisioning, establishes domain ownership, and tracks Role checks.
    *   **Contacts Engine:** High-performance REST ingest points. Validates malformed emails instantly.
    *   **Analytics Engine:** High-velocity endpoint designed specifically to rapidly ingest `1x1 image pixel` Open requests and catch Click engagements without ever lagging. 

### 3. Asynchronous Orchestration (RabbitMQ & Redis)
*   **RabbitMQ:** Crucial for the platform not timing out. Instead of failing when 50,000 users are imported, the file is dumped onto RabbitMQ, and the **CSV Ingestion Worker** streams it into Postgres quietly in the background.
*   **Failed Deliveries:** Handles soft-bounces with automated exponential retries. Redlines hard-bounces immediately to the "Dead Letter Queue".

### 4. Persistent Storage (PostgreSQL & PgVector)
*   **Postgres:** Primary source of truth. Highly indexed utilizing structures like `email_tasks(status, scheduled_at)` for millisecond query times.
*   **PgVector / Pinecone:** Powers Phase 10.5. Once an email is sent successfully, its contents are chunked, embedded via AI neural networks, and saved sequentially.

### 5. Artificial Intelligence (RAG Integration)
*   The **AI Orchestrator** reads user prompts ("Analyze our best subjects this month"), queries the **PgVector database** to retrieve historical tenant data, embeds that data alongside the prompt (RAG pattern), and returns absolutely hallucination-free, factual platform advice.

### 6. The Dual Delivery Engine (The Heart)
*   The ultimate protection layer guaranteeing survival. 
*   **System Mails** (password resets, quota warnings) bypass all complexity and queue straight into Gmail environments ensuring inbox placement regardless of external server blacklisting events.
*   **Campaign Mails** (large scale promotional sending) flow to the tenant's exact Verified Domain over AWS SES to completely quarantine sender reputation and ensure absolute volume scalability. 
*   **Analytics Loopback:** Every click an End Subscriber takes dynamically routes back directly into the API Analytics Engine, feeding the Heatmap worker loop. 

---
