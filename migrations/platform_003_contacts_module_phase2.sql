-- ========================================================
-- PHASE 2: CONTACTS MODULE MIGRATION
-- ========================================================

-- 1. Updates to CONTACTS table (Align with Master Prompt)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill tenant_id from projects (Maintenance Step)
DO $$
BEGIN
    UPDATE contacts c
    SET tenant_id = p.tenant_id
    FROM projects p
    WHERE c.project_id = p.id
    AND c.tenant_id IS NULL;
END $$;

-- 2. New Table: CONTACT_CUSTOM_FIELDS (Key-Value style per prompt)
CREATE TABLE IF NOT EXISTS contact_custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    field_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contact_id, field_key)
);

-- 3. Plan Limits (on Tenants)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS max_contacts INT DEFAULT 1000;

-- 4. Indexes for Performance (Strict Upsert & Filtering)
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email ON contacts(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_created ON contacts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_custom_fields_tenant ON contact_custom_fields(tenant_id);

-- 5. Enable RLS on new table
ALTER TABLE contact_custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_on_contact_custom_fields 
    ON contact_custom_fields 
    USING (tenant_id = auth.uid());

-- Comment
COMMENT ON TABLE contact_custom_fields IS 'Phase 2: Flexible key-value storage for contact attributes';
