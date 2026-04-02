-- Phase 9 Addendum: Update Free Plan Limits to match AWS SES Free Tier
-- AWS SES provides 3,000 free emails per month. Our previous Free tier offered 1,000.
-- We are updating the Free tier to offer 500 contacts and 3,000 emails per month.

UPDATE public.plans
SET max_monthly_emails = 3000
WHERE name = 'Free';
