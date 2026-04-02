-- Phase 12.5: Enterprise Domain Auto-Discovery (JIT Provisioning)
-- Buffer table for employees requesting to join a workspace.

DROP TABLE IF EXISTS public.join_requests CASCADE;

CREATE TABLE public.join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, denied, blocked
    risk_score VARCHAR(50) DEFAULT 'Low Risk',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
