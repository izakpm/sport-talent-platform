BEGIN;
CREATE TABLE IF NOT EXISTS athlete_calendar_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('practice','gym','video','match','fitness','recovery')),
 date date NOT NULL,
 start_time time NOT NULL,
 end_time time NOT NULL CHECK(end_time>start_time),
 venue text NOT NULL DEFAULT '',
 notes text NOT NULL DEFAULT '',
 cancelled boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS athlete_calendar_month ON athlete_calendar_events(user_id,date);
ALTER TABLE athlete_calendar_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON athlete_calendar_events FROM anon,authenticated;
COMMIT;
