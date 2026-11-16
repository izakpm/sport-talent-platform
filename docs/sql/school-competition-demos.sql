-- Public competition records, separate from private coach rosters and attendance.
CREATE TABLE IF NOT EXISTS school_competition_profiles (
 organisation_id uuid PRIMARY KEY REFERENCES organisations(id),
 source_key text NOT NULL UNIQUE,
 slug text NOT NULL UNIQUE,
 division text NOT NULL,
 province text,
 logo_url text,
 source_url text NOT NULL,
 is_demo boolean NOT NULL DEFAULT true,
 imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS school_competition_teams (
 id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
 organisation_id uuid NOT NULL REFERENCES school_competition_profiles(organisation_id),
 name text NOT NULL,
 season integer NOT NULL,
 sport text NOT NULL DEFAULT 'Rugby',
 source_url text NOT NULL,
 UNIQUE(organisation_id,name,season)
);
CREATE TABLE IF NOT EXISTS school_competition_fixtures (
 id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
 source_key text NOT NULL UNIQUE,
 home_team_id uuid NOT NULL REFERENCES school_competition_teams(id),
 away_team_id uuid NOT NULL REFERENCES school_competition_teams(id),
 match_date date NOT NULL,
 division text NOT NULL,
 competition text NOT NULL DEFAULT 'Virseker Noordvaal Cup',
 home_score integer CHECK (home_score >= 0),
 away_score integer CHECK (away_score >= 0),
 venue text,
 round text,
 decision_note text,
 source_url text NOT NULL,
 source_label text NOT NULL,
 additional_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
 imported_at timestamptz NOT NULL DEFAULT now(),
 CHECK(home_team_id <> away_team_id),
 CHECK((home_score IS NULL) = (away_score IS NULL)),
 UNIQUE(home_team_id,away_team_id,match_date)
);
CREATE INDEX IF NOT EXISTS school_fixtures_home_idx ON school_competition_fixtures(home_team_id,match_date);
CREATE INDEX IF NOT EXISTS school_fixtures_away_idx ON school_competition_fixtures(away_team_id,match_date);
ALTER TABLE school_competition_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_competition_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_competition_fixtures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON school_competition_profiles,school_competition_teams,school_competition_fixtures FROM anon,authenticated;
