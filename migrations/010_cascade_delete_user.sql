-- Migration: Cascading user deletion
-- When a user is deleted, automatically remove their owned tenant and ALL related data.

-- 1. Create a function that cascades a user deletion through the entire tenant tree
CREATE OR REPLACE FUNCTION cascade_delete_user()
RETURNS TRIGGER AS $$
DECLARE
    owned_tenant_id UUID;
BEGIN
    -- Find tenants where this user is the OWNER
    FOR owned_tenant_id IN
        SELECT tenant_id FROM public.tenant_users
        WHERE user_id = OLD.id AND role = 'owner'
    LOOP
        -- Delete the tenant — all FK-cascaded children get cleaned up automatically
        DELETE FROM public.tenants WHERE id = owned_tenant_id;
    END LOOP;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the trigger BEFORE delete on users table
DROP TRIGGER IF EXISTS trg_cascade_delete_user ON public.users;
CREATE TRIGGER trg_cascade_delete_user
    BEFORE DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION cascade_delete_user();

-- 3. Ensure all child tables have ON DELETE CASCADE to tenants
-- (Add missing cascades if they don't exist yet)

-- contacts → tenants
ALTER TABLE public.contacts
    DROP CONSTRAINT IF EXISTS contacts_tenant_id_fkey,
    ADD CONSTRAINT contacts_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- campaigns → tenants  
ALTER TABLE public.campaigns
    DROP CONSTRAINT IF EXISTS campaigns_project_id_fkey,
    ADD CONSTRAINT campaigns_project_id_fkey
        FOREIGN KEY (project_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- campaign_dispatch → campaigns (already cascaded, but ensure)
ALTER TABLE public.campaign_dispatch
    DROP CONSTRAINT IF EXISTS campaign_dispatch_campaign_id_fkey,
    ADD CONSTRAINT campaign_dispatch_campaign_id_fkey
        FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;

-- campaign_snapshots → campaigns
ALTER TABLE public.campaign_snapshots
    DROP CONSTRAINT IF EXISTS campaign_snapshots_campaign_id_fkey,
    ADD CONSTRAINT campaign_snapshots_campaign_id_fkey
        FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;

-- tenant_users → tenants (ensure cascade)
ALTER TABLE public.tenant_users
    DROP CONSTRAINT IF EXISTS tenant_users_tenant_id_fkey,
    ADD CONSTRAINT tenant_users_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- tenant_users → users (ensure cascade)
ALTER TABLE public.tenant_users
    DROP CONSTRAINT IF EXISTS tenant_users_user_id_fkey,
    ADD CONSTRAINT tenant_users_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- onboarding_progress → tenants
ALTER TABLE public.onboarding_progress
    DROP CONSTRAINT IF EXISTS onboarding_progress_tenant_id_fkey,
    ADD CONSTRAINT onboarding_progress_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- templates → tenants
ALTER TABLE public.templates
    DROP CONSTRAINT IF EXISTS templates_tenant_id_fkey,
    ADD CONSTRAINT templates_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- jobs → tenants
ALTER TABLE public.jobs
    DROP CONSTRAINT IF EXISTS jobs_tenant_id_fkey,
    ADD CONSTRAINT jobs_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- import_batches → tenants (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'import_batches') THEN
        EXECUTE 'ALTER TABLE public.import_batches
            DROP CONSTRAINT IF EXISTS import_batches_tenant_id_fkey,
            ADD CONSTRAINT import_batches_tenant_id_fkey
                FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE';
    END IF;
END $$;
