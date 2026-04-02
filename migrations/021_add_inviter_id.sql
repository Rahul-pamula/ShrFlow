-- Add inviter_id to track who sent the team invitation
ALTER TABLE public.team_invitations
ADD COLUMN inviter_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX idx_team_invitations_inviter_id ON public.team_invitations(inviter_id);
