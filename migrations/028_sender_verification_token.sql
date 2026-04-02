-- 025_sender_verification_token.sql
-- Adds a verification_token column to sender_identities so we can send
-- a custom verification link via our centralized SMTP (shrmail.app@gmail.com)
-- instead of relying on AWS SES's own per-address verification email.

ALTER TABLE public.sender_identities
    ADD COLUMN IF NOT EXISTS verification_token VARCHAR(128),
    ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_sender_identities_token ON public.sender_identities(verification_token);
