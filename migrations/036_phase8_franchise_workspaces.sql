-- Phase 8.3 — Franchise Workspace Lifecycle
-- Adds parent-child workspace support plus franchise invitation metadata.

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS parent_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS workspace_type TEXT DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS franchise_status TEXT DEFAULT 'active';

ALTER TABLE public.tenants
DROP CONSTRAINT IF EXISTS tenants_workspace_type_check;

ALTER TABLE public.tenants
ADD CONSTRAINT tenants_workspace_type_check
CHECK (workspace_type IN ('primary', 'franchise'));

ALTER TABLE public.tenants
DROP CONSTRAINT IF EXISTS tenants_franchise_status_check;

ALTER TABLE public.tenants
ADD CONSTRAINT tenants_franchise_status_check
CHECK (franchise_status IN ('pending_invite', 'active', 'suspended', 'deleted'));

CREATE INDEX IF NOT EXISTS idx_tenants_parent_tenant_id
ON public.tenants(parent_tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenants_workspace_type
ON public.tenants(workspace_type);

ALTER TABLE public.team_invitations
ADD COLUMN IF NOT EXISTS invite_type TEXT DEFAULT 'team',
ADD COLUMN IF NOT EXISTS franchise_tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.team_invitations
DROP CONSTRAINT IF EXISTS team_invitations_invite_type_check;

ALTER TABLE public.team_invitations
ADD CONSTRAINT team_invitations_invite_type_check
CHECK (invite_type IN ('team', 'franchise'));

CREATE INDEX IF NOT EXISTS idx_team_invitations_invite_type
ON public.team_invitations(invite_type);

CREATE INDEX IF NOT EXISTS idx_team_invitations_franchise_tenant_id
ON public.team_invitations(franchise_tenant_id);
