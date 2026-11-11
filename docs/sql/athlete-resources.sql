BEGIN;
CREATE TABLE IF NOT EXISTS public.resource_publishers (
 user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.athlete_resources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title varchar(160) NOT NULL DEFAULT '', summary varchar(400) NOT NULL DEFAULT '',
 topic text NOT NULL DEFAULT 'mindset' CHECK (topic IN ('mindset','nutrition','training','recovery','life')),
 format text NOT NULL DEFAULT 'video' CHECK (format IN ('video','audio','article','guide')),
 author varchar(160) NOT NULL DEFAULT '', duration_minutes integer CHECK(duration_minutes BETWEEN 1 AND 600),
 body text NOT NULL DEFAULT '', transcript text NOT NULL DEFAULT '', source_url text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 featured boolean NOT NULL DEFAULT false,
 version integer NOT NULL DEFAULT 1,
 created_by uuid NOT NULL REFERENCES public.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
 CHECK (NOT featured OR status='published')
);
CREATE UNIQUE INDEX IF NOT EXISTS resource_one_featured ON public.athlete_resources(featured) WHERE featured;
CREATE TABLE IF NOT EXISTS public.resource_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), resource_id uuid NOT NULL REFERENCES public.athlete_resources(id) ON DELETE CASCADE,
 purpose text NOT NULL CHECK(purpose IN ('thumbnail','media','captions')),
 path text NOT NULL UNIQUE, name varchar(180) NOT NULL, mime text NOT NULL, size bigint NOT NULL,
 uploaded boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.athlete_resources ADD COLUMN IF NOT EXISTS thumbnail_id uuid REFERENCES public.resource_assets(id);
ALTER TABLE public.athlete_resources ADD COLUMN IF NOT EXISTS media_id uuid REFERENCES public.resource_assets(id);
ALTER TABLE public.athlete_resources ADD COLUMN IF NOT EXISTS captions_id uuid REFERENCES public.resource_assets(id);
CREATE INDEX IF NOT EXISTS resources_browse ON public.athlete_resources(status,published_at DESC,id);
ALTER TABLE public.resource_publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_assets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.resource_publishers,public.athlete_resources,public.resource_assets FROM anon,authenticated;
COMMIT;
