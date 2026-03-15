# Phase 7 — Plan Enforcement (& 7.5 Infra): Current Audit (Partial)

## Reality check
- `check_can_send_campaign` exists and blocks sends if monthly plan limit would be exceeded, using `plans` + `emails_sent_this_cycle`.
- Daily send limit pre-check in `send_campaign` with daily counter reset and post-send increment.
- Rate limiter (`slowapi` + Redis) is wired in `platform/api/main.py`.
- There is no billing/plan UI in the repo; no Stripe/Razorpay integration; plan changes are manual DB edits.
- No verified plan-enforcement migrations are present in this repo snapshot (numbered SQL files referenced in old docs aren’t here).
- No upgrade CTA or quota banner in the current wizard/dashboard code.
- Daily limit can overshoot because it does not cap audience by remaining quota.

## Gaps / risks
- Missing billing UI + payments flow.
- Missing 80%/100% quota alerts (UI or email).
- Plan metadata/migrations not present; environments may differ.
- No concurrency guard on monthly counters; race conditions possible under concurrent sends.

## Recommended next steps
1) Add UI for usage + plan limits, with block messaging when exceeded.
2) Cap sends by remaining daily quota or return an exact-remaining 429.
3) Add Stripe/Razorpay integration and webhooks to set plan/limits.
4) Add 80% warning + hard block at 100% (banner + email).
5) Ensure plan/tenant schema migrations are present and consistent across environments.

## File pointers
- Quota helper: `platform/api/utils/billing.py`
- Daily limit logic: `platform/api/routes/campaigns.py` (send flow)
- Rate limiter: `platform/api/utils/rate_limiter.py`, `platform/api/main.py`
