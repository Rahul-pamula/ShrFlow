# Phase 7 — Plan Enforcement (Current State)

> **Status: ⚠ Partially Complete**  
> **Last Reviewed:** March 15, 2026

## What exists today
- Quota check helper `check_can_send_campaign` in `platform/api/utils/billing.py` reads `plans` and `tenants.emails_sent_this_cycle` and blocks sends with HTTP 403 when a campaign would exceed the monthly plan limit.
- Daily send limit pre-check in `send_campaign` (per-tenant `daily_send_limit` / `daily_sent_count` with daily reset) and post-send counter increment.
- Rate limiting middleware (`utils/rate_limiter.py` + `slowapi`) wired in `platform/api/main.py`.

## What’s missing / gaps
- No billing/plan UI that surfaces current usage or lets users upgrade; the existing billing page described in earlier docs is not present in the repo.
- No real payments integration (Stripe/Razorpay); plan changes are manual DB edits.
- Plan metadata and migrations are not verified in this repo snapshot (no numbered plan-enforcement migration here); reliance on existing `plans` table may vary by environment.
- Daily limit can overshoot because it’s checked pre-flight only; audience is not capped by remaining quota.
- Notifications about 80% usage / quota hit are not implemented in the frontend; email notifications are not wired.

## Recommended steps to complete Phase 7
1) Surface usage + limits in UI: show monthly usage, daily remaining, and block sends with clear messaging when exceeded.
2) Cap audience by remaining daily quota or return a 429 with the exact remaining count.
3) Add Stripe/Razorpay-backed plan changes and persist plan limits from billing provider webhooks.
4) Add upgrade/billing page with plan comparison and “contact sales” fallback.
5) Add alerts: 80% threshold (banner + email), hard-block at 100%.

## Key file references
- Quota helper: `platform/api/utils/billing.py`
- Daily limit check: `platform/api/routes/campaigns.py` (send flow)
- Rate limiter: `platform/api/utils/rate_limiter.py`, `platform/api/main.py`
