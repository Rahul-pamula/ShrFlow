-- Add full_name column to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Create an index for searching by full name
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_full_name ON public.contacts(tenant_id, full_name);

COMMENT ON COLUMN public.contacts.full_name IS 'Stores the raw full name from import for better personalization fallbacks';
