-- Migration 039: Drop unique constraint on tenants.email
-- In a multi-workspace architecture, one user (email) can own multiple workspaces
-- or be the franchise owner of multiple child tenants. The unique constraint is incorrect.

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_email_key;
