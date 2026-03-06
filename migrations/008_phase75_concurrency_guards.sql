-- Add locked_by column to campaign_dispatch for atomic worker queues
ALTER TABLE public.campaign_dispatch ADD COLUMN IF NOT EXISTS locked_by UUID;

-- Add external_msg_id to verify SES success & prevent double sends
ALTER TABLE public.campaign_dispatch ADD COLUMN IF NOT EXISTS external_msg_id TEXT;
