-- ============================================================
-- Migration 035: PostgreSQL Row Level Security (RLS)
-- Phase 1.7 — Fix 6
-- ============================================================
-- Applied via: python migrations/apply_rls.py
-- (Script splits on semicolons and executes each statement separately)
-- ============================================================

-- ── 1. CONTACTS ────────────────────────────────────────────────────
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_contacts_tenant_isolation ON public.contacts;
CREATE POLICY rls_contacts_tenant_isolation
    ON public.contacts AS PERMISSIVE FOR ALL TO PUBLIC
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE));

-- ── 2. IMPORT_BATCHES ──────────────────────────────────────────────
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_import_batches_tenant_isolation ON public.import_batches;
CREATE POLICY rls_import_batches_tenant_isolation
    ON public.import_batches AS PERMISSIVE FOR ALL TO PUBLIC
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE));

-- ── 3. CONTACT_CUSTOM_FIELDS ───────────────────────────────────────
ALTER TABLE public.contact_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_custom_fields FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_on_contact_custom_fields ON public.contact_custom_fields;
DROP POLICY IF EXISTS rls_contact_custom_fields_tenant_isolation ON public.contact_custom_fields;
CREATE POLICY rls_contact_custom_fields_tenant_isolation
    ON public.contact_custom_fields AS PERMISSIVE FOR ALL TO PUBLIC
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE));

-- ── 4. CAMPAIGNS ───────────────────────────────────────────────────
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_campaigns_tenant_isolation ON public.campaigns;
CREATE POLICY rls_campaigns_tenant_isolation
    ON public.campaigns AS PERMISSIVE FOR ALL TO PUBLIC
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE));

-- ── 5. CAMPAIGN_DISPATCH (join through campaigns) ─────────────────
ALTER TABLE public.campaign_dispatch ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_dispatch FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_campaign_dispatch_tenant_isolation ON public.campaign_dispatch;
CREATE POLICY rls_campaign_dispatch_tenant_isolation
    ON public.campaign_dispatch AS PERMISSIVE FOR ALL TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_dispatch.campaign_id
              AND c.tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE)
        )
    );

-- ── 6. TEMPLATES ───────────────────────────────────────────────────
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_templates_tenant_isolation ON public.templates;
CREATE POLICY rls_templates_tenant_isolation
    ON public.templates AS PERMISSIVE FOR ALL TO PUBLIC
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE));

-- ── 7. DOMAINS ─────────────────────────────────────────────────────
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_domains_tenant_isolation ON public.domains;
CREATE POLICY rls_domains_tenant_isolation
    ON public.domains AS PERMISSIVE FOR ALL TO PUBLIC
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE));

-- ── 8. SENDER_IDENTITIES ───────────────────────────────────────────
ALTER TABLE public.sender_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sender_identities FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_sender_identities_tenant_isolation ON public.sender_identities;
CREATE POLICY rls_sender_identities_tenant_isolation
    ON public.sender_identities AS PERMISSIVE FOR ALL TO PUBLIC
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE));

-- ── 9. EMAIL_EVENTS ────────────────────────────────────────────────
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_email_events_tenant_isolation ON public.email_events;
CREATE POLICY rls_email_events_tenant_isolation
    ON public.email_events AS PERMISSIVE FOR ALL TO PUBLIC
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE));

-- ── 10. AUDIT_LOGS ─────────────────────────────────────────────────
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_audit_logs_tenant_isolation ON public.audit_logs;
CREATE POLICY rls_audit_logs_tenant_isolation
    ON public.audit_logs AS PERMISSIVE FOR ALL TO PUBLIC
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE));

-- ── NOTES ──────────────────────────────────────────────────────────
-- service_role bypasses RLS automatically in Supabase.
-- The existing Supabase Python client (service_role key) is UNAFFECTED.
-- asyncpg's get_conn(tenant_id=X) sets:
--   SET LOCAL app.current_tenant_id = 'X'
-- which the policies above read via current_setting(..., TRUE).
-- TRUE = return NULL instead of error when variable is not set.
-- NULL != any tenant_id, so unscoped connections see ZERO rows.
