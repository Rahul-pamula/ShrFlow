-- Create verified_senders table to prevent internal domain spoofing
CREATE TABLE IF NOT EXISTS verified_senders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast tenant UI lookups
CREATE INDEX IF NOT EXISTS idx_verified_senders_tenant ON verified_senders(tenant_id);

-- Enforce unique emails per workspace (so you can't verify the same email twice for the same tenant)
ALTER TABLE verified_senders DROP CONSTRAINT IF EXISTS verified_senders_email_tenant_unique;
ALTER TABLE verified_senders ADD CONSTRAINT verified_senders_email_tenant_unique UNIQUE (tenant_id, email);
