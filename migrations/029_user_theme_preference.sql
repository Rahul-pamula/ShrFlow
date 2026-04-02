-- ========================================================
-- Add Theme Preference
-- Defines enum and adds column to track user theme preference
-- ========================================================

-- Drop the type if it happened to be created previously to avoid conflicts on re-runs during dev
DO $$ BEGIN
    CREATE TYPE theme_enum AS ENUM ('light', 'dark', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS theme_preference theme_enum DEFAULT 'system';

UPDATE public.users SET theme_preference = 'system' WHERE theme_preference IS NULL;
