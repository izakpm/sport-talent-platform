-- Additive migration: coach-owned rugby teams and schedules. Run before deploying.
BEGIN;
CREATE TABLE IF NOT EXISTS public.coach_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.users(id),
  name varchar(100) NOT NULL,
  age_group varchar(40) NOT NULL,
  sport varchar(30) NOT NULL DEFAULT 'Rugby',
  venue varchar(160) NOT NULL DEFAULT '',
  timezone varchar(50) NOT NULL DEFAULT 'Africa/Johannesburg',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coach_teams_owner_idx ON public.coach_teams(coach_id);
CREATE TABLE IF NOT EXISTS public.coach_schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.coach_teams(id) ON DELETE CASCADE,
  title varchar(120) NOT NULL,
  kind varchar(30) NOT NULL CHECK (kind IN ('practice','gym','video','match','fitness','recovery')),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  venue varchar(160) NOT NULL DEFAULT '',
  notes varchar(2000) NOT NULL DEFAULT '',
  series_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS coach_schedule_team_date_idx ON public.coach_schedule_events(team_id,date);
ALTER TABLE public.coach_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_schedule_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coach_teams, public.coach_schedule_events FROM anon, authenticated;
-- The trusted server's database owner accesses these tables. Browser access is denied.
COMMIT;
