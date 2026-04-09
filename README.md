# 📧 Sh_R_Mail — Enterprise Email Engine

> A high-performance, self-hosted, multi-tenant email marketing platform.  
> Built strictly on modern containerized architecture: **FastAPI · Next.js · RabbitMQ · AWS SES · Supabase · Docker**.

---

## 📊 Live Project Tracker

Instead of a static list, here is our live architectural flow and completion status for Phase 1 of the Sh_R_Mail platform:

```mermaid
pie title Platform MVP Completion Status
    "Core Infrastructure & Dockerization" : 85
    "NextJS Frontend UI & Templates" : 70
    "FastAPI & Background Workers" : 80
    "AWS SES / SMTP Integrations" : 90
    "Pending Security Hardening" : 30
    "Stripe Payments & Quotas" : 10
```

*We are heavily focused on MVP hardening. Not all features are 100% complete yet, but the core pipeline is fully operational.*

---

## 🏗 Architecture & Design Documents

Sh_R_Mail uses a complex asynchronous dual-pipeline architecture. Instead of cluttering the README, all technical deep-dives, RAG design patterns, and network graphs are strictly maintained in our dedicated documentation directory:

*   📘 **[Complete Architectural Overview (with diagrams)](docs/phases/shrmail_architecture.md)**
*   📋 **[Phase-by-Phase Roadmap & Execution Plan](docs/phases/phase_wise_plan.md)**

---

## 🚀 Guided Setup

We have completely deprecated manual OS installations (Windows/Mac/Linux) and multi-terminal setups. **The entire platform is strictly containerized.** 

### Step 1 — System Prerequisites
You only need exactly two things installed on your computer to run this entire platform:
1.  **Git** (To clone the repository) -> [Install Git](https://git-scm.com/downloads)
2.  **Docker Desktop** (To run the orchestrator) -> [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Step 2 — Clone the Repository
```bash
git clone <your-repo-url>
cd Sh_R_Mail
```

### Step 3 — Environment Variables
Duplicate the `.env.example` file and rename it to `.env` in the root folder. You must carefully configure every single variable below for the workers and API to function.

```env
# ── 1. Database (Supabase) ──────────────────────────────────
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres.xxx:xxx@aws...

# ── 2. Message Queue (RabbitMQ) ─────────────────────────────
RABBITMQ_URL=amqps://user:pass@host.cloudamqp.com/vhost

# ── 3. Tenant Email Dispatch (AWS SES) ──────────────────────
SMTP_HOST=email-smtp.ap-southeast-2.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your_ses_username
SMTP_PASSWORD=your_ses_password
SMTP_FROM_EMAIL=shrmail.app@gmail.com
SMTP_FROM_NAME=Email Engine

# ── 4. Centralized System Mailer (Gmail) ────────────────────
SYSTEM_SMTP_HOST=smtp.gmail.com
SYSTEM_SMTP_PORT=587
SYSTEM_SMTP_USERNAME=shrmail.app@gmail.com
SYSTEM_SMTP_PASSWORD=your_google_app_password
SYSTEM_SMTP_FROM_EMAIL=shrmail.app@gmail.com
SYSTEM_SMTP_FROM_NAME=Email Engine

# ── 5. Authentication (Clerk & Next-Auth / Custom JWT) ──────
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxx
JWT_SECRET_KEY=generate_a_long_hex_string_here

# ── 6. OAuth Providers ────────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# ── 7. Caching & Storage (Redis) ──────────────────────────────
REDIS_URL=rediss://default:xxxx@upstash.io:6379

# ── 8. Tracking API (Supabase Edge Functions) ─────────────────
API_URL=https://xxxxxxxx.supabase.co/functions/v1
TRACKING_SECRET=secure_hmac_tracking_secret

# ── 9. Direct AWS Access ──────────────────────────────────────
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-southeast-2

# ── 10. Core App Settings ─────────────────────────────────────
DEBUG=True
ENVIRONMENT=development
TRACE_ID_HEADER=X-Trace-ID
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=http://localhost:3000
CAPTCHA_ENABLED=false
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
```

### Step 4 — Run the Docker Cluster
Because everything is containerized, you just spin up your Docker Desktop application and run one command to orchestrate the Frontend, FastAPI backend, and all 4 Python background workers effortlessly.

🚨 **Detailed Docker Guide:** Please read our dedicated file: **[docs/docker_notes.md](docs/docker_notes.md)** for exact operational instructions, live log streaming, and troubleshooting commands!

```bash
docker-compose up -d
```
*That's it. Never run local terminals again!*
