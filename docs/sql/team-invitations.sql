BEGIN;
CREATE TABLE IF NOT EXISTS public.team_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 team_id uuid NOT NULL REFERENCES public.coach_teams(id) ON DELETE CASCADE,
 coach_id uuid NOT NULL REFERENCES public.users(id),
 token_hash text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','pending','confirmed','declined','revoked','withdrawn')),
 guardian_id uuid REFERENCES public.users(id), child_id uuid REFERENCES public.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
 accepted_at timestamptz, decided_at timestamptz,
 CHECK ((guardian_id IS NULL) = (child_id IS NULL))
);
CREATE INDEX IF NOT EXISTS team_invites_team_idx ON public.team_invitations(team_id,created_at DESC);
CREATE INDEX IF NOT EXISTS team_invites_parent_idx ON public.team_invitations(guardian_id);
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.team_invitations FROM anon,authenticated;
COMMIT;
