-- Phase 7: Plan Enforcement & Usage Quotas
-- This migration creates the plans catalog and modifies the tenants table to track billing quotas.

-- 1. Create the `plans` catalog
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'Free', 'Starter', 'Pro', 'Enterprise'
    max_monthly_emails INTEGER NOT NULL,
    max_contacts INTEGER NOT NULL,
    allow_custom_domain BOOLEAN DEFAULT FALSE,
    price_monthly NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert Seed Data
-- Note: We use static UUIDs here so the API can reference them easily if needed,
-- but the names are the primary source of truth.
INSERT INTO public.plans (id, name, max_monthly_emails, max_contacts, allow_custom_domain, price_monthly)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Free', 1000, 500, FALSE, 0.00),
    ('22222222-2222-2222-2222-222222222222', 'Starter', 10000, 5000, TRUE, 29.00),
    ('33333333-3333-3333-3333-333333333333', 'Pro', 100000, 50000, TRUE, 99.00),
    ('44444444-4444-4444-4444-444444444444', 'Enterprise', 1000000, 500000, TRUE, 499.00)
ON CONFLICT (name) DO UPDATE SET 
    max_monthly_emails = EXCLUDED.max_monthly_emails,
    max_contacts = EXCLUDED.max_contacts,
    allow_custom_domain = EXCLUDED.allow_custom_domain,
    price_monthly = EXCLUDED.price_monthly;

-- 3. Update the `tenants` table with quota columns
-- We set the default plan to "Free" using the static UUID from above.
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) DEFAULT '11111111-1111-1111-1111-111111111111',
ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS emails_sent_this_cycle INTEGER DEFAULT 0;

-- Backfill existing tenants to the Free plan
UPDATE public.tenants SET plan_id = '11111111-1111-1111-1111-111111111111' WHERE plan_id IS NULL;

-- 4. Set up pg_cron (if available, otherwise we handle reset in python worker/trigger)
-- We will use a Postgres function to manually reset usage that can be called by a cron job or worker.
CREATE OR REPLACE FUNCTION reset_tenant_billing_cycles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If today is past the 30-day mark from their billing_cycle_start
    UPDATE public.tenants
    SET 
        emails_sent_this_cycle = 0,
        billing_cycle_start = NOW()
    WHERE 
        NOW() >= billing_cycle_start + INTERVAL '30 days';
END;
$$;
