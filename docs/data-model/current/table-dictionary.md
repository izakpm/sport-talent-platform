# Current database dictionary

Captured 2026-11-23T06:19:30.041Z. Public application schema only; metadata, not customer records.

51 tables · 433 columns · 82 foreign keys.

Diagrams show selected fields; this dictionary preserves every column, constraint and index. Nullable means PostgreSQL permits NULL, not that the application always permits omission.

## Identity & account access

### users

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| email | text (text) | YES | — |
| password_hash | text (text) | NO | — |
| role | text (text) | YES | — |
| status | text (text) | YES | 'PENDING'::text |
| created_at | timestamp without time zone (timestamp) | YES | now() |
| last_login | timestamp without time zone (timestamp) | YES | — |
| first_name | text (text) | YES | — |
| last_name | text (text) | YES | — |
| phone | text (text) | YES | — |
| date_of_birth | date (date) | YES | — |
| gender | text (text) | YES | — |
| profile_image | text (text) | YES | — |
| password_login_enabled | boolean (bool) | YES | — |
| google_subject | text (text) | YES | — |
| session_version | integer (int4) | NO | 0 |

Constraints:

- **users_role_check**: `CHECK (role = ANY (ARRAY['ATHLETE'::text, 'GUARDIAN'::text, 'COACH'::text, 'SCOUT'::text, 'ADMIN'::text, 'SCHOOL'::text]))`
- **users_status_check**: `CHECK (status = ANY (ARRAY['ACTIVE'::text, 'PENDING'::text, 'SUSPENDED'::text]))`
- **users_pkey**: `PRIMARY KEY (id)`
- **users_email_key**: `UNIQUE (email)`

Indexes:

- `CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)`
- `CREATE UNIQUE INDEX users_google_subject_idx ON public.users USING btree (google_subject) WHERE (google_subject IS NOT NULL)`
- `CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### athlete_profiles

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| user_id | uuid (uuid) | YES | — |
| nationality | text (text) | YES | — |
| province | text (text) | YES | — |
| school_id | uuid (uuid) | YES | — |
| guardian_id | uuid (uuid) | YES | — |
| profile_visibility | text (text) | YES | — |
| bio | text (text) | NO | ''::text |

Constraints:

- **athlete_profiles_guardian_id_fkey**: `FOREIGN KEY (guardian_id) REFERENCES guardian_profiles(id)`
- **athlete_profiles_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id)`
- **athlete_profiles_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX athlete_profiles_pkey ON public.athlete_profiles USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### coach_profiles

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| user_id | uuid (uuid) | YES | — |
| organisation_id | uuid (uuid) | YES | — |
| sport_id | uuid (uuid) | YES | — |
| verification_status | text (text) | YES | — |
| full_name | text (text) | YES | — |
| phone | text (text) | YES | — |
| years_experience | integer (int4) | YES | — |
| primary_sport | text (text) | YES | — |
| coaching_level | text (text) | YES | — |
| certifications | text (text) | YES | — |
| previous_teams | text (text) | YES | — |
| achievements | text (text) | YES | — |
| location | text (text) | YES | — |
| headline | character varying (varchar) | NO | ''::character varying |
| specialisms | character varying (varchar) | NO | ''::character varying |
| bio | text (text) | NO | ''::text |

Constraints:

- **coach_profiles_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id)`
- **coach_profiles_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX coach_profiles_pkey ON public.coach_profiles USING btree (id)`
- `CREATE UNIQUE INDEX coach_profiles_user_unique ON public.coach_profiles USING btree (user_id)`

Row-level security: enabled; forced: no; public policies: 0.

### guardian_profiles

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| user_id | uuid (uuid) | YES | — |
| name | text (text) | YES | — |
| phone | text (text) | YES | — |
| relationship | text (text) | YES | — |
| consent_status | text (text) | YES | — |
| consent_timestamp | timestamp without time zone (timestamp) | YES | — |

Constraints:

- **guardian_profiles_consent_status_check**: `CHECK (consent_status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text]))`
- **guardian_profiles_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id)`
- **guardian_profiles_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX guardian_profiles_pkey ON public.guardian_profiles USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### guardian_links

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| guardian_id | uuid (uuid) | NO | — |
| child_id | uuid (uuid) | NO | — |
| mode | text (text) | NO | — |
| status | text (text) | NO | — |
| created_at | timestamp with time zone (timestamptz) | NO | now() |
| updated_at | timestamp with time zone (timestamptz) | NO | now() |
| coach_code_hash | text (text) | YES | — |
| coach_code_expires | timestamp with time zone (timestamptz) | YES | — |

Constraints:

- **guardian_links_check**: `CHECK (guardian_id <> child_id)`
- **guardian_links_mode_check**: `CHECK (mode = ANY (ARRAY['managed'::text, 'view'::text]))`
- **guardian_links_status_check**: `CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'revoked'::text, 'declined'::text]))`
- **guardian_links_child_id_fkey**: `FOREIGN KEY (child_id) REFERENCES users(id)`
- **guardian_links_guardian_id_fkey**: `FOREIGN KEY (guardian_id) REFERENCES users(id)`
- **guardian_links_pkey**: `PRIMARY KEY (id)`
- **guardian_links_coach_code_hash_key**: `UNIQUE (coach_code_hash)`
- **guardian_links_guardian_id_child_id_key**: `UNIQUE (guardian_id, child_id)`

Indexes:

- `CREATE INDEX guardian_child_idx ON public.guardian_links USING btree (child_id, status)`
- `CREATE UNIQUE INDEX guardian_links_coach_code_hash_key ON public.guardian_links USING btree (coach_code_hash)`
- `CREATE UNIQUE INDEX guardian_links_guardian_id_child_id_key ON public.guardian_links USING btree (guardian_id, child_id)`
- `CREATE UNIQUE INDEX guardian_links_pkey ON public.guardian_links USING btree (id)`
- `CREATE UNIQUE INDEX guardian_managed_child_idx ON public.guardian_links USING btree (child_id) WHERE (mode = 'managed'::text)`

Row-level security: enabled; forced: no; public policies: 0.

### scout_profiles

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| user_id | uuid (uuid) | YES | — |
| organisation_id | uuid (uuid) | YES | — |
| sport_id | uuid (uuid) | YES | — |
| regions_of_interest | text (text) | YES | — |
| verification_status | text (text) | YES | — |
| full_name | text (text) | YES | — |
| organisation_name | text (text) | YES | — |
| sports_of_interest | text (text) | YES | — |

Constraints:

- **scout_profiles_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id)`
- **scout_profiles_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX scout_profiles_pkey ON public.scout_profiles USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### password_reset_tokens

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| token_hash | text (text) | NO | — |
| user_id | uuid (uuid) | NO | — |
| expires_at | timestamp with time zone (timestamptz) | NO | — |
| used_at | timestamp with time zone (timestamptz) | YES | — |
| created_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **password_reset_tokens_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- **password_reset_tokens_pkey**: `PRIMARY KEY (token_hash)`

Indexes:

- `CREATE UNIQUE INDEX password_reset_tokens_pkey ON public.password_reset_tokens USING btree (token_hash)`
- `CREATE INDEX password_reset_user_idx ON public.password_reset_tokens USING btree (user_id)`

Row-level security: enabled; forced: no; public policies: 0.

### oauth_sessions

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| sid | character varying (varchar) | NO | — |
| sess | json (json) | NO | — |
| expire | timestamp without time zone (timestamp) | NO | — |

Constraints:

- **oauth_sessions_pkey**: `PRIMARY KEY (sid)`

Indexes:

- `CREATE INDEX oauth_sessions_expire_idx ON public.oauth_sessions USING btree (expire)`
- `CREATE UNIQUE INDEX oauth_sessions_pkey ON public.oauth_sessions USING btree (sid)`

Row-level security: enabled; forced: no; public policies: 0.

### auth_rate_limits

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| bucket | text (text) | NO | — |
| attempts | integer (int4) | NO | — |
| expires_at | timestamp with time zone (timestamptz) | NO | — |

Constraints:

- **auth_rate_limits_pkey**: `PRIMARY KEY (bucket)`

Indexes:

- `CREATE UNIQUE INDEX auth_rate_limits_pkey ON public.auth_rate_limits USING btree (bucket)`

Row-level security: enabled; forced: no; public policies: 0.

## Sports & sporting portfolios

### sports

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| name | text (text) | YES | — |
| category | text (text) | YES | — |
| icon | text (text) | YES | — |

Constraints:

- **sports_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX sports_pkey ON public.sports USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### positions

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| sport_id | uuid (uuid) | YES | — |
| name | text (text) | YES | — |

Constraints:

- **positions_sport_id_fkey**: `FOREIGN KEY (sport_id) REFERENCES sports(id)`
- **positions_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX positions_pkey ON public.positions USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### athlete_sports

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| athlete_id | uuid (uuid) | YES | — |
| sport_id | uuid (uuid) | YES | — |
| position_id | uuid (uuid) | YES | — |
| is_primary | boolean (bool) | YES | false |
| primary_position | boolean (bool) | NO | false |

Constraints:

- **athlete_sports_athlete_id_fkey**: `FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) ON DELETE CASCADE`
- **athlete_sports_position_id_fkey**: `FOREIGN KEY (position_id) REFERENCES positions(id)`
- **athlete_sports_sport_id_fkey**: `FOREIGN KEY (sport_id) REFERENCES sports(id)`
- **athlete_sports_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX athlete_sports_pkey ON public.athlete_sports USING btree (id)`
- `CREATE UNIQUE INDEX one_primary_sport_per_athlete ON public.athlete_sports USING btree (athlete_id) WHERE (is_primary = true)`

Row-level security: enabled; forced: no; public policies: 0.

### athlete_sport_profiles

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| athlete_id | uuid (uuid) | YES | — |
| sport_id | uuid (uuid) | YES | — |
| primary_sport | boolean (bool) | YES | — |
| position | text (text) | YES | — |
| level | text (text) | YES | — |
| years_experience | integer (int4) | YES | — |

Constraints:

- **athlete_sport_profiles_athlete_id_fkey**: `FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id)`
- **athlete_sport_profiles_sport_id_fkey**: `FOREIGN KEY (sport_id) REFERENCES sports(id)`
- **athlete_sport_profiles_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX athlete_sport_profiles_pkey ON public.athlete_sport_profiles USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### athlete_sport_positions

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| athlete_id | uuid (uuid) | YES | — |
| sport_id | uuid (uuid) | YES | — |
| position_id | uuid (uuid) | YES | — |
| is_primary | boolean (bool) | YES | false |

Constraints:

- **athlete_sport_positions_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX athlete_sport_positions_pkey ON public.athlete_sport_positions USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### metrics

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| name | text (text) | YES | — |
| unit | text (text) | YES | — |
| category | text (text) | YES | — |
| sport_id | uuid (uuid) | YES | — |
| is_time_series | boolean (bool) | YES | true |

Constraints:

- **metrics_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX metrics_pkey ON public.metrics USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### athlete_portfolio_entries

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| user_id | uuid (uuid) | NO | — |
| kind | text (text) | NO | — |
| title | text (text) | NO | — |
| date | date (date) | NO | — |
| organization | text (text) | NO | ''::text |
| notes | text (text) | NO | ''::text |
| value | numeric (numeric) | YES | — |
| unit | text (text) | YES | — |
| created_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **athlete_portfolio_entries_check**: `CHECK (kind = 'metric'::text AND value > 0::numeric AND unit IS NOT NULL OR kind = 'achievement'::text AND value IS NULL AND unit IS NULL)`
- **athlete_portfolio_entries_kind_check**: `CHECK (kind = ANY (ARRAY['achievement'::text, 'metric'::text]))`
- **athlete_portfolio_entries_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- **athlete_portfolio_entries_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX athlete_portfolio_entries_pkey ON public.athlete_portfolio_entries USING btree (id)`
- `CREATE INDEX athlete_portfolio_owner ON public.athlete_portfolio_entries USING btree (user_id, date DESC)`

Row-level security: enabled; forced: no; public policies: 0.

### coach_portfolio

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| coach_id | uuid (uuid) | NO | — |
| kind | text (text) | NO | — |
| title | character varying (varchar) | NO | — |
| organization | character varying (varchar) | NO | ''::character varying |
| role | character varying (varchar) | NO | ''::character varying |
| notes | text (text) | NO | ''::text |
| start_date | date (date) | NO | — |
| end_date | date (date) | YES | — |
| certificate_name | character varying (varchar) | YES | — |
| certificate_mime | text (text) | YES | — |
| certificate_data | bytea (bytea) | YES | — |
| created_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **coach_portfolio_check**: `CHECK (end_date >= start_date)`
- **coach_portfolio_check1**: `CHECK (certificate_data IS NULL OR kind = 'qualifications'::text AND octet_length(certificate_data) <= 2097152)`
- **coach_portfolio_kind_check**: `CHECK (kind = ANY (ARRAY['achievements'::text, 'history'::text, 'qualifications'::text]))`
- **coach_portfolio_coach_id_fkey**: `FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE`
- **coach_portfolio_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE INDEX coach_portfolio_owner_idx ON public.coach_portfolio USING btree (coach_id, kind, start_date DESC)`
- `CREATE UNIQUE INDEX coach_portfolio_pkey ON public.coach_portfolio USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

## Coach teams & invitations

### coach_teams

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| coach_id | uuid (uuid) | NO | — |
| name | character varying (varchar) | NO | — |
| age_group | character varying (varchar) | NO | — |
| sport | character varying (varchar) | NO | 'Rugby'::character varying |
| venue | character varying (varchar) | NO | ''::character varying |
| timezone | character varying (varchar) | NO | 'Africa/Johannesburg'::character varying |
| created_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **coach_teams_coach_id_fkey**: `FOREIGN KEY (coach_id) REFERENCES users(id)`
- **coach_teams_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE INDEX coach_teams_owner_idx ON public.coach_teams USING btree (coach_id)`
- `CREATE UNIQUE INDEX coach_teams_pkey ON public.coach_teams USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### coach_team_players

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| team_id | uuid (uuid) | NO | — |
| first_name | character varying (varchar) | NO | — |
| last_name | character varying (varchar) | NO | — |
| position | character varying (varchar) | NO | ''::character varying |
| shirt_number | integer (int4) | YES | — |
| is_captain | boolean (bool) | NO | false |
| status | character varying (varchar) | NO | 'active'::character varying |
| created_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **coach_team_players_shirt_number_check**: `CHECK (shirt_number >= 1 AND shirt_number <= 99)`
- **coach_team_players_status_check**: `CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying]::text[]))`
- **coach_team_players_team_id_fkey**: `FOREIGN KEY (team_id) REFERENCES coach_teams(id) ON DELETE CASCADE`
- **coach_team_players_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX coach_players_active_number_idx ON public.coach_team_players USING btree (team_id, shirt_number) WHERE (((status)::text = 'active'::text) AND (shirt_number IS NOT NULL))`
- `CREATE INDEX coach_players_team_idx ON public.coach_team_players USING btree (team_id)`
- `CREATE UNIQUE INDEX coach_team_players_pkey ON public.coach_team_players USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### coach_player_accounts

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| player_id | uuid (uuid) | NO | — |
| team_id | uuid (uuid) | NO | — |
| user_id | uuid (uuid) | NO | — |

Constraints:

- **coach_player_accounts_player_id_fkey**: `FOREIGN KEY (player_id) REFERENCES coach_team_players(id) ON DELETE CASCADE`
- **coach_player_accounts_team_id_fkey**: `FOREIGN KEY (team_id) REFERENCES coach_teams(id) ON DELETE CASCADE`
- **coach_player_accounts_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- **coach_player_accounts_pkey**: `PRIMARY KEY (player_id)`
- **coach_player_accounts_team_id_user_id_key**: `UNIQUE (team_id, user_id)`

Indexes:

- `CREATE UNIQUE INDEX coach_player_accounts_pkey ON public.coach_player_accounts USING btree (player_id)`
- `CREATE UNIQUE INDEX coach_player_accounts_team_id_user_id_key ON public.coach_player_accounts USING btree (team_id, user_id)`
- `CREATE INDEX player_accounts_user_idx ON public.coach_player_accounts USING btree (user_id)`

Row-level security: enabled; forced: no; public policies: 0.

### team_invitations

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| team_id | uuid (uuid) | NO | — |
| coach_id | uuid (uuid) | NO | — |
| token_hash | text (text) | NO | — |
| status | text (text) | NO | 'open'::text |
| guardian_id | uuid (uuid) | YES | — |
| child_id | uuid (uuid) | YES | — |
| created_at | timestamp with time zone (timestamptz) | NO | now() |
| expires_at | timestamp with time zone (timestamptz) | NO | (now() + '7 days'::interval) |
| accepted_at | timestamp with time zone (timestamptz) | YES | — |
| decided_at | timestamp with time zone (timestamptz) | YES | — |
| acceptance_mode | text (text) | NO | 'managed'::text |
| parent_required | boolean (bool) | NO | false |
| parent_approved_at | timestamp with time zone (timestamptz) | YES | — |
| guardian_link_id | uuid (uuid) | YES | — |

Constraints:

- **team_invitations_acceptance_mode_check**: `CHECK (acceptance_mode = ANY (ARRAY['managed'::text, 'athlete'::text]))`
- **team_invitations_status_check**: `CHECK (status = ANY (ARRAY['open'::text, 'awaiting_parent'::text, 'pending'::text, 'confirmed'::text, 'declined'::text, 'revoked'::text, 'withdrawn'::text]))`
- **team_invitations_child_id_fkey**: `FOREIGN KEY (child_id) REFERENCES users(id)`
- **team_invitations_coach_id_fkey**: `FOREIGN KEY (coach_id) REFERENCES users(id)`
- **team_invitations_guardian_id_fkey**: `FOREIGN KEY (guardian_id) REFERENCES users(id)`
- **team_invitations_guardian_link_id_fkey**: `FOREIGN KEY (guardian_link_id) REFERENCES guardian_links(id)`
- **team_invitations_team_id_fkey**: `FOREIGN KEY (team_id) REFERENCES coach_teams(id) ON DELETE CASCADE`
- **team_invitations_pkey**: `PRIMARY KEY (id)`
- **team_invitations_token_hash_key**: `UNIQUE (token_hash)`

Indexes:

- `CREATE UNIQUE INDEX team_invitations_pkey ON public.team_invitations USING btree (id)`
- `CREATE UNIQUE INDEX team_invitations_token_hash_key ON public.team_invitations USING btree (token_hash)`
- `CREATE INDEX team_invites_athlete_idx ON public.team_invitations USING btree (child_id, created_at DESC)`
- `CREATE INDEX team_invites_parent_idx ON public.team_invitations USING btree (guardian_id)`
- `CREATE INDEX team_invites_team_idx ON public.team_invitations USING btree (team_id, created_at DESC)`

Row-level security: enabled; forced: no; public policies: 0.

## Calendars, attendance, matches & feed

### coach_schedule_events

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| team_id | uuid (uuid) | NO | — |
| title | character varying (varchar) | NO | — |
| kind | character varying (varchar) | NO | — |
| date | date (date) | NO | — |
| start_time | time without time zone (time) | NO | — |
| end_time | time without time zone (time) | NO | — |
| venue | character varying (varchar) | NO | ''::character varying |
| notes | character varying (varchar) | NO | ''::character varying |
| series_id | uuid (uuid) | YES | — |
| created_at | timestamp with time zone (timestamptz) | NO | now() |
| cancelled | boolean (bool) | NO | false |
| competition_code | character varying (varchar) | YES | — |
| competition_label | character varying (varchar) | YES | — |

Constraints:

- **coach_schedule_events_check**: `CHECK (end_time > start_time)`
- **coach_schedule_events_kind_check**: `CHECK (kind::text = ANY (ARRAY['practice'::character varying, 'gym'::character varying, 'video'::character varying, 'match'::character varying, 'fitness'::character varying, 'recovery'::character varying]::text[]))`
- **coach_schedule_events_team_id_fkey**: `FOREIGN KEY (team_id) REFERENCES coach_teams(id) ON DELETE CASCADE`
- **coach_schedule_events_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX coach_schedule_events_pkey ON public.coach_schedule_events USING btree (id)`
- `CREATE INDEX coach_schedule_team_date_idx ON public.coach_schedule_events USING btree (team_id, date)`

Row-level security: enabled; forced: no; public policies: 0.

### athlete_calendar_events

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| user_id | uuid (uuid) | NO | — |
| title | text (text) | NO | — |
| kind | text (text) | NO | — |
| date | date (date) | NO | — |
| start_time | time without time zone (time) | NO | — |
| end_time | time without time zone (time) | NO | — |
| venue | text (text) | NO | ''::text |
| notes | text (text) | NO | ''::text |
| cancelled | boolean (bool) | NO | false |
| created_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **athlete_calendar_events_check**: `CHECK (end_time > start_time)`
- **athlete_calendar_events_kind_check**: `CHECK (kind = ANY (ARRAY['practice'::text, 'gym'::text, 'video'::text, 'match'::text, 'fitness'::text, 'recovery'::text]))`
- **athlete_calendar_events_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- **athlete_calendar_events_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX athlete_calendar_events_pkey ON public.athlete_calendar_events USING btree (id)`
- `CREATE INDEX athlete_calendar_month ON public.athlete_calendar_events USING btree (user_id, date)`

Row-level security: enabled; forced: no; public policies: 0.

### coach_session_attendance

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| event_id | uuid (uuid) | NO | — |
| player_id | uuid (uuid) | NO | — |
| user_id | uuid (uuid) | YES | — |
| status | text (text) | NO | — |
| method | text (text) | NO | — |
| note | character varying (varchar) | NO | ''::character varying |
| created_at | timestamp with time zone (timestamptz) | NO | now() |
| reviewed_by | uuid (uuid) | YES | — |
| reviewed_at | timestamp with time zone (timestamptz) | YES | — |

Constraints:

- **coach_session_attendance_method_check**: `CHECK (method = ANY (ARRAY['request'::text, 'qr'::text, 'coach'::text]))`
- **coach_session_attendance_status_check**: `CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'declined'::text, 'absent'::text]))`
- **coach_session_attendance_event_id_fkey**: `FOREIGN KEY (event_id) REFERENCES coach_schedule_events(id) ON DELETE CASCADE`
- **coach_session_attendance_player_id_fkey**: `FOREIGN KEY (player_id) REFERENCES coach_team_players(id) ON DELETE CASCADE`
- **coach_session_attendance_reviewed_by_fkey**: `FOREIGN KEY (reviewed_by) REFERENCES users(id)`
- **coach_session_attendance_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id)`
- **coach_session_attendance_pkey**: `PRIMARY KEY (event_id, player_id)`

Indexes:

- `CREATE UNIQUE INDEX coach_session_attendance_pkey ON public.coach_session_attendance USING btree (event_id, player_id)`
- `CREATE INDEX session_attendance_user_idx ON public.coach_session_attendance USING btree (user_id)`

Row-level security: enabled; forced: no; public policies: 0.

### coach_session_codes

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| event_id | uuid (uuid) | NO | — |
| token_hash | text (text) | NO | — |
| expires_at | timestamp with time zone (timestamptz) | NO | — |

Constraints:

- **coach_session_codes_event_id_fkey**: `FOREIGN KEY (event_id) REFERENCES coach_schedule_events(id) ON DELETE CASCADE`
- **coach_session_codes_pkey**: `PRIMARY KEY (event_id)`
- **coach_session_codes_token_hash_key**: `UNIQUE (token_hash)`

Indexes:

- `CREATE UNIQUE INDEX coach_session_codes_pkey ON public.coach_session_codes USING btree (event_id)`
- `CREATE UNIQUE INDEX coach_session_codes_token_hash_key ON public.coach_session_codes USING btree (token_hash)`

Row-level security: enabled; forced: no; public policies: 0.

### coach_team_posts

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| team_id | uuid (uuid) | NO | — |
| coach_id | uuid (uuid) | NO | — |
| title | character varying (varchar) | NO | — |
| body | character varying (varchar) | NO | — |
| category | text (text) | NO | 'announcement'::text |
| event_id | uuid (uuid) | YES | — |
| created_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **coach_team_posts_category_check**: `CHECK (category = ANY (ARRAY['announcement'::text, 'reminder'::text, 'session_update'::text, 'cancellation'::text]))`
- **coach_team_posts_coach_id_fkey**: `FOREIGN KEY (coach_id) REFERENCES users(id)`
- **coach_team_posts_event_id_fkey**: `FOREIGN KEY (event_id) REFERENCES coach_schedule_events(id) ON DELETE SET NULL`
- **coach_team_posts_team_id_fkey**: `FOREIGN KEY (team_id) REFERENCES coach_teams(id) ON DELETE CASCADE`
- **coach_team_posts_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX coach_team_posts_pkey ON public.coach_team_posts USING btree (id)`
- `CREATE INDEX team_posts_date_idx ON public.coach_team_posts USING btree (team_id, created_at DESC)`

Row-level security: enabled; forced: no; public policies: 0.

### match_results

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| event_id | uuid (uuid) | NO | — |
| opponent | character varying (varchar) | NO | — |
| team_score | integer (int4) | NO | — |
| opponent_score | integer (int4) | NO | — |
| recorded_by | uuid (uuid) | NO | — |
| updated_at | timestamp with time zone (timestamptz) | NO | now() |
| source_label | character varying (varchar) | YES | — |
| source_url | character varying (varchar) | YES | — |
| outcome_override | character varying (varchar) | YES | — |
| decision_note | character varying (varchar) | YES | — |

Constraints:

- **match_results_opponent_score_check**: `CHECK (opponent_score >= 0 AND opponent_score <= 999)`
- **match_results_outcome_override_check**: `CHECK (outcome_override::text = ANY (ARRAY['Win'::character varying, 'Loss'::character varying]::text[]))`
- **match_results_team_score_check**: `CHECK (team_score >= 0 AND team_score <= 999)`
- **match_results_event_id_fkey**: `FOREIGN KEY (event_id) REFERENCES coach_schedule_events(id) ON DELETE RESTRICT`
- **match_results_recorded_by_fkey**: `FOREIGN KEY (recorded_by) REFERENCES users(id)`
- **match_results_pkey**: `PRIMARY KEY (event_id)`

Indexes:

- `CREATE UNIQUE INDEX match_results_pkey ON public.match_results USING btree (event_id)`

Row-level security: enabled; forced: no; public policies: 0.

### athlete_match_stats

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| event_id | uuid (uuid) | NO | — |
| user_id | uuid (uuid) | NO | — |
| position | character varying (varchar) | NO | ''::character varying |
| minutes | integer (int4) | YES | — |
| tries | integer (int4) | YES | — |
| tackles | integer (int4) | YES | — |
| conversions | integer (int4) | YES | — |
| penalties | integer (int4) | YES | — |
| video_url | character varying (varchar) | NO | ''::character varying |
| notes | character varying (varchar) | NO | ''::character varying |
| updated_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **athlete_match_stats_conversions_check**: `CHECK (conversions >= 0 AND conversions <= 100)`
- **athlete_match_stats_minutes_check**: `CHECK (minutes >= 0 AND minutes <= 180)`
- **athlete_match_stats_penalties_check**: `CHECK (penalties >= 0 AND penalties <= 100)`
- **athlete_match_stats_tackles_check**: `CHECK (tackles >= 0 AND tackles <= 200)`
- **athlete_match_stats_tries_check**: `CHECK (tries >= 0 AND tries <= 50)`
- **athlete_match_stats_event_id_fkey**: `FOREIGN KEY (event_id) REFERENCES match_results(event_id) ON DELETE RESTRICT`
- **athlete_match_stats_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id)`
- **athlete_match_stats_pkey**: `PRIMARY KEY (event_id, user_id)`

Indexes:

- `CREATE UNIQUE INDEX athlete_match_stats_pkey ON public.athlete_match_stats USING btree (event_id, user_id)`
- `CREATE INDEX athlete_match_stats_user ON public.athlete_match_stats USING btree (user_id)`

Row-level security: enabled; forced: no; public policies: 0.

## Training & verification

### activities

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| athlete_id | uuid (uuid) | YES | — |
| sport_id | uuid (uuid) | YES | — |
| title | text (text) | YES | — |
| description | text (text) | YES | — |
| start_time | timestamp without time zone (timestamp) | YES | — |
| end_time | timestamp without time zone (timestamp) | YES | — |
| duration_minutes | integer (int4) | YES | — |
| location | text (text) | YES | — |
| created_at | timestamp without time zone (timestamp) | YES | now() |
| activity_type_id | uuid (uuid) | YES | — |
| training_kind | text (text) | YES | — |
| effort | integer (int4) | YES | — |

Constraints:

- **activities_effort_check**: `CHECK (effort >= 1 AND effort <= 10)`
- **activities_athlete_id_fkey**: `FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id)`
- **activities_sport_id_fkey**: `FOREIGN KEY (sport_id) REFERENCES sports(id)`
- **fk_activity_type**: `FOREIGN KEY (activity_type_id) REFERENCES activity_types(id)`
- **activities_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX activities_pkey ON public.activities USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### activity_types

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| name | text (text) | NO | — |
| category | text (text) | NO | — |
| description | text (text) | YES | — |
| created_at | timestamp without time zone (timestamp) | YES | now() |

Constraints:

- **activity_types_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX activity_types_pkey ON public.activity_types USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### activity_metrics

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| activity_id | uuid (uuid) | YES | — |
| metric_id | uuid (uuid) | YES | — |
| value | numeric (numeric) | YES | — |
| unit | text (text) | YES | — |

Constraints:

- **activity_metrics_activity_id_fkey**: `FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE`
- **activity_metrics_metric_id_fkey**: `FOREIGN KEY (metric_id) REFERENCES metrics(id)`
- **activity_metrics_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX activity_metrics_pkey ON public.activity_metrics USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### activity_coach_requests

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| activity_id | uuid (uuid) | NO | — |
| coach_id | uuid (uuid) | NO | — |
| status | text (text) | NO | — |
| request_note | text (text) | NO | ''::text |
| review_note | text (text) | NO | ''::text |
| requested_at | timestamp with time zone (timestamptz) | NO | now() |
| reviewed_at | timestamp with time zone (timestamptz) | YES | — |

Constraints:

- **activity_coach_requests_status_check**: `CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'declined'::text]))`
- **activity_coach_requests_activity_id_fkey**: `FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE`
- **activity_coach_requests_coach_id_fkey**: `FOREIGN KEY (coach_id) REFERENCES users(id)`
- **activity_coach_requests_pkey**: `PRIMARY KEY (activity_id)`

Indexes:

- `CREATE UNIQUE INDEX activity_coach_requests_pkey ON public.activity_coach_requests USING btree (activity_id)`
- `CREATE INDEX activity_requests_coach ON public.activity_coach_requests USING btree (coach_id, status)`

Row-level security: enabled; forced: no; public policies: 0.

### activity_verifications

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| activity_id | uuid (uuid) | YES | — |
| method | text (text) | YES | — |
| verification_level | text (text) | YES | — |
| verified_by_user_id | uuid (uuid) | YES | — |
| organisation_id | uuid (uuid) | YES | — |
| token_id | uuid (uuid) | YES | — |
| confidence_score | numeric (numeric) | YES | — |
| status | text (text) | YES | — |
| verified_at | timestamp without time zone (timestamp) | YES | — |

Constraints:

- **activity_verifications_activity_id_fkey**: `FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE`
- **activity_verifications_organisation_id_fkey**: `FOREIGN KEY (organisation_id) REFERENCES organisations(id)`
- **activity_verifications_token_id_fkey**: `FOREIGN KEY (token_id) REFERENCES verification_tokens(id)`
- **activity_verifications_verified_by_user_id_fkey**: `FOREIGN KEY (verified_by_user_id) REFERENCES users(id)`
- **activity_verifications_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX activity_verifications_pkey ON public.activity_verifications USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### verification_requests

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| activity_id | uuid (uuid) | YES | — |
| requested_by_athlete_id | uuid (uuid) | YES | — |
| coach_id | uuid (uuid) | YES | — |
| message | text (text) | YES | — |
| status | text (text) | YES | — |
| responded_at | timestamp without time zone (timestamp) | YES | — |
| athlete_id | uuid (uuid) | YES | — |

Constraints:

- **verification_requests_activity_id_fkey**: `FOREIGN KEY (activity_id) REFERENCES activities(id)`
- **verification_requests_requested_by_athlete_id_fkey**: `FOREIGN KEY (requested_by_athlete_id) REFERENCES athlete_profiles(id)`
- **verification_requests_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX verification_requests_pkey ON public.verification_requests USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### verification_tokens

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| code | text (text) | YES | — |
| issued_to_user_id | uuid (uuid) | YES | — |
| organisation_id | uuid (uuid) | YES | — |
| type | text (text) | YES | — |
| expires_at | timestamp without time zone (timestamp) | YES | — |
| usage_limit | integer (int4) | YES | — |
| created_at | timestamp without time zone (timestamp) | YES | now() |

Constraints:

- **verification_tokens_issued_to_user_id_fkey**: `FOREIGN KEY (issued_to_user_id) REFERENCES users(id)`
- **verification_tokens_organisation_id_fkey**: `FOREIGN KEY (organisation_id) REFERENCES organisations(id)`
- **verification_tokens_pkey**: `PRIMARY KEY (id)`
- **verification_tokens_code_key**: `UNIQUE (code)`

Indexes:

- `CREATE UNIQUE INDEX verification_tokens_code_key ON public.verification_tokens USING btree (code)`
- `CREATE UNIQUE INDEX verification_tokens_pkey ON public.verification_tokens USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

## Organisations & school competitions

### organisations

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| name | text (text) | YES | — |
| type | text (text) | YES | — |
| location | text (text) | YES | — |
| verification_status | text (text) | YES | — |
| created_at | timestamp without time zone (timestamp) | YES | now() |
| contact_person | text (text) | YES | — |
| email | text (text) | YES | — |
| phone | text (text) | YES | — |
| website | text (text) | YES | — |
| address | text (text) | YES | — |
| description | text (text) | YES | — |

Constraints:

- **organisations_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX organisations_pkey ON public.organisations USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### organisation_users

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| user_id | uuid (uuid) | YES | — |
| organisation_id | uuid (uuid) | YES | — |
| role | text (text) | YES | — |

Constraints:

- **organisation_users_organisation_id_fkey**: `FOREIGN KEY (organisation_id) REFERENCES organisations(id)`
- **organisation_users_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id)`
- **organisation_users_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX organisation_users_pkey ON public.organisation_users USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### organisation_affiliations

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| user_id | uuid (uuid) | NO | — |
| organisation_id | uuid (uuid) | NO | — |
| role | text (text) | NO | — |
| status | text (text) | NO | 'requested'::text |
| starts_on | date (date) | NO | CURRENT_DATE |
| ends_on | date (date) | YES | — |
| requested_by_user_id | uuid (uuid) | NO | — |
| confirmed_by_user_id | uuid (uuid) | YES | — |
| confirmed_at | timestamp with time zone (timestamptz) | YES | — |
| visibility | text (text) | NO | 'private'::text |
| created_at | timestamp with time zone (timestamptz) | NO | now() |
| updated_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **organisation_affiliations_check**: `CHECK (ends_on IS NULL OR ends_on >= starts_on)`
- **organisation_affiliations_check1**: `CHECK ((status = 'ended'::text) = (ends_on IS NOT NULL))`
- **organisation_affiliations_check2**: `CHECK ((confirmed_by_user_id IS NULL) = (confirmed_at IS NULL))`
- **organisation_affiliations_check3**: `CHECK (status <> 'confirmed'::text OR confirmed_by_user_id IS NOT NULL)`
- **organisation_affiliations_role_check**: `CHECK (role = ANY (ARRAY['ATHLETE'::text, 'COACH'::text, 'GUARDIAN'::text]))`
- **organisation_affiliations_status_check**: `CHECK (status = ANY (ARRAY['requested'::text, 'confirmed'::text, 'rejected'::text, 'ended'::text]))`
- **organisation_affiliations_visibility_check**: `CHECK (visibility = 'private'::text)`
- **organisation_affiliations_confirmed_by_user_id_fkey**: `FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT`
- **organisation_affiliations_organisation_id_fkey**: `FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE RESTRICT`
- **organisation_affiliations_requested_by_user_id_fkey**: `FOREIGN KEY (requested_by_user_id) REFERENCES users(id) ON DELETE RESTRICT`
- **organisation_affiliations_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT`
- **organisation_affiliations_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX organisation_affiliations_active_unique ON public.organisation_affiliations USING btree (user_id, organisation_id, role) WHERE (status = ANY (ARRAY['requested'::text, 'confirmed'::text]))`
- `CREATE INDEX organisation_affiliations_org_idx ON public.organisation_affiliations USING btree (organisation_id, status)`
- `CREATE UNIQUE INDEX organisation_affiliations_pkey ON public.organisation_affiliations USING btree (id)`
- `CREATE INDEX organisation_affiliations_user_idx ON public.organisation_affiliations USING btree (user_id, created_at DESC)`

Row-level security: enabled; forced: no; public policies: 0.

### organisation_directory_sources

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| source | text (text) | NO | — |
| external_key | text (text) | NO | — |
| organisation_id | uuid (uuid) | NO | — |
| logo_url | text (text) | YES | — |
| source_url | text (text) | YES | — |
| created_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **organisation_directory_sources_organisation_id_fkey**: `FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE RESTRICT`
- **organisation_directory_sources_pkey**: `PRIMARY KEY (source, external_key)`

Indexes:

- `CREATE INDEX organisation_directory_sources_org_idx ON public.organisation_directory_sources USING btree (organisation_id)`
- `CREATE UNIQUE INDEX organisation_directory_sources_pkey ON public.organisation_directory_sources USING btree (source, external_key)`

Row-level security: enabled; forced: no; public policies: 0.

### school_competition_profiles

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| organisation_id | uuid (uuid) | NO | — |
| source_key | text (text) | NO | — |
| slug | text (text) | NO | — |
| division | text (text) | NO | — |
| province | text (text) | YES | — |
| logo_url | text (text) | YES | — |
| source_url | text (text) | NO | — |
| is_demo | boolean (bool) | NO | true |
| imported_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **school_competition_profiles_organisation_id_fkey**: `FOREIGN KEY (organisation_id) REFERENCES organisations(id)`
- **school_competition_profiles_pkey**: `PRIMARY KEY (organisation_id)`
- **school_competition_profiles_slug_key**: `UNIQUE (slug)`
- **school_competition_profiles_source_key_key**: `UNIQUE (source_key)`

Indexes:

- `CREATE UNIQUE INDEX school_competition_profiles_pkey ON public.school_competition_profiles USING btree (organisation_id)`
- `CREATE UNIQUE INDEX school_competition_profiles_slug_key ON public.school_competition_profiles USING btree (slug)`
- `CREATE UNIQUE INDEX school_competition_profiles_source_key_key ON public.school_competition_profiles USING btree (source_key)`

Row-level security: enabled; forced: no; public policies: 0.

### school_competition_teams

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| organisation_id | uuid (uuid) | NO | — |
| name | text (text) | NO | — |
| season | integer (int4) | NO | — |
| sport | text (text) | NO | 'Rugby'::text |
| source_url | text (text) | NO | — |

Constraints:

- **school_competition_teams_organisation_id_fkey**: `FOREIGN KEY (organisation_id) REFERENCES school_competition_profiles(organisation_id)`
- **school_competition_teams_pkey**: `PRIMARY KEY (id)`
- **school_competition_teams_organisation_id_name_season_key**: `UNIQUE (organisation_id, name, season)`

Indexes:

- `CREATE UNIQUE INDEX school_competition_teams_organisation_id_name_season_key ON public.school_competition_teams USING btree (organisation_id, name, season)`
- `CREATE UNIQUE INDEX school_competition_teams_pkey ON public.school_competition_teams USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### school_competition_fixtures

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| source_key | text (text) | NO | — |
| home_team_id | uuid (uuid) | NO | — |
| away_team_id | uuid (uuid) | NO | — |
| match_date | date (date) | NO | — |
| division | text (text) | NO | — |
| competition | text (text) | NO | 'Virseker Noordvaal Cup'::text |
| home_score | integer (int4) | YES | — |
| away_score | integer (int4) | YES | — |
| venue | text (text) | YES | — |
| round | text (text) | YES | — |
| decision_note | text (text) | YES | — |
| source_url | text (text) | NO | — |
| source_label | text (text) | NO | — |
| additional_sources | jsonb (jsonb) | NO | '[]'::jsonb |
| imported_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **school_competition_fixtures_away_score_check**: `CHECK (away_score >= 0)`
- **school_competition_fixtures_check**: `CHECK (home_team_id <> away_team_id)`
- **school_competition_fixtures_check1**: `CHECK ((home_score IS NULL) = (away_score IS NULL))`
- **school_competition_fixtures_home_score_check**: `CHECK (home_score >= 0)`
- **school_competition_fixtures_away_team_id_fkey**: `FOREIGN KEY (away_team_id) REFERENCES school_competition_teams(id)`
- **school_competition_fixtures_home_team_id_fkey**: `FOREIGN KEY (home_team_id) REFERENCES school_competition_teams(id)`
- **school_competition_fixtures_pkey**: `PRIMARY KEY (id)`
- **school_competition_fixtures_home_team_id_away_team_id_match_key**: `UNIQUE (home_team_id, away_team_id, match_date)`
- **school_competition_fixtures_source_key_key**: `UNIQUE (source_key)`

Indexes:

- `CREATE UNIQUE INDEX school_competition_fixtures_home_team_id_away_team_id_match_key ON public.school_competition_fixtures USING btree (home_team_id, away_team_id, match_date)`
- `CREATE UNIQUE INDEX school_competition_fixtures_pkey ON public.school_competition_fixtures USING btree (id)`
- `CREATE UNIQUE INDEX school_competition_fixtures_source_key_key ON public.school_competition_fixtures USING btree (source_key)`
- `CREATE INDEX school_fixtures_away_idx ON public.school_competition_fixtures USING btree (away_team_id, match_date)`
- `CREATE INDEX school_fixtures_home_idx ON public.school_competition_fixtures USING btree (home_team_id, match_date)`

Row-level security: enabled; forced: no; public policies: 0.

## Resource library & publishing

### athlete_resources

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| title | character varying (varchar) | NO | ''::character varying |
| summary | character varying (varchar) | NO | ''::character varying |
| topic | text (text) | NO | 'mindset'::text |
| format | text (text) | NO | 'video'::text |
| author | character varying (varchar) | NO | ''::character varying |
| duration_minutes | integer (int4) | YES | — |
| body | text (text) | NO | ''::text |
| transcript | text (text) | NO | ''::text |
| source_url | text (text) | NO | ''::text |
| status | text (text) | NO | 'draft'::text |
| featured | boolean (bool) | NO | false |
| version | integer (int4) | NO | 1 |
| created_by | uuid (uuid) | NO | — |
| created_at | timestamp with time zone (timestamptz) | NO | now() |
| updated_at | timestamp with time zone (timestamptz) | NO | now() |
| published_at | timestamp with time zone (timestamptz) | YES | — |
| thumbnail_id | uuid (uuid) | YES | — |
| media_id | uuid (uuid) | YES | — |
| captions_id | uuid (uuid) | YES | — |

Constraints:

- **athlete_resources_check**: `CHECK (NOT featured OR status = 'published'::text)`
- **athlete_resources_duration_minutes_check**: `CHECK (duration_minutes >= 1 AND duration_minutes <= 600)`
- **athlete_resources_format_check**: `CHECK (format = ANY (ARRAY['video'::text, 'audio'::text, 'article'::text, 'guide'::text]))`
- **athlete_resources_status_check**: `CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]))`
- **athlete_resources_topic_check**: `CHECK (topic = ANY (ARRAY['mindset'::text, 'nutrition'::text, 'training'::text, 'recovery'::text, 'life'::text]))`
- **athlete_resources_captions_id_fkey**: `FOREIGN KEY (captions_id) REFERENCES resource_assets(id)`
- **athlete_resources_created_by_fkey**: `FOREIGN KEY (created_by) REFERENCES users(id)`
- **athlete_resources_media_id_fkey**: `FOREIGN KEY (media_id) REFERENCES resource_assets(id)`
- **athlete_resources_thumbnail_id_fkey**: `FOREIGN KEY (thumbnail_id) REFERENCES resource_assets(id)`
- **athlete_resources_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX athlete_resources_pkey ON public.athlete_resources USING btree (id)`
- `CREATE UNIQUE INDEX resource_one_featured ON public.athlete_resources USING btree (featured) WHERE featured`
- `CREATE INDEX resources_browse ON public.athlete_resources USING btree (status, published_at DESC, id)`

Row-level security: enabled; forced: no; public policies: 0.

### resource_assets

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | gen_random_uuid() |
| resource_id | uuid (uuid) | NO | — |
| purpose | text (text) | NO | — |
| path | text (text) | NO | — |
| name | character varying (varchar) | NO | — |
| mime | text (text) | NO | — |
| size | bigint (int8) | NO | — |
| uploaded | boolean (bool) | NO | false |
| created_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **resource_assets_purpose_check**: `CHECK (purpose = ANY (ARRAY['thumbnail'::text, 'media'::text, 'captions'::text]))`
- **resource_assets_resource_id_fkey**: `FOREIGN KEY (resource_id) REFERENCES athlete_resources(id) ON DELETE CASCADE`
- **resource_assets_pkey**: `PRIMARY KEY (id)`
- **resource_assets_path_key**: `UNIQUE (path)`

Indexes:

- `CREATE UNIQUE INDEX resource_assets_path_key ON public.resource_assets USING btree (path)`
- `CREATE UNIQUE INDEX resource_assets_pkey ON public.resource_assets USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### resource_publishers

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| user_id | uuid (uuid) | NO | — |
| created_at | timestamp with time zone (timestamptz) | NO | now() |

Constraints:

- **resource_publishers_user_id_fkey**: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- **resource_publishers_pkey**: `PRIMARY KEY (user_id)`

Indexes:

- `CREATE UNIQUE INDEX resource_publishers_pkey ON public.resource_publishers USING btree (user_id)`

Row-level security: enabled; forced: no; public policies: 0.

## Additional events & discovery models

### events

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| organisation_id | uuid (uuid) | YES | — |
| name | text (text) | YES | — |
| type | text (text) | YES | — |
| location | text (text) | YES | — |
| start_date | date (date) | YES | — |
| end_date | date (date) | YES | — |

Constraints:

- **events_organisation_id_fkey**: `FOREIGN KEY (organisation_id) REFERENCES organisations(id)`
- **events_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### participations

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| athlete_id | uuid (uuid) | YES | — |
| event_id | uuid (uuid) | YES | — |
| position | text (text) | YES | — |
| minutes_played | integer (int4) | YES | — |
| stats_json | jsonb (jsonb) | YES | — |
| self_reported | boolean (bool) | YES | true |
| verified | boolean (bool) | YES | false |

Constraints:

- **participations_athlete_id_fkey**: `FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id)`
- **participations_event_id_fkey**: `FOREIGN KEY (event_id) REFERENCES events(id)`
- **participations_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX participations_pkey ON public.participations USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### videos

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| athlete_id | uuid (uuid) | YES | — |
| activity_id | uuid (uuid) | YES | — |
| event_id | uuid (uuid) | YES | — |
| title | text (text) | YES | — |
| description | text (text) | YES | — |
| url | text (text) | YES | — |
| thumbnail_url | text (text) | YES | — |
| duration | integer (int4) | YES | — |
| visibility | text (text) | YES | — |
| upload_date | timestamp without time zone (timestamp) | YES | now() |

Constraints:

- **videos_activity_id_fkey**: `FOREIGN KEY (activity_id) REFERENCES activities(id)`
- **videos_athlete_id_fkey**: `FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id)`
- **videos_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX videos_pkey ON public.videos USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### connections

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| athlete_id | uuid (uuid) | YES | — |
| scout_id | uuid (uuid) | YES | — |
| type | text (text) | YES | — |
| status | text (text) | YES | — |
| created_at | timestamp without time zone (timestamp) | YES | now() |

Constraints:

- **connections_athlete_id_fkey**: `FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id)`
- **connections_scout_id_fkey**: `FOREIGN KEY (scout_id) REFERENCES scout_profiles(id)`
- **connections_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX connections_pkey ON public.connections USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### opportunities

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| organisation_id | uuid (uuid) | YES | — |
| title | text (text) | YES | — |
| description | text (text) | YES | — |
| sport_id | uuid (uuid) | YES | — |
| age_range | text (text) | YES | — |
| location | text (text) | YES | — |
| start_date | date (date) | YES | — |
| end_date | date (date) | YES | — |
| status | text (text) | YES | — |

Constraints:

- **opportunities_organisation_id_fkey**: `FOREIGN KEY (organisation_id) REFERENCES organisations(id)`
- **opportunities_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX opportunities_pkey ON public.opportunities USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.

### opportunity_applications

| Column | PostgreSQL type | Nullable | Default |
|---|---|---|---|
| id | uuid (uuid) | NO | uuid_generate_v4() |
| opportunity_id | uuid (uuid) | YES | — |
| athlete_id | uuid (uuid) | YES | — |
| status | text (text) | YES | — |
| scout_notes | text (text) | YES | — |
| created_at | timestamp without time zone (timestamp) | YES | now() |

Constraints:

- **opportunity_applications_athlete_id_fkey**: `FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id)`
- **opportunity_applications_opportunity_id_fkey**: `FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)`
- **opportunity_applications_pkey**: `PRIMARY KEY (id)`

Indexes:

- `CREATE UNIQUE INDEX opportunity_applications_pkey ON public.opportunity_applications USING btree (id)`

Row-level security: enabled; forced: no; public policies: 0.
