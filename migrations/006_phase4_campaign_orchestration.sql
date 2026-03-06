-- Phase 4: Campaign Orchestration Tables

-- 1. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying campaigns by project quickly
CREATE INDEX IF NOT EXISTS idx_campaigns_project_id ON public.campaigns(project_id);

-- 2. Campaign Dispatch (The Job Queue & Analytics Table)
CREATE TABLE IF NOT EXISTS public.campaign_dispatch (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'DISPATCHED', 'FAILED', 'CANCELLED')),
    ses_message_id TEXT,
    error_log TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    open_count INT DEFAULT 0,
    click_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for queue workers (finding PENDING tasks efficiently)
CREATE INDEX IF NOT EXISTS idx_campaign_dispatch_status ON public.campaign_dispatch(status) WHERE status = 'PENDING';

-- Index for analytics routing (quickly looking up a row by SES message ID)
CREATE INDEX IF NOT EXISTS idx_campaign_dispatch_ses_msg_id ON public.campaign_dispatch(ses_message_id) WHERE ses_message_id IS NOT NULL;

-- 3. Row Level Security Policies
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_dispatch ENABLE ROW LEVEL SECURITY;

-- Note: In a true SaaS Postgres setup, RLS policies would check the `project_id`. 
-- If Supabase service_role is used, RLS is bypassed. If Anon/Auth users query directly, exact policies are needed.
