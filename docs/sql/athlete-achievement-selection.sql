-- Apply before deploying the API. Existing achievements remain general records.
BEGIN;
ALTER TABLE athlete_portfolio_entries
  ADD COLUMN IF NOT EXISTS achievement_type text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS leadership_role text,
  ADD COLUMN IF NOT EXISTS leadership_date date;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='athlete_achievement_selection_fields' AND conrelid='athlete_portfolio_entries'::regclass) THEN
    ALTER TABLE athlete_portfolio_entries ADD CONSTRAINT athlete_achievement_selection_fields CHECK (
      achievement_type IN ('general','team_selection')
      AND (leadership_role IS NULL OR leadership_role IN ('Captain','Vice-captain'))
      AND (achievement_type='team_selection' OR (leadership_role IS NULL AND leadership_date IS NULL))
      AND (kind='achievement' OR achievement_type='general')
      AND (leadership_date IS NULL OR (leadership_role IS NOT NULL AND leadership_date >= date))
    );
  END IF;
END $$;
COMMENT ON COLUMN athlete_portfolio_entries.date IS 'Achievement date; for team_selection this is the selection date. Metrics use their test date.';
COMMENT ON COLUMN athlete_portfolio_entries.leadership_date IS 'Date appointed to the leadership role; NULL means not recorded, never inferred from selection.';
COMMIT;
