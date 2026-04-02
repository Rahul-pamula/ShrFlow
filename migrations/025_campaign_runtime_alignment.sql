-- ========================================================
-- Campaign Runtime Alignment
-- Brings the top-level campaign schema in line with the current API,
-- which writes tenant_id, audience_target, and is_archived.
-- ========================================================

ALTER TABLE public.campaigns
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS audience_target TEXT DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'campaigns'
          AND column_name = 'project_id'
    ) THEN
        UPDATE public.campaigns
        SET tenant_id = project_id
        WHERE tenant_id IS NULL
          AND project_id IS NOT NULL;

        ALTER TABLE public.campaigns
            ALTER COLUMN project_id DROP NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_created
    ON public.campaigns(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_status
    ON public.campaigns(tenant_id, status);
