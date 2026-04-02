-- Phase 8C: AWS SES Domain Verification Table
-- Tracks requested domains, generated DKIM tokens, Custom MAIL FROM subdomains, and their verification status on AWS.

DROP TABLE IF EXISTS public.domains CASCADE;

CREATE TABLE public.domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL,
    dkim_tokens JSONB, 
    mail_from_domain VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, domain_name)
);

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
