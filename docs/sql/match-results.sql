BEGIN;
CREATE TABLE IF NOT EXISTS match_results (
 event_id uuid PRIMARY KEY REFERENCES coach_schedule_events(id) ON DELETE RESTRICT,
 opponent varchar(120) NOT NULL,
 team_score integer NOT NULL CHECK(team_score BETWEEN 0 AND 999),
 opponent_score integer NOT NULL CHECK(opponent_score BETWEEN 0 AND 999),
 recorded_by uuid NOT NULL REFERENCES users(id),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS athlete_match_stats (
 event_id uuid NOT NULL REFERENCES match_results(event_id) ON DELETE RESTRICT,
 user_id uuid NOT NULL REFERENCES users(id),
 position varchar(80) NOT NULL DEFAULT '',
 minutes integer CHECK(minutes BETWEEN 0 AND 180),
 tries integer CHECK(tries BETWEEN 0 AND 50),
 tackles integer CHECK(tackles BETWEEN 0 AND 200),
 conversions integer CHECK(conversions BETWEEN 0 AND 100),
 penalties integer CHECK(penalties BETWEEN 0 AND 100),
 video_url varchar(2000) NOT NULL DEFAULT '',
 notes varchar(2000) NOT NULL DEFAULT '',
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(event_id,user_id)
);
CREATE INDEX IF NOT EXISTS athlete_match_stats_user ON athlete_match_stats(user_id);
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_match_stats ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON match_results,athlete_match_stats FROM anon,authenticated;
COMMIT;
