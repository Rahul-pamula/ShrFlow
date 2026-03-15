# Phase 6 — Analytics & Engagement Tracking

> **Status: ⚠ Partially Complete**  
> **Last Reviewed:** March 15, 2026

## What exists in code today
- Tracking endpoints: `GET /track/open/{dispatch_id}` and `GET /track/click` log events into `email_events` and return a 1×1 GIF or redirect. Bot flagging is basic (UA fragments + a 2s click-after-open check).
- Worker injects tracking: adds pixel and wraps links in `platform/worker/email_sender.py`.
- Data model: `email_events` table with `is_bot` flag; indexes implied via Supabase `count` queries (not explicitly documented in migrations here).
- Aggregation API: `platform/api/routes/analytics.py` exposes campaign summary, recipient breakdown, and sender-health, excluding `is_bot=true`.
- Frontend: analytics pages are not wired; there is no `/campaigns/[id]/analytics` UI in the current repo snapshot.

## Gaps vs. plan
- No production-grade bot filtering (Apple MPP, Defender heuristics) and no honeypot links.
- Analytics UI is missing; data is not surfaced in the app.
- No partitioning/indices documented for `email_events`; potential perf risk at scale.
- Sender health is minimal (simple aggregates, no time windowing or thresholds).
- Tracking endpoints lack auth/signature or abuse protection beyond rate limits.

## Recommended next steps to complete Phase 6
1) Ship the analytics UI for campaigns (KPI cards + recipient table) and sender-health widget backed by existing APIs.
2) Add honeypot links and richer bot detection (Apple MPP, known proxy IP ranges, timing + UA).
3) Add DB indexes/partitioning guidance for `email_events` (`tenant_id`, `campaign_id`, `dispatch_id`, `event_type`, created_at).
4) Harden tracking endpoints: signed payload or HMAC on `dispatch_id`, tighter rate limits, optional IP/UA logging toggle.
5) Add timeframe filters to analytics APIs (e.g., last 30 days) and return bot vs. human counts separately.
