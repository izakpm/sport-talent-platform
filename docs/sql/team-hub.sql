BEGIN;
ALTER TABLE public.coach_schedule_events ADD COLUMN IF NOT EXISTS cancelled boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS public.coach_player_accounts (
 player_id uuid PRIMARY KEY REFERENCES public.coach_team_players(id) ON DELETE CASCADE,
 team_id uuid NOT NULL REFERENCES public.coach_teams(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 UNIQUE(team_id,user_id)
);
CREATE INDEX IF NOT EXISTS player_accounts_user_idx ON public.coach_player_accounts(user_id);
CREATE TABLE IF NOT EXISTS public.coach_team_posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), team_id uuid NOT NULL REFERENCES public.coach_teams(id) ON DELETE CASCADE,
 coach_id uuid NOT NULL REFERENCES public.users(id), title varchar(120) NOT NULL, body varchar(3000) NOT NULL,
 category text NOT NULL DEFAULT 'announcement' CHECK(category IN ('announcement','reminder','cancellation')),
 event_id uuid REFERENCES public.coach_schedule_events(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS team_posts_date_idx ON public.coach_team_posts(team_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.coach_session_attendance (
 event_id uuid NOT NULL REFERENCES public.coach_schedule_events(id) ON DELETE CASCADE,
 player_id uuid NOT NULL REFERENCES public.coach_team_players(id) ON DELETE CASCADE,
 user_id uuid REFERENCES public.users(id), status text NOT NULL CHECK(status IN ('pending','verified','declined','absent')),
 method text NOT NULL CHECK(method IN ('request','qr','coach')), note varchar(500) NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), reviewed_by uuid REFERENCES public.users(id), reviewed_at timestamptz,
 PRIMARY KEY(event_id,player_id)
);
CREATE INDEX IF NOT EXISTS session_attendance_user_idx ON public.coach_session_attendance(user_id);
CREATE TABLE IF NOT EXISTS public.coach_session_codes (
 event_id uuid PRIMARY KEY REFERENCES public.coach_schedule_events(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL
);
ALTER TABLE public.coach_player_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_team_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_session_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coach_player_accounts,public.coach_team_posts,public.coach_session_attendance,public.coach_session_codes FROM anon,authenticated;
COMMIT;
