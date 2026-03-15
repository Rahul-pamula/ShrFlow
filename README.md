# 📧 Sh_R_Mail (Email Engine)

A self-hosted email marketing and campaign management platform — built for internal use to manage contacts, create email templates, run campaigns, and track delivery analytics.

> **Status:** Active Development — MVP ready for internal testing.

### 🛡️ Email Compliance & AWS SES
* **How emails are obtained:** Emails are collected strictly through internal university/student opt-ins and manually imported. We do not use bought, scraped, or third-party mailing lists.
* **Bounce & Complaint Handling:** The platform is designed to process Amazon SES notifications. Bounces and complaints are logged, and those contacts are automatically removed from active mailing lists to maintain a high sender reputation.

---

## What It Does

| Feature | Status |
|---|---|
| Multi-tenant auth (Clerk + RLS) | ✅ Live |
| Contact management (CSV import, segments) | ✅ Live |
| Email templates (35+ presets) | ✅ Live |
| Campaign creation + send | ✅ Live |
| Background email delivery (SMTP) | ✅ Live |
| Open/click tracking | 🔧 In progress |
| Plan enforcement + quotas | 📋 Planned |
| Stripe payments | 📋 Planned |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend API** | FastAPI (Python) |
| **Email Worker** | Python background service |
| **Database** | Supabase (PostgreSQL + RLS) |
| **Auth** | Clerk (JWT, multi-tenant) |
| **Email Sending** | Amazon SES (SMTP) |
| **Storage** | Supabase Storage (images, assets) |
| **Containerization** | Docker + Docker Compose |
| **Reverse Proxy** | Nginx |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                   Nginx                       │
│  /api/* → FastAPI    /* → Next.js            │
└───────────────┬──────────────────────────────┘
                │
     ┌──────────┴──────────┐
     │                     │
┌────▼─────┐        ┌──────▼──────┐
│ FastAPI  │        │  Next.js    │
│ :8000    │        │  :3000      │
└────┬─────┘        └─────────────┘
     │
     │   (writes tasks to email_tasks table)
     │
┌────▼──────────┐        ┌─────────────────┐
│  Email Worker │        │   Supabase DB   │
│  (Python)     │◄──────►│   (PostgreSQL)  │
│  Polls DB     │        │   + RLS         │
└───────────────┘        └─────────────────┘
                                │
                         ┌──────▼──────┐
                         │ Amazon SES  │
                         │ (SMTP send) │
                         └─────────────┘
```

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- `.env` file with credentials

### 1. First Time Setup

Copy the environment file and fill in your credentials:
```bash
git clone <repo-url>
cd Sh_R_Mail
cp .env.example .env
```

Install backend dependencies:
```bash
cd platform/api
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

Install frontend dependencies:
```bash
cd ../client
npm install
cd ../..
```

### 2. Start All Services
From the root directory, run the helper script:
```bash
./start.sh
```
This automatically handles port cleanup and starts:
| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main application UI |
| Backend API | http://localhost:8000 | REST API |
| API Docs | http://localhost:8000/docs | Interactive API documentation |

### 3. Stop All Services
```bash
./stop.sh
```

### 4. Need to Reset?
```bash
./stop.sh && rm -rf logs/ && ./start.sh
```

---

## Viewing Logs

If using the helper scripts (`start.sh`), logs are output to the `logs/` directory:
```bash
tail -f logs/api.log       # API logs
tail -f logs/worker.log    # Worker logs
tail -f logs/frontend.log  # Frontend logs
tail -f logs/*.log         # All at once
```

---

## Environment Variables

Your `.env` file should look like this:

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk Auth
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# SMTP (Amazon SES)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-user
SMTP_PASS=your-ses-smtp-password
SMTP_FROM=noreply@yourdomain.com

# App
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Docker Deployment (Production)

### Run with Docker:
```bash
docker-compose up -d --build
```
Log viewing:
```bash
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f client
```
Stop services:
```bash
docker-compose down
```

---

## Database & Structure

- Hosted on **Supabase** (PostgreSQL) with RLS enforced.
- Migrations in `platform/database/migrations/` (or `scripts/`).

**How Email Sending Works:**
1. Tenant creates a Campaign.
2. Clicks "Send" → API snapshots HTML + recipients → inserts `email_tasks` rows.
3. Background Worker polls `email_tasks` every 5 seconds.
4. Worker sends each email via Amazon SES SMTP.
5. On failure: retries up to 3 times with backoff. Status updated in real-time.

---

## Roadmap & Progress Tracker

Full text roadmap is in `docs/phase_wise_plan.md`.

🔥 **Interactive Tracker:** 
You can track real-time execution progress using the standalone UI tracker! Just double-click `docs/progress.html` in your file browser to open the interactive Phase Dashboard.

---

## Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes + write tests
3. Open a Pull Request → Tech Lead reviews
4. Merge after approval + CI passes

---

*Built with ❤️ — Sh_R_Mail v1.0*
