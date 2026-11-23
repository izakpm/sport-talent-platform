BEGIN;
ALTER TABLE athlete_portfolio_entries ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES organisations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS athlete_portfolio_organisation_idx ON athlete_portfolio_entries(organisation_id) WHERE organisation_id IS NOT NULL;
ALTER TABLE athlete_portfolio_entries DROP CONSTRAINT IF EXISTS athlete_portfolio_organisation_kind;
ALTER TABLE athlete_portfolio_entries ADD CONSTRAINT athlete_portfolio_organisation_kind CHECK (organisation_id IS NULL OR kind='achievement');
COMMENT ON COLUMN athlete_portfolio_entries.organisation_id IS 'Optional directory link for achievement branding; grants no membership, team access or verification. organization retains a readable label when unlinked.';
COMMIT;
