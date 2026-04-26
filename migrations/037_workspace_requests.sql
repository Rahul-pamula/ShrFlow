-- Phase 8.5 — Manager Request System
-- Workspace requests allow managers to raise billing/franchise requests for owner review.

CREATE TABLE IF NOT EXISTS public.workspace_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    requested_by    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    request_type    TEXT NOT NULL CHECK (request_type IN ('billing_change', 'franchise_request')),
    notes           TEXT,
    payload         JSONB DEFAULT '{}'::jsonb,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    resolved_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_workspace_requests_tenant_id
    ON public.workspace_requests(tenant_id);

CREATE INDEX IF NOT EXISTS idx_workspace_requests_requested_by
    ON public.workspace_requests(requested_by);

CREATE INDEX IF NOT EXISTS idx_workspace_requests_status
    ON public.workspace_requests(status);

CREATE INDEX IF NOT EXISTS idx_workspace_requests_tenant_status
    ON public.workspace_requests(tenant_id, status);
