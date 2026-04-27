-- Add 'source' column to audit_logs if it doesn't exist
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'api';

-- Add check constraint for valid source values
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_source_check;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_source_check 
    CHECK (source IN ('api', 'worker', 'system'));
