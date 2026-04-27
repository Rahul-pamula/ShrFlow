-- Phase 9: Detailed Pricing & Plan Enforcement System
-- This migration updates the plans table with new limits and features, and seeds the final pricing data.

-- 1. Add missing limit and feature columns to `plans`
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_domains INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';

-- 2. Seed/Update Plan Data (Final Pricing Specs)
-- Note: Pro and Enterprise have "Unlimited" or very high numbers for users/domains.
-- Unlimited is represented as -1 in logic, but here we'll use high numbers or 0 (if logic handles 0 as infinite).
-- For this system, we'll use -1 to signify Unlimited.

INSERT INTO public.plans (id, name, max_monthly_emails, max_contacts, max_users, max_domains, price_monthly, features)
VALUES
    (
        '11111111-1111-1111-1111-111111111111', 
        'Free', 
        1000, 
        500, 
        1, 
        1, 
        0.00, 
        '{"automation": false, "api": false, "advanced_analytics": false, "team_members": false}'
    ),
    (
        '22222222-2222-2222-2222-222222222222', 
        'Starter', 
        25000, 
        5000, 
        3, 
        3, 
        799.00, 
        '{"automation": true, "api": false, "advanced_analytics": false, "team_members": true, "tags": true}'
    ),
    (
        '33333333-3333-3333-3333-333333333333', 
        'Pro', 
        150000, 
        50000, 
        -1, 
        -1, 
        2499.00, 
        '{"automation": true, "api": true, "advanced_analytics": true, "team_members": true, "ab_testing": true, "custom_domain": true}'
    ),
    (
        '44444444-4444-4444-4444-444444444444', 
        'Enterprise', 
        1000000, 
        500000, 
        -1, 
        -1, 
        9999.00, -- Placeholder for Enterprise baseline
        '{"dedicated_ip": true, "sla": true, "sso": true, "priority_support": true}'
    )
ON CONFLICT (name) DO UPDATE SET 
    max_monthly_emails = EXCLUDED.max_monthly_emails,
    max_contacts = EXCLUDED.max_contacts,
    max_users = EXCLUDED.max_users,
    max_domains = EXCLUDED.max_domains,
    price_monthly = EXCLUDED.price_monthly,
    features = EXCLUDED.features;
