-- Run once in the existing application's PostgreSQL database before OAuth use.
CREATE TABLE IF NOT EXISTS public.oauth_sessions (
  sid varchar PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS oauth_sessions_expire_idx ON public.oauth_sessions (expire);

-- Enable RLS to prevent access through Supabase's public Data API.
-- The backend database user must own this table or have a suitable RLS policy.
ALTER TABLE public.oauth_sessions ENABLE ROW LEVEL SECURITY;

-- Schedule this cleanup daily using your database scheduler:
-- DELETE FROM public.oauth_sessions WHERE expire < NOW();
