ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS bounce_reason TEXT;
