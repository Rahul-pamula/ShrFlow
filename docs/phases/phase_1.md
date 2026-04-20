# Phase 1 - Foundation, Authentication, Tenant Identity, and Onboarding

> Status: Mostly complete, with architectural audit findings ✅  
> Verified against code: 2026-03-15 (Technical Audit Performed)  
> Scope: auth routes, JWT middleware, onboarding routes, frontend auth state, onboarding UI, and route guards

---

### Purpose

Phase 1 establishes the application foundation that every later feature depends on:

- user identity
- tenant identity
- login and signup flows
- onboarding state
- route protection
- workspace-aware frontend session state

This phase is the line between a static frontend and a tenant-aware SaaS product.

---

## Verified Architecture

Phase 1 is implemented with a custom authentication and tenant foundation. It is not using Supabase Auth as the primary auth engine.

### Core stack in use

- FastAPI
- PostgreSQL through Supabase
- Supabase Python client with `SERVICE_ROLE_KEY`
- custom `bcrypt` password hashing
- custom JWTs signed with `HS256`
- Next.js frontend auth context
- cookie plus localStorage session persistence

### Main backend files

- `platform/api/routes/auth.py`
- `platform/api/routes/onboarding.py`
- `platform/api/routes/password_reset.py`
- `platform/api/utils/jwt_middleware.py`
- `platform/api/utils/supabase_client.py`
- `migrations/002_progressive_onboarding.sql`
- `migrations/021_onboarding_field_extensions.sql`
- `migrations/022_campaign_runtime_alignment.sql`
- `migrations/manual_apply_latest_runtime_sync.sql`

### Main frontend files

- `platform/client/src/context/AuthContext.tsx`
- `platform/client/src/middleware.ts`
- `platform/client/src/app/login/page.tsx`
- `platform/client/src/app/signup/page.tsx`
- `platform/client/src/app/onboarding/*`
- `platform/client/src/app/dashboard/page.tsx`

---

## Real Phase 1 Flow

### Account creation flow

The current signup flow is:

1. user submits email, password, full name, and optionally tenant name
2. backend checks `users.email` uniqueness
3. password is hashed with `bcrypt`
4. user row is created in `users`
5. one of three tenant paths is selected:
   - invited flow: placeholder tenant context, status `pending_join`
   - JIT enterprise domain flow: create `join_requests` entry for verified enterprise domain
   - normal owner flow: create tenant with status `onboarding`
6. owner users are linked through `tenant_users`
7. onboarding tracker row is created for normal owner flow
8. JWT is issued with `user_id`, `tenant_id`, `email`, `role`
9. email verification token is generated and verification email is sent

### Login flow

The current login flow is:

1. user lookup by email
2. password verification with `bcrypt`
3. `is_active` check
4. primary tenant selection from `tenant_users` ordered by `joined_at`
5. if no tenant membership exists, fallback to `join_requests` or `team_invitations`
6. tenant status lookup
7. JWT issuance
8. tenant status returned to frontend

### Frontend session flow

The frontend stores session state in:

- `localStorage` for `auth_token` and `user_data`
- cookies for `auth_token` and `tenant_status`

This allows:

- React auth state on the client
- Next.js middleware redirects based on cookies
- onboarding and waiting-room redirects after login

### Onboarding flow

The active onboarding UI is a 4-step wizard:

1. workspace
2. use case
3. integrations
4. scale
5. completion screen triggers tenant activation

There is also legacy onboarding support still present in the backend:

- `basic-info`
- `compliance`
- `intent`
- `status`

This means Phase 1 currently contains both:

- a newer 4-step product onboarding flow
- an older progressive onboarding API model kept for compatibility

---

## Implemented Foundation Areas

### 1. Authentication is implemented

Implemented:

- email and password signup
- email and password login
- `bcrypt` password hashing
- JWT creation and verification
- OAuth entry points for Google and GitHub
- email verification token generation
- password reset routes exist
- workspace switching for multi-tenant users

Important clarification:

This is custom auth built on the project database. It is not Supabase Auth in the way the old docs describe it.

### 2. Tenant identity is implemented

Implemented:

- `users` table
- `tenants` table
- `tenant_users` junction table
- `onboarding_progress` table
- tenant-aware JWT payload
- role capture through `tenant_users.role`
- primary-tenant selection at login
- pending-join state for enterprise JIT and invitations

### 3. Onboarding foundation is implemented

Implemented:

- backend onboarding write endpoints
- tenant status progression from `onboarding` to `active`
- frontend onboarding wizard screens
- frontend completion screen activating tenant
- dashboard onboarding checklist experience
- ordered top-level onboarding migration coverage for current tenant fields

### 4. Frontend route protection is implemented

Implemented:

- auth context redirects
- middleware redirects for protected routes
- onboarding redirect handling
- waiting-room redirect handling
- auth-page redirect-away handling for authenticated users

### 5. Migration story is now more accurate

The repository now has an ordered top-level migration path for the current Phase 1 schema, instead of relying only on the older platform migration directory and ad hoc SQL.

Important current files:

- `migrations/002_progressive_onboarding.sql`
- `migrations/021_onboarding_field_extensions.sql`
- `migrations/022_campaign_runtime_alignment.sql`
- `migrations/manual_apply_latest_runtime_sync.sql`

---

## Design And Security Model

### Auth model

Current model:

- backend signs JWT with shared secret
- frontend stores token locally and mirrors it into cookies
- backend dependencies extract tenant identity from JWT

### Tenant isolation model

Current isolation is enforced mainly through:

- JWT tenant claims
- dependency-based tenant validation
- explicit tenant filters in application queries
- optional `X-Tenant-ID` header validation against JWT

### Onboarding state model

The codebase follows this rule:

- `tenants.status` is the authoritative source of truth
- `onboarding_progress` is legacy or UX support data

This is the correct architectural rule and matches the migration notes in the repository.

---

## What Is Complete

### Backend

- custom email/password authentication
- JWT generation and verification
- tenant creation at signup
- tenant membership model
- onboarding routes
- active-tenant guard dependency
- workspace switching
- email verification route family
- password reset route family exists
- ordered top-level onboarding migrations now exist

### Frontend

- login page
- signup page
- auth context
- onboarding wizard UI
- onboarding completion screen
- dashboard onboarding checklist
- sidebar layout
- middleware-based redirects

---

## What Is Not Fully Complete

Phase 1 is not perfectly clean or fully aligned yet. The biggest issues are architectural consistency and documentation accuracy.

### 1. The old docs misstate the auth architecture

Not accurate anymore:

- "Supabase Auth" as the primary auth system
- "Application-enforced isolation" as the active security layer

Actual architecture:

- custom auth tables
- custom `bcrypt` hashing
- custom JWTs
- Supabase service-role database access

---

## Technical Audit Summary

Phase 1 underwent a formal technical audit on 2026-03-15.

### Audit Findings

- **Auth Foundation**: Confirmed custom authentication using `bcrypt` and `HS256` JWTs. The system is broader than initially documented, including password reset and social login hooks (Phase 1.5 work found in Phase 1).
- **Tenant Isolation**: Currently enforced via **application logic** (JWT claims and FastAPI dependencies). **RLS is NOT yet active** as the primary enforcement layer, despite being documented as such in earlier versions.
- **Inconsistencies**: Onboarding endpoints are split; newer ones use JWT-based resolution while legacy ones still depend on headers. `/auth/me` is structurally present but requires more logic for a full profile experience.
- **Redirect Guards**: Middleware and client-side guards are functional but duplicated across layers.

### Final Verdict
**Phase 1 provides a strong, tenant-aware foundation.** However, documentation must accurately reflect the **Custom JWT** and **Application-Layer Isolation** model to avoid engineering confusion.

### 2. RLS is documented but not actually enabled as the active protection layer

The migration files explicitly document RLS as future work. The system currently uses `SERVICE_ROLE_KEY`, which bypasses RLS, so tenant isolation depends on application logic instead of database policy enforcement.

### 3. Schema consistency still depends on migration discipline

The docs now point to the correct ordered migration files, but environments can still drift if they were created from older schema bootstrap files plus manual SQL.

That means:

- the documentation is more accurate now
- but operational correctness still depends on actually applying the numbered migrations or the manual runtime sync SQL

### 4. Onboarding APIs are inconsistent

Current inconsistencies:

- newer onboarding endpoints use JWT dependencies
- legacy `/onboarding/status` still uses `X-Tenant-ID`
- legacy `/onboarding/intent` still uses `X-Tenant-ID`
- there are two onboarding models in the codebase at once

### 5. Auth API completeness is mixed

Not fully complete:

- `/auth/me` is still a placeholder
- tenant selection at login is still "first tenant by join date"
- some future-oriented comments are stale because workspace switching now exists

### 6. Frontend protection is only partially centralized

Current issues:

- route protection is split between React auth context and Next.js middleware
- middleware only targets a subset of protected app routes
- status decisions rely on cookies populated client-side after login

### 7. Some Phase 1.5 work already exists inside the codebase

The codebase already includes:

- password reset endpoints
- email verification routes
- social login entry points

This means the phase boundary between Phase 1 and Phase 1.5 is not clean in implementation.

---

## Verified Completion Matrix

### Foundation

- authentication foundation exists
- tenant identity foundation exists
- onboarding foundation exists
- frontend auth state exists
- route redirect logic exists

### Auth correctness

- passwords hashed with bcrypt
- JWT middleware exists
- email/password login works in code path
- signup creates tenant context
- tenant activation via onboarding exists
- `/auth/me` is complete

### Tenant security

- tenant ID is embedded in JWT
- header spoofing validation exists
- active-tenant guard exists
- RLS is the active enforcement layer
- all onboarding endpoints consistently use JWT-only tenant identity

### Frontend flow

- login page exists
- signup page exists
- onboarding pages exist
- dashboard onboarding checklist exists
- sidebar layout exists
- frontend protection is fully centralized and consistent

---

## Recommended Definition Of Done

Phase 1 should be considered fully complete only when:

1. the auth architecture is accurately documented as custom JWT auth
2. all tenant-sensitive onboarding routes use JWT-derived tenant identity
3. `/auth/me` is implemented properly
4. middleware and client auth guards are aligned and cover all protected app routes
5. the intended Phase 1 versus Phase 1.5 boundary is clarified
6. either RLS is truly enabled or the docs clearly state application-enforced isolation as the production mechanism

---

## Recommended Next Work

### Priority 1 - clean up architecture truth

- remove references to Supabase Auth as the main auth engine
- remove references to active RLS where it is not true
- document custom JWT auth as the actual Phase 1 foundation

### Priority 2 - unify onboarding security

- move `/onboarding/status` to JWT-based tenant resolution
- move `/onboarding/intent` to JWT-based tenant resolution
- decide whether the legacy onboarding endpoints should remain or be retired

### Priority 3 - finish auth API cohesion

- implement `/auth/me`
- make the multi-workspace story explicit in docs and UI
- align auth context and middleware coverage

### Priority 4 - clarify phase boundaries

- keep Phase 1 about foundation
- keep Phase 1.5 about auth hardening and cleanup
- move already-existing 1.5 items in docs from “planned” to “partially implemented” where appropriate

---

## Conclusion

Phase 1 has built the real application foundation and is functionally strong.

The correct status is:

**Core foundation implemented, but documentation, security-model clarity, and endpoint consistency still need cleanup.**

---
## Technical Appendix (Engineering view)
- Auth: Custom JWT (HS256); backend signs tokens using shared secret; middleware extracts `tenant_id` from JWT claims.
- Isolation: Application-level tenant validation via FastAPI dependencies; RLS is documented but currently bypassed via `SERVICE_ROLE_KEY`.
- Onboarding: Next.js wizard under `/onboarding`; transitions tenant status from `onboarding` to `active`.
- Key files: `platform/api/utils/jwt_middleware.py`, `platform/api/routes/auth.py`, `platform/client/src/context/AuthContext.tsx`.
