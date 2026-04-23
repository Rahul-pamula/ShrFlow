-- ========================================================
-- PHASE 2 EXTENSION: CONTACT EMAIL DOMAIN INDEXING
-- ========================================================

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS email_domain TEXT;

UPDATE contacts
SET email_domain = LOWER(SPLIT_PART(email, '@', 2))
WHERE email IS NOT NULL
  AND POSITION('@' IN email) > 0
  AND (email_domain IS NULL OR email_domain = '');

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email_domain
ON contacts(tenant_id, email_domain);
