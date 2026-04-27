-- Migration: Add tenant_id to import_jobs for multi-tenant isolation.
-- Fixes 500 error when polling job status.

-- 1. Add tenant_id column to import_jobs
ALTER TABLE import_jobs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 2. Add index for performance
CREATE INDEX IF NOT EXISTS idx_import_jobs_tenant_id ON import_jobs(tenant_id);

-- 3. Update RLS policies for import_jobs
ALTER TABLE import_jobs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_isolation_on_import_jobs ON import_jobs;
DROP POLICY IF EXISTS tenant_isolation_on_import_jobs ON import_jobs;
CREATE POLICY tenant_isolation_on_import_jobs ON import_jobs USING (tenant_id = auth.uid());
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- 4. Add tenant_id column to import_rejected_rows
ALTER TABLE import_rejected_rows ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 5. Add index for performance
CREATE INDEX IF NOT EXISTS idx_import_rejected_rows_tenant_id ON import_rejected_rows(tenant_id);

-- 6. Update RLS policies for import_rejected_rows
ALTER TABLE import_rejected_rows DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS job_isolation_on_rejected_rows ON import_rejected_rows;
DROP POLICY IF EXISTS tenant_isolation_on_rejected_rows ON import_rejected_rows;
CREATE POLICY tenant_isolation_on_rejected_rows ON import_rejected_rows USING (tenant_id = auth.uid());
ALTER TABLE import_rejected_rows ENABLE ROW LEVEL SECURITY;
