# Phase 5 — Delivery Engine: Current Technical Audit (Partial)

## Reality vs. Plan
- **Send pipeline exists**: campaign snapshot + dispatch enqueue + worker claim/sent status. Real SMTP/SES send when creds present; simulated otherwise.
- **Compliance hooks present**: unsubscribe footer injection, HMAC token verification, unsubscribe/resubscribe pages, suppression in audience builder.
- **New tracking hooks**: pixel + click wrapping implemented (observability still Phase 6).
- **Bounce/Spam handling**: webhook endpoints update contact status; worker also marks bounced on any exception.
- **Daily limit**: pre-flight check and counter increment exist.

## Issues found
- **Webhook auth missing**: `/webhooks/bounce|/spam|/ses` accept unsigned requests. Anyone can suppress contacts.
- **Over-bounce risk**: worker marks contact `bounced` on any exception (including DB/network). Needs SMTP/SES error classification + retries for transient errors.
- **Daily limit overshoot**: check is pre-flight only; audience is not capped by remaining quota, so a single send can exceed the limit.
- **Mid-send suppression gap**: worker does not re-check `contacts.status`; unsubscribes that happen after enqueue can still be sent.
- **Physical address hardcoded**: footer uses a static address; not tenant-configurable.
- **Resubscribe endpoint open**: unauthenticated `POST /resubscribe` lets anyone re-activate an email.
- **SES region/sandbox assumptions**: failures surface as SMTP errors; no UI surfaced guidance when SES is in sandbox (all recipients must be verified).

## Recommended fixes
1) Add signature verification for SES SNS and provider webhooks; reject unsigned posts.
2) Classify worker send failures: bounce only on permanent 5xx; requeue or retry transient errors; do not suppress on DB/Redis timeouts.
3) Cap send by remaining daily quota and return helpful 429 if audience > remaining.
4) Worker suppression re-check before SMTP send; skip dispatch if contact is now unsubscribed/bounced.
5) Tenant-level footer address; require value in production.
6) Protect `POST /resubscribe` (email + token/OTP or signed link).
7) Surface SES sandbox/region status in campaign UI to explain “address not verified” failures.

## File pointers
- `platform/api/routes/campaigns.py` — send flow, daily limit, audience building
- `platform/api/services/campaign_dispatch_service.py` — audience filter, dispatch builder
- `platform/worker/email_sender.py` — worker lifecycle, footer/tracking injection, error handling
- `platform/api/routes/webhooks.py` — bounce/spam/ses handlers
- `platform/api/routes/unsubscribe.py` — unsubscribe/resubscribe endpoints
- `platform/client/src/app/unsubscribe/page.tsx` — unsubscribe UI
