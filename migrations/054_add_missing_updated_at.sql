-- Migration: 054_add_missing_updated_at.sql
-- Description: Adds updated_at column to campaigns and contacts tables and attaches update triggers.

-- 1. Add column to campaigns
ALTER TABLE public.campaigns 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add column to contacts
ALTER TABLE public.contacts 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Attach trigger to campaigns
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Attach trigger to contacts
DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
