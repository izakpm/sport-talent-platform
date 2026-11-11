BEGIN;
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS headline varchar(120) NOT NULL DEFAULT '';
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS specialisms varchar(240) NOT NULL DEFAULT '';
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS coach_profiles_user_unique ON public.coach_profiles(user_id);
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coach_profiles FROM anon,authenticated;
COMMIT;
