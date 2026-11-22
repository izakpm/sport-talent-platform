BEGIN;
-- NULL preserves unknown sign-in methods on older accounts.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_login_enabled boolean;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_subject text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;
UPDATE public.users SET password_login_enabled=false WHERE email IS NULL OR password_hash LIKE '!managed:%';
CREATE UNIQUE INDEX IF NOT EXISTS users_google_subject_idx ON public.users(google_subject) WHERE google_subject IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
 token_hash text PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 used_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_user_idx ON public.password_reset_tokens(user_id);
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
 bucket text PRIMARY KEY,
 attempts integer NOT NULL,
 expires_at timestamptz NOT NULL
);
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.password_reset_tokens,public.auth_rate_limits FROM anon,authenticated;
COMMIT;
