-- 999_wipe_all_data.sql
-- DANGER: This will delete ALL users, workspaces, campaigns, and contacts!
-- It keeps the table structures intact.

BEGIN;

-- Using CASCADE to automatically delete all related rows in other tables 
-- (like tenant_users, domains, campaigns, contacts, sender_identities, etc.)
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.tenants CASCADE;

COMMIT;
