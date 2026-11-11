BEGIN;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS training_kind text;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS effort integer CHECK(effort BETWEEN 1 AND 10);
CREATE TABLE IF NOT EXISTS activity_coach_requests(
 activity_id uuid PRIMARY KEY REFERENCES activities(id) ON DELETE CASCADE,
 coach_id uuid NOT NULL REFERENCES users(id),
 status text NOT NULL CHECK(status IN ('pending','verified','declined')),
 request_note text NOT NULL DEFAULT '',
 review_note text NOT NULL DEFAULT '',
 requested_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS activity_requests_coach ON activity_coach_requests(coach_id,status);
ALTER TABLE activity_coach_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON activity_coach_requests FROM anon,authenticated;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON activities FROM anon,authenticated;
COMMIT;
