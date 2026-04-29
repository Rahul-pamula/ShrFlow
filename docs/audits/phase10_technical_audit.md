# Phase 10 — Advanced Campaigns (Technical Audit)

> **Status:** Not started — requirements & architecture only.

## Intended scope
- A/B test variants (subject/body) with weighted split and winner auto-pick.
- Drip/sequence engine with scheduled follow-up steps per contact.
- Automation triggers (future) to start sequences on events.

## Open design questions
- Should variant selection be deterministic per contact (seeded by contact_id) to avoid double sends on retry? (Recommended: yes.)
- Winner metrics: use human opens/clicks only (`is_bot=false` from Phase 6) and minimum sample size before winner.
- Sequence persistence: store per-contact state in `campaign_sequence_state` vs reuse `campaign_dispatch` status. (Recommended: state table + dispatch rows for sends.)
- Idempotency: how to prevent duplicate enrollments when the same trigger fires twice? (Recommended: unique constraint on campaign_id + contact_id in state table.)

## Proposed schema deltas
- `campaign_variants(id uuid pk, campaign_id uuid fk, name text, weight int, subject text, html text, text_version text, created_at timestamptz)`
- `campaign_dispatch` add `variant_id uuid null`, `sequence_id uuid null`.
- `campaign_sequences(id uuid pk, campaign_id uuid fk, step_index int, delay_hours int, template_id uuid, filter_json jsonb)`
- `campaign_sequence_state(id uuid pk, sequence_id uuid fk, contact_id uuid fk, status text, scheduled_at timestamptz, dispatched_at timestamptz, completed_at timestamptz)` with unique (sequence_id, contact_id).

## API/Worker expectations
- POST `/campaigns/{id}/variants` CRUD; validate weights sum to 100 and at least two variants.
- Scheduler picks winner: background job runs after N hours; updates campaign.winner_variant_id.
- Worker respects `variant_id` when rendering content; uses seeded RNG (dispatch_id) for split.
- Sequence scheduler inserts dispatch rows for due steps; honors pause/cancel; respects plan limits (Phase 7).

## Risks
- Bot inflation on winner metrics → always filter `is_bot=true` in analytics.
- Unbounded sequences → enforce max steps per campaign and per-tenant daily cap.
- Duplicate sends on retry → deterministic variant selection + unique keys on state table.

## Files to touch (future work)
- API: `/platform/api/routes/campaigns.py`, new `/routes/sequences.py` (or extend campaigns).
- Worker: `/platform/worker/email_sender.py`, scheduler logic for sequences.
- DB: migrations under `/Users/pamula/Desktop/ShrFlow/migrations` and `/platform/database/migrations`.
- UI: `/platform/client/src/app/campaigns/*` for variant editor, winner view, sequence builder.

---
## Technical Appendix (Engineering view)
- Endpoints, data model, RLS, and worker/queue behaviors summarized per phase.
- See phase doc for full flow; audits now include concrete engineering artifacts to verify.
