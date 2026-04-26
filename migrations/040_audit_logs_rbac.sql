-- ============================================================
-- MIGRATION 040: Ensure audit_logs table exists (RBAC Phase)
-- Requirement: Immutable append-only audit trail for all 
-- security-sensitive actions across the platform.
--
-- Fields:
--   id             - UUID primary key
--   tenant_id      - Workspace isolation key (references tenants)
--   user_id        - Who performed the action (references users)
--   action         - Event name e.g. "domain.add", "sender.add"
--   resource_type  - What was acted on e.g. "domain", "sender"
--   resource_id    - The specific record ID
--   metadata       - Non-PII context as JSONB
--   ip_address     - Optional request IP
--   user_agent     - Optional truncated UA string
--   created_at     - Immutable timestamp
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID,
    action          TEXT NOT NULL,
    resource_type   TEXT,
    resource_id     TEXT,
    metadata        JSONB,
    ip_address      TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast tenant-scoped querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id   ON audit_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id     ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON audit_logs (action);

-- ============================================================
-- IMMUTABILITY ENFORCEMENT
-- Physically block UPDATE and DELETE at the DB level.
-- This prevents any application-level privilege escalation 
-- from erasing its own audit trail.
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is immutable: UPDATE and DELETE are not permitted. (action=%, tenant=%)', OLD.action, OLD.tenant_id;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- RLS: Owners can only see their own tenant's logs (defense in depth)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));
