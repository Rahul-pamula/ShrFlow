-- ========================================================
-- Phase 2 Extension: Contact Email Domain Indexing
-- Adds normalized email_domain support for filtering and audience
-- targeting. Safe to run multiple times.
-- ========================================================

ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS email_domain TEXT;

UPDATE public.contacts
SET email_domain = LOWER(SPLIT_PART(email, '@', 2))
WHERE email IS NOT NULL
  AND POSITION('@' IN email) > 0
  AND (email_domain IS NULL OR email_domain = '');

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email_domain
    ON public.contacts(tenant_id, email_domain);
