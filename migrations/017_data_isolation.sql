-- 1. Add isolation model setting to Workspaces
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS data_isolation_model VARCHAR(20) DEFAULT 'team' CHECK (data_isolation_model IN ('team', 'agency'));

-- 2. Add ownership tracking to core resources
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 2b. Backfill existing rows to avoid NULL-filtering issues
-- We assign them to the workspace owner by default
UPDATE public.campaigns c
SET created_by_user_id = (
  SELECT tu.user_id FROM public.tenant_users tu 
  WHERE tu.tenant_id::text = c.tenant_id::text AND tu.role = 'owner' LIMIT 1
)
WHERE c.created_by_user_id IS NULL;

UPDATE public.contacts ct
SET created_by_user_id = (
  SELECT tu.user_id FROM public.tenant_users tu 
  WHERE tu.tenant_id::text = ct.tenant_id::text AND tu.role = 'owner' LIMIT 1
)
WHERE ct.created_by_user_id IS NULL;

UPDATE public.templates t
SET created_by_user_id = (
  SELECT tu.user_id FROM public.tenant_users tu 
  WHERE tu.tenant_id::text = t.tenant_id::text AND tu.role = 'owner' LIMIT 1
)
WHERE t.created_by_user_id IS NULL;

-- 3. Create Sender Identities Table
-- This tracks individual "From" email addresses sent via the verified workspace domain
CREATE TABLE IF NOT EXISTS public.sender_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending' (waiting for AWS email click), 'verified'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Index the lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON public.contacts(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_sender_identities_tenant ON public.sender_identities(tenant_id);
