# Phase 8 — Account Settings & Administration (Technical Audit)

> **Status:** ⚠ Partially Complete — core settings, compliance, and developer tools exist; team management and webhook config are pending.

## Reality Check
- ✅ Settings landing, Profile, Organization pages present and RLS-scoped.
- ✅ GDPR flows: contact anonymize + full data export (CSV) available.
- ✅ Compliance checklist page accessible.
- ✅ Developer/Deliverability: API key CRUD (SHA-256 hash stored), domain verification UI, sender verification (OTP) and REST endpoints.
- ⚠ Team Management UI/roles absent (scheduled Phase 11).
- ⚠ Webhooks config UI absent (scheduled Phase 11).
- ❓ Audit logging coverage across settings mutations not yet reviewed.

## Gaps / Recommendations
1) **Team Management (blocker for “complete”):** add `teams` / `team_members` tables, invite flow, role-based policies (owner/admin/member) and UI under `/settings/team`.
2) **Webhook Config:** UI + API to save target URL + selected events; sign outgoing webhooks with per-tenant HMAC secret; surface recent delivery logs.
3) **Audit Trails:** log changes for domains, senders, API keys, exports, and deletes into `audit_logs` with actor + timestamp; expose viewer in settings.
4) **Rate Limits:** protect OTP requests, API-key issuance, and export endpoints with per-tenant rate limiting to prevent abuse.
5) **Permissions Hardening:** ensure RLS policies on domains/senders/api_keys include `tenant_id = auth.uid_tenant` checks; add owner-only actions for destructive ops; ensure soft-delete uses `deleted_at`.

## Suggested Acceptance Tests
- Create/edit profile + org info and verify values persist and are isolated by tenant.
- Run data export → file delivered, audit log entry created, job state recorded.
- Add domain → DNS instructions rendered → verify flow flips status to verified.
- Add sender → OTP email sent → verify completes → attempt campaign send with unverified sender must fail.
- Create API key → token shown once → subsequent fetch returns hashed metadata only.
- Negative tests: rate limit OTP spam, deny cross-tenant access via RLS, ensure unauthenticated access blocked; soft-deleted keys/senders/domains hidden from lists.

## File Pointers
- Settings pages: `/Users/pamula/Desktop/ShrFlow/platform/client/src/app/settings/*`
- Deliverability: `/Users/pamula/Desktop/ShrFlow/platform/api/routes/senders.py`, `/domains.py`
- Compliance: `/Users/pamula/Desktop/ShrFlow/platform/api/routes/compliance.py`
- API keys: `/Users/pamula/Desktop/ShrFlow/platform/api/routes/api_keys.py`
- RLS policies: Supabase SQL files under `/Users/pamula/Desktop/ShrFlow/platform/database` (verify tenant-scoped policies for domains/senders/api_keys).

---
## Technical Appendix (Engineering view)
- Endpoints, data model, RLS, and worker/queue behaviors summarized per phase.
- See phase doc for full flow; audits now include concrete engineering artifacts to verify.
