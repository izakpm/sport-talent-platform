BEGIN;
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
CREATE TABLE IF NOT EXISTS public.guardian_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 guardian_id uuid NOT NULL REFERENCES public.users(id),
 child_id uuid NOT NULL REFERENCES public.users(id),
 mode text NOT NULL CHECK(mode IN ('managed','view')),
 status text NOT NULL CHECK(status IN ('pending','accepted','revoked','declined')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 coach_code_hash text UNIQUE,
 coach_code_expires timestamptz,
 UNIQUE(guardian_id,child_id), CHECK(guardian_id<>child_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS guardian_managed_child_idx ON public.guardian_links(child_id) WHERE mode='managed';
CREATE INDEX IF NOT EXISTS guardian_child_idx ON public.guardian_links(child_id,status);
ALTER TABLE public.guardian_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.guardian_links FROM anon,authenticated;
COMMIT;
