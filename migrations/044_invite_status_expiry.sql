-- Update team_invitations with status and ensure roles match app logic
ALTER TABLE public.team_invitations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add check constraint for status
ALTER TABLE public.team_invitations DROP CONSTRAINT IF EXISTS team_invitations_status_check;
ALTER TABLE public.team_invitations ADD CONSTRAINT team_invitations_status_check 
    CHECK (status IN ('pending', 'accepted', 'expired', 'canceled'));

-- Update roles check to include manager (app uses manager/member/owner)
ALTER TABLE public.team_invitations DROP CONSTRAINT IF EXISTS team_invitations_role_check;
ALTER TABLE public.team_invitations ADD CONSTRAINT team_invitations_role_check 
    CHECK (role IN ('owner', 'manager', 'member', 'admin'));

-- Ensure indices for the expiry job
CREATE INDEX IF NOT EXISTS idx_team_invitations_status_expiry 
ON public.team_invitations(status, expires_at);
