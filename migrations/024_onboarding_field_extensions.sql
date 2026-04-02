-- ========================================================
-- Onboarding Field Extensions
-- Additional onboarding fields used by the newer workspace setup flow.
-- ========================================================

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS workspace_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS user_role VARCHAR(50),
    ADD COLUMN IF NOT EXISTS primary_use_case VARCHAR(100),
    ADD COLUMN IF NOT EXISTS integration_sources TEXT[],
    ADD COLUMN IF NOT EXISTS expected_scale VARCHAR(50);

COMMENT ON COLUMN public.tenants.workspace_name IS 'Workspace or company name from onboarding';
COMMENT ON COLUMN public.tenants.user_role IS 'User role: Founder, Developer, Marketer, Other';
COMMENT ON COLUMN public.tenants.primary_use_case IS 'Primary use case: transactional, marketing, event_based, exploring';
COMMENT ON COLUMN public.tenants.integration_sources IS 'Array of integration sources: api_webhooks, web_app, mobile_app, ecommerce, not_sure';
COMMENT ON COLUMN public.tenants.expected_scale IS 'Expected monthly events: testing, less_1k, 1k_10k, 10k_plus';
