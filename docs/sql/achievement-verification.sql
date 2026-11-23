BEGIN;
CREATE TABLE IF NOT EXISTS achievement_coach_requests (
  entry_id uuid PRIMARY KEY REFERENCES athlete_portfolio_entries(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL CHECK(status IN ('pending','verified','declined')),
  request_note text NOT NULL DEFAULT '',
  review_note text NOT NULL DEFAULT '',
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CHECK ((status='pending') = (reviewed_at IS NULL))
);
CREATE INDEX IF NOT EXISTS achievement_requests_coach ON achievement_coach_requests(coach_id,status);
ALTER TABLE achievement_coach_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON achievement_coach_requests FROM anon,authenticated;
COMMIT;
