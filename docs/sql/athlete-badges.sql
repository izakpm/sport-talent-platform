ALTER TABLE athlete_portfolio_entries ADD COLUMN IF NOT EXISTS selection_level text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='athlete_selection_level_valid') THEN
    ALTER TABLE athlete_portfolio_entries ADD CONSTRAINT athlete_selection_level_valid
      CHECK (selection_level IS NULL OR (kind='achievement' AND achievement_type='team_selection' AND selection_level IN ('school','club','provincial','national')));
  END IF;
END $$;
-- Badges are calculated from verified source records; there is no separate editable award counter.
