BEGIN;
CREATE TABLE IF NOT EXISTS public.coach_portfolio (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('achievements','history','qualifications')),
 title varchar(160) NOT NULL, organization varchar(160) NOT NULL DEFAULT '',
 role varchar(100) NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
 start_date date NOT NULL, end_date date CHECK(end_date >= start_date),
 certificate_name varchar(180), certificate_mime text, certificate_data bytea,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(certificate_data IS NULL OR (kind='qualifications' AND octet_length(certificate_data) <= 2097152))
);
CREATE INDEX IF NOT EXISTS coach_portfolio_owner_idx ON public.coach_portfolio(coach_id,kind,start_date DESC);
ALTER TABLE public.coach_portfolio ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coach_portfolio FROM anon, authenticated;
COMMIT;
