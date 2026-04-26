-- Migration 041: Add missing tenant columns required by recent auth logic
-- This migration ensures the tenants table matches the expectations of jwt_middleware.py and auth.py.

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS onboarding_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS workspace_type TEXT DEFAULT 'primary';

-- Ensure workspace_type has a valid constraint if it doesn't already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tenants_workspace_type_check_v2'
    ) THEN
        ALTER TABLE public.tenants
            ADD CONSTRAINT tenants_workspace_type_check_v2
            CHECK (workspace_type IN ('primary', 'franchise', 'MAIN', 'PRIMARY', 'FRANCHISE'));
    END IF;
END $$;

COMMENT ON COLUMN public.tenants.onboarding_required IS 'Flag to indicate if the tenant still needs to complete the onboarding flow.';
COMMENT ON COLUMN public.tenants.workspace_type IS 'Type of workspace: primary/MAIN or franchise.';
