BEGIN;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';
ALTER TABLE athlete_sports ADD COLUMN IF NOT EXISTS primary_position boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS athlete_portfolio_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('achievement','metric')),
 title text NOT NULL,
 date date NOT NULL,
 organization text NOT NULL DEFAULT '',
 notes text NOT NULL DEFAULT '',
 value numeric,
 unit text,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((kind='metric' AND value>0 AND unit IS NOT NULL) OR (kind='achievement' AND value IS NULL AND unit IS NULL))
);
CREATE INDEX IF NOT EXISTS athlete_portfolio_owner ON athlete_portfolio_entries(user_id,date DESC);
ALTER TABLE athlete_portfolio_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON athlete_portfolio_entries FROM anon, authenticated;
COMMIT;
