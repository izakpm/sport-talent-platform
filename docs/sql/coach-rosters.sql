BEGIN;
CREATE TABLE IF NOT EXISTS public.coach_team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.coach_teams(id) ON DELETE CASCADE,
  first_name varchar(80) NOT NULL,
  last_name varchar(80) NOT NULL,
  position varchar(30) NOT NULL DEFAULT '',
  shirt_number integer CHECK (shirt_number BETWEEN 1 AND 99),
  is_captain boolean NOT NULL DEFAULT false,
  status varchar(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coach_players_team_idx ON public.coach_team_players(team_id);
CREATE UNIQUE INDEX IF NOT EXISTS coach_players_active_number_idx ON public.coach_team_players(team_id,shirt_number) WHERE status='active' AND shirt_number IS NOT NULL;
ALTER TABLE public.coach_team_players ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coach_team_players FROM anon, authenticated;
COMMIT;
