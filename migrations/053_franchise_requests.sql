-- Migration: 053_franchise_requests.sql
-- Description: Create franchise_requests table for self-service onboarding flow.

CREATE TABLE IF NOT EXISTS public.franchise_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approval_token TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by tenant (for owners)
CREATE INDEX IF NOT EXISTS idx_franchise_requests_target_tenant ON public.franchise_requests(target_tenant_id);

-- Index for fast lookup by requester
CREATE INDEX IF NOT EXISTS idx_franchise_requests_requester ON public.franchise_requests(requesting_user_id);

-- Enable RLS
ALTER TABLE public.franchise_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own requests" 
ON public.franchise_requests FOR SELECT 
USING (auth.uid() = requesting_user_id);

CREATE POLICY "Owners can view incoming requests for their tenant" 
ON public.franchise_requests FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE tenant_id = target_tenant_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_franchise_requests_updated_at
BEFORE UPDATE ON public.franchise_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
