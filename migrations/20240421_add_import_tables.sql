-- ========================================================
-- Import Jobs & Audit Schema
-- Adds support for robust, asynchronous contact ingestion.
-- ========================================================

-- 1. IMPORT JOBS TRACKER
CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_key TEXT NOT NULL,
    status TEXT DEFAULT 'initializing' CHECK (status IN ('initializing', 'pending', 'processing', 'completed', 'failed')),
    total_rows INT DEFAULT 0,
    processed_rows INT DEFAULT 0,
    failed_rows INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REJECTED ROWS AUDIT LOG (For user correction)
CREATE TABLE IF NOT EXISTS import_rejected_rows (
    id BIGSERIAL PRIMARY KEY,
    job_id UUID REFERENCES import_jobs(id) ON DELETE CASCADE,
    row_data JSONB NOT NULL,
    error_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX idx_import_jobs_project_id ON import_jobs(project_id);
CREATE INDEX idx_import_rejected_rows_job_id ON import_rejected_rows(job_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_rejected_rows ENABLE ROW LEVEL SECURITY;

-- Project-level isolation (Inherit from projects)
CREATE POLICY project_isolation_on_import_jobs ON import_jobs 
    USING (project_id IN (SELECT id FROM projects WHERE tenant_id = auth.uid()));

CREATE POLICY job_isolation_on_rejected_rows ON import_rejected_rows 
    USING (job_id IN (SELECT id FROM import_jobs WHERE project_id IN (SELECT id FROM projects WHERE tenant_id = auth.uid())));
