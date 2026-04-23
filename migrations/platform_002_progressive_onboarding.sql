-- =====================================================
-- PROGRESSIVE TENANT ONBOARDING - DATABASE MIGRATION
-- =====================================================
-- 
-- This migration adds support for:
-- 1. User authentication (email/password)
-- 2. Multi-user tenants (tenant_users junction)
-- 3. Progressive onboarding flow
-- 4. Compliance data collection
-- 5. Tenant lifecycle management
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- bcrypt hash, NULL for OAuth-only users
    
    -- Profile
    full_name TEXT,
    
    -- OAuth (future expansion)
    google_id TEXT UNIQUE,
    github_id TEXT UNIQUE,
    
    -- Status
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- =====================================================
-- 2. TENANTS TABLE (Enhanced)
-- =====================================================
-- Add new columns to existing tenants table
-- NOTE: organization_name is nullable to allow tenant creation during signup
-- It will be populated during onboarding Stage 2 (basic-info)
-- Business logic enforces it before activation
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS organization_name TEXT, -- Nullable until onboarding Stage 2
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',

-- Compliance (REQUIRED for sending emails)
-- These fields are populated during onboarding Stage 3 (compliance)
-- Backend guards prevent email sending until these are complete
ADD COLUMN IF NOT EXISTS business_address_line1 TEXT,
ADD COLUMN IF NOT EXISTS business_address_line2 TEXT,
ADD COLUMN IF NOT EXISTS business_city TEXT,
ADD COLUMN IF NOT EXISTS business_state TEXT,
ADD COLUMN IF NOT EXISTS business_country TEXT,
ADD COLUMN IF NOT EXISTS business_zip TEXT,

-- Intent & Context (Optional)
ADD COLUMN IF NOT EXISTS business_type TEXT, -- 'ecommerce', 'saas', 'agency', 'other'
ADD COLUMN IF NOT EXISTS primary_channel TEXT, -- 'marketing', 'transactional', 'both'
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',

-- Lifecycle (AUTHORITATIVE SOURCE OF TRUTH)
-- tenants.status is the ONLY source of truth for tenant state
-- onboarding_progress table is for analytics/UX only
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'onboarding', -- 'onboarding', 'active', 'suspended', 'cancelled'
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add constraint for valid statuses
ALTER TABLE tenants 
ADD CONSTRAINT IF NOT EXISTS tenants_status_check 
CHECK (status IN ('onboarding', 'active', 'suspended', 'cancelled'));

-- Add constraint for valid business types
ALTER TABLE tenants 
ADD CONSTRAINT IF NOT EXISTS tenants_business_type_check 
CHECK (business_type IS NULL OR business_type IN ('ecommerce', 'saas', 'agency', 'nonprofit', 'other'));

-- Add constraint for valid channels
ALTER TABLE tenants 
ADD CONSTRAINT IF NOT EXISTS tenants_primary_channel_check 
CHECK (primary_channel IS NULL OR primary_channel IN ('marketing', 'transactional', 'both'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at);

-- =====================================================
-- 3. TENANT_USERS TABLE (Junction)
-- =====================================================
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role
    role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    
    -- Timestamps
    joined_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one user can't have duplicate roles in same tenant
    UNIQUE(tenant_id, user_id)
);

-- Add constraint for valid roles
ALTER TABLE tenant_users 
ADD CONSTRAINT IF NOT EXISTS tenant_users_role_check 
CHECK (role IN ('owner', 'admin', 'member'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant_users(role);

-- =====================================================
-- 4. ONBOARDING_PROGRESS TABLE (Optional - Analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Stage completion flags
    stage_basic_info BOOLEAN DEFAULT FALSE,
    stage_compliance BOOLEAN DEFAULT FALSE,
    stage_intent BOOLEAN DEFAULT FALSE,
    
    -- Timestamps for each stage
    basic_info_completed_at TIMESTAMP,
    compliance_completed_at TIMESTAMP,
    intent_completed_at TIMESTAMP,
    
    -- Overall progress
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Ensure one progress record per tenant
    UNIQUE(tenant_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_tenant ON onboarding_progress(tenant_id);

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tenants
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) - FUTURE
-- =====================================================
-- Note: Currently using SERVICE_ROLE_KEY which bypasses RLS
-- When implementing JWT-based auth, enable these policies:

-- Enable RLS on tables (commented out for now)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Example policy (for future reference)
-- CREATE POLICY "Users can view their own data"
--     ON users FOR SELECT
--     USING (auth.uid() = id);

-- CREATE POLICY "Users can view tenants they belong to"
--     ON tenants FOR SELECT
--     USING (
--         id IN (
--             SELECT tenant_id FROM tenant_users
--             WHERE user_id = auth.uid()
--         )
--     );

-- =====================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment to insert test data:

-- INSERT INTO users (email, full_name, email_verified) VALUES
-- ('demo@example.com', 'Demo User', true);

-- INSERT INTO tenants (organization_name, status) VALUES
-- ('Demo Tenant', 'active');

-- Link user to tenant
-- INSERT INTO tenant_users (tenant_id, user_id, role)
-- SELECT 
--     (SELECT id FROM tenants WHERE organization_name = 'Demo Tenant'),
--     (SELECT id FROM users WHERE email = 'demo@example.com'),
--     'owner';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables exist
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('users', 'tenants', 'tenant_users', 'onboarding_progress')
ORDER BY table_name;
