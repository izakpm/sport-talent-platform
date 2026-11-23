BEGIN;
-- Profile affiliations are descriptive only. Never use these tables for access control.
CREATE TABLE IF NOT EXISTS organisation_directory_sources (
  source text NOT NULL,
  external_key text NOT NULL,
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
  logo_url text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(source, external_key)
);
CREATE INDEX IF NOT EXISTS organisation_directory_sources_org_idx ON organisation_directory_sources(organisation_id);
CREATE TABLE IF NOT EXISTS organisation_affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('ATHLETE','COACH','GUARDIAN')),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','confirmed','rejected','ended')),
  starts_on date NOT NULL DEFAULT CURRENT_DATE,
  ends_on date,
  requested_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  confirmed_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  confirmed_at timestamptz,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility='private'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR ends_on >= starts_on),
  CHECK ((status='ended') = (ends_on IS NOT NULL)),
  CHECK ((confirmed_by_user_id IS NULL) = (confirmed_at IS NULL)),
  CHECK (status <> 'confirmed' OR confirmed_by_user_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS organisation_affiliations_active_unique
  ON organisation_affiliations(user_id,organisation_id,role) WHERE status IN ('requested','confirmed');
CREATE INDEX IF NOT EXISTS organisation_affiliations_user_idx ON organisation_affiliations(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS organisation_affiliations_org_idx ON organisation_affiliations(organisation_id,status);
ALTER TABLE organisation_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_directory_sources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON organisation_affiliations,organisation_directory_sources FROM anon, authenticated;
COMMIT;
