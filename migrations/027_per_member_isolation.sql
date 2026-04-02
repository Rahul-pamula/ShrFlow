-- 024_per_member_isolation.sql
-- Shifts data isolation from a workspace-wide setting to a per-member setting.

BEGIN;

-- 1. Add isolation_model to User-Workspace mapping
ALTER TABLE public.tenant_users
ADD COLUMN IF NOT EXISTS isolation_model VARCHAR(20) DEFAULT 'team' CHECK (isolation_model IN ('team', 'agency'));

-- 2. Add isolation_model to Invites
ALTER TABLE public.team_invitations
ADD COLUMN IF NOT EXISTS isolation_model VARCHAR(20) DEFAULT 'team' CHECK (isolation_model IN ('team', 'agency'));

-- 3. Backfill existing members to inherit the old tenant-level setting before we drop it
-- (Handle gracefully if the column doesn't exist)
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='tenants' AND column_name='data_isolation_model'
    ) THEN
        EXECUTE '
            UPDATE public.tenant_users tu
            SET isolation_model = t.data_isolation_model
            FROM public.tenants t
            WHERE tu.tenant_id = t.id;
            
            ALTER TABLE public.tenants DROP COLUMN data_isolation_model;
        ';
    END IF;
END $$;

COMMIT;
