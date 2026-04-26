-- Migration 038: Invited By Tracking and Exports Log
-- Adds tracking for who invited a member and logs export actions

-- 1. Add invited_by to tenant_users
ALTER TABLE public.tenant_users 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 2. Create exports_log table
CREATE TABLE IF NOT EXISTS public.exports_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    role_filter TEXT,
    invited_by_filter UUID REFERENCES public.users(id) ON DELETE SET NULL,
    format TEXT DEFAULT 'csv',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT DEFAULT 'completed'
);

-- Note: RLS policies can be enabled if needed, but for now we enforce via application API logic.
