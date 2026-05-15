-- =====================================================
-- Migration 055: Handover Schema Alignment
-- Adds missing tables and columns required for final company handover
-- to ensure 1:1 parity with the target delivery schema.
-- =====================================================

-- 1. ADD MISSING TABLES
-- Notifications System
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audience Segmentation
CREATE TABLE IF NOT EXISTS public.segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    filter_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template Version History
CREATE TABLE IF NOT EXISTS public.template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    design_json JSONB NOT NULL,
    compiled_html TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Import Errors (Legacy/Standard Format)
CREATE TABLE IF NOT EXISTS public.import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    row_number INTEGER,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    reason TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- Users table extensions
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Tenants table extensions (Business Profile & Onboarding)
ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS business_address TEXT,
    ADD COLUMN IF NOT EXISTS industry TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS sending_domain TEXT,
    ADD COLUMN IF NOT EXISTS expected_scale TEXT,
    ADD COLUMN IF NOT EXISTS integration_sources TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Contacts table extensions (Engagement & Audit)
ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
    ADD COLUMN IF NOT EXISTS bounce_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. ALIGN CONSTRAINTS & DEFAULTS
-- Expand Campaigns Statuses
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE public.campaigns 
    ADD CONSTRAINT campaigns_status_check 
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'archived', 'awaiting_review', 'approved'));

-- Ensure Campaign Dispatch columns match
ALTER TABLE public.campaign_dispatch 
    ADD COLUMN IF NOT EXISTS locked_by UUID,
    ADD COLUMN IF NOT EXISTS external_msg_id TEXT;

-- 4. INDEXES FOR NEW COLUMNS
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
    ON public.notifications(recipient_id) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_segments_tenant 
    ON public.segments(tenant_id);

CREATE INDEX IF NOT EXISTS idx_contacts_engagement 
    ON public.contacts(tenant_id, engagement_score);

-- 5. UPDATE TRIGGERS (Where applicable)
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_segments_updated_at ON public.segments;
CREATE TRIGGER update_segments_updated_at
    BEFORE UPDATE ON public.segments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
