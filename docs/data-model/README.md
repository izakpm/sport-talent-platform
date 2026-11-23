# PlayVerified data model

**Current-state snapshot: 23 November 2026, 06:19 UTC.** Verified against the live Supabase public schema and application source, including the school/club affiliation implementation following commit `45f89b5`.

**Subsequent applied change (23 November 2026):** athlete achievements now support team selections and leadership appointments through [this additive migration](../sql/athlete-achievement-selection.sql). `athlete_portfolio_entries` adds `achievement_type` (`general` or `team_selection`), nullable `leadership_role` (Captain or Vice-captain), and nullable `leadership_date`. The existing `date` is the selection date for team selections. Unknown appointment dates remain null. Both honours appear on one card; general awards remain separate entries. No new relationships or access permissions are introduced. The timestamped diagrams and schema snapshot below predate these three columns.

Start with the [visual explorer](index.html), which opens in a browser without a server or internet connection. It includes a platform overview, eight detailed diagrams, zoom controls and a clearly separated proposed model. Individual SVGs can be opened, shared or printed; Mermaid files remain editable source.

**Achievement verification (23 November 2026):** [achievement-verification.sql](../sql/achievement-verification.sql) adds `achievement_coach_requests`, one current request per portfolio entry, with assigned coach, pending/verified/declined status, request/review notes and timestamps. Only an active roster coach can receive or decide a request. Pending records require withdrawal before editing; verified achievements are immutable through athlete and managed-parent profile routes. Declined records can be corrected and resubmitted. Organisation branding is unrelated to verification. This table and its two foreign keys postdate the timestamped diagrams below.

**Achievement directory links (23 November 2026):** [achievement-organisations.sql](../sql/achievement-organisations.sql) adds nullable `athlete_portfolio_entries.organisation_id → organisations.id` (`ON DELETE SET NULL`). This links achievements to shared school/club names and directory logos, independently of memberships, affiliations, parent approvals and verification. Metrics cannot have this link. A manual `organization` label is still supported for competitions and unlisted organisations. Logos are read from `organisation_directory_sources`, not supplied by the browser. This relationship postdates the timestamped visual snapshot.

## Scope and evidence

The read-only inspection found **51 tables, 433 columns and 82 foreign keys** in the public application schema. No account or business records were exported. This snapshot includes the newly applied affiliation migration; the diagram exporter itself changes no database records. Supabase-managed `auth`, `storage` and system schemas are outside this snapshot. Source-code review explains how the application uses the structures; it is not an end-to-end test of every feature or a data-quality audit.

- [Exact schema metadata](current/schema-snapshot.json): column types, nullability, defaults, constraints and indexes.
- [Complete table dictionary](current/table-dictionary.md): every field, constraint and index, grouped by domain.
- [Foreign-key register](current/relationships.md): all 82 database relationships, including deletion behaviour.
- [Coverage manifest](current/coverage.json): each of the 51 tables belongs to one detailed diagram; each foreign key appears once, owned by its referencing table.

The earlier [v1 design](data-model-v1.md), [ERD draft](erd.md) and [SQL schema notes](../sql/schema.md) are historical design material, not the authoritative current model. Differences from them should not be mistaken for missing migrations.

## Visual views

| View | Visual | Editable source | What it explains |
|---|---|---|---|
| Platform overview | [SVG](current/00-platform-overview.svg) | [Mermaid](current/00-platform-overview.mmd) | Current application domains and their boundaries |
| Identity and access | [SVG](current/01-identity.svg) | [Mermaid](current/01-identity.mmd) | Accounts, role profiles, guardians and recovery |
| Sporting portfolios | [SVG](current/02-portfolios.svg) | [Mermaid](current/02-portfolios.mmd) | Sports, positions, achievements, metrics and coach qualifications |
| Teams and invitations | [SVG](current/03-teams.svg) | [Mermaid](current/03-teams.mmd) | Rosters, linked accounts, invitations and approvals |
| Calendars and matches | [SVG](current/04-schedule.svg) | [Mermaid](current/04-schedule.mmd) | Sessions, attendance, results, personal stats and feed |
| Training and verification | [SVG](current/05-activities.svg) | [Mermaid](current/05-activities.mmd) | Logged training, metrics and verification records |
| Organisations and competitions | [SVG](current/06-organisations.svg) | [Mermaid](current/06-organisations.mmd) | School details, membership, imported teams and fixtures |
| Resources | [SVG](current/07-resources.svg) | [Mermaid](current/07-resources.mmd) | Publishing permissions and media assets |
| Additional events and discovery | [SVG](current/08-discovery.svg) | [Mermaid](current/08-discovery.mmd) | Other event, video, scout and opportunity structures present in the database |

### Reading the detailed diagrams

These are physical database relationships, not promises about intended behaviour. A circle means zero is permitted, a bar means one, and a crow’s foot means many. Parent records can have zero children. Nullable foreign keys allow a child to have no parent; required foreign keys require one. A unique foreign key limits the parent to at most one referencing row.

PK means primary key; FK means foreign key; UK marks a single-column unique constraint or unconditional unique index. Composite and conditional uniqueness is listed in the dictionary. Solid lines mean the foreign-key columns form part of the child's primary key; dotted lines mean other relationships. **Both line styles are enforced foreign keys.** Line labels identify the referencing columns. Tables from another group show only primary keys and are labelled “reference table” in their fields.

The overview uses application-flow arrows instead of cardinalities. Detailed diagrams deliberately show only keys and selected business fields; the dictionary contains all 433 columns. Notation follows the [Mermaid ER diagram reference](https://mermaid.js.org/syntax/entityRelationshipDiagram.html).

## What the current model tells us

### 1. Accounts are central, but athlete identifiers have two meanings

Authentication uses the application's `users` table, not a foreign key into Supabase Auth. `users.role` holds one role value. Role profiles refer back to it. A managed child also has a `users` row, with no email and a non-login password marker; `guardian_links` provides the parent's access. Current parent details live in `users`. Older `guardian_profiles` and the nullable `athlete_profiles.guardian_id` remain in the schema alongside this newer model.

Some features reference `users.id` directly, while activities and several older models reference `athlete_profiles.id`. For example, athlete portfolio entries, personal calendar sessions and match stats use the account ID; activities use the athlete-profile ID. These IDs must never be treated as interchangeable.

The database enforces at most one coach profile per user through a unique index, but does **not** enforce one athlete, guardian or scout profile per user. The current athlete profile service selects the first matching profile. Therefore the current ERD shows the physical multiplicity even where the screen intends one profile.

### 2. Roster membership is not the same as an account

`coach_team_players` stores a roster entry. `coach_player_accounts` links that entry to a user. This supports players without their own login while allowing account-linked athletes to see team information. `team_invitations` records acceptance mode, parent approval and coach confirmation. Those approvals should remain the authority for linking children; a school affiliation must not bypass them.

There are separate foreign keys on a linked player's `player_id` and `team_id`, but no composite constraint ensuring the player belongs to that same team. Similar cross-record consistency, such as an event's team matching an attendance player's team, depends on application validation. Metadata alone cannot establish whether existing records are consistent.

### 3. Team schedules, personal schedules and completed training are separate

`coach_schedule_events` belongs to a coach team. `athlete_calendar_events` belongs directly to an athlete account. `activities` records training against an athlete profile. There is no direct foreign key linking these three streams. Their dates also differ: calendars store a date and local times, with team timezone available for team sessions; activities use timestamps without timezone.

`coach_session_attendance` records team-session attendance. `activity_coach_requests` and `activity_verifications` represent verification of logged training. They are different evidence paths, so combining them in statistics requires an explicit rule to avoid counting one session twice.

`match_results` is keyed by a coach schedule event. `athlete_match_stats` points to `match_results`, meaning a result row must exist before the database can store personal stats. Older `events` and `participations` are another model and are not the coach scheduling tables.

### 4. School competition data and coach-managed teams are separate

`organisations` stores school and club details. `organisation_users` links accounts to organisations. School competition profiles, season teams and fixtures form a separate imported competition structure. `coach_teams` has no organisation foreign key, and no bridge currently connects school competition fixtures/results with coach schedule events/results.

Competition labels are text fields; there is no canonical tournament table. This does allow more than one tournament label, but does not yet provide a shared tournament identity. Organisation-user pairs also have no uniqueness constraint.

### 5. The public network is currently a website directory

The Network page still reads `schools.json`, `universities.json`, `clubs.json` and `websites.json`. The new `organisation_directory_sources` table maps its 238 school and club entries to canonical organisations. Universities are not included in this first affiliation release. Partnership flags remain separate.

The new `organisation_affiliations` table links athlete, coach and parent accounts to these shared organisations, with dates, private visibility and requesting-actor attribution. New links are self-reported (`requested`), not confirmed membership. The server offers add/list/end operations; parents can manage a managed child's affiliations and read an older child's approved view-only profile. These links do not grant organisation administration, team access or guardian approval. No public counts are published. See [implementation details](../organisation-affiliations.md).

### 6. Similar-looking profile structures coexist

Current profile editing uses `athlete_sports` for sports and positions, and `athlete_portfolio_entries` for achievements and performance records. `athlete_sport_profiles` and `athlete_sport_positions` also exist. The latter has no foreign keys. The portfolio metric choices come from application validation constants; they are distinct from the `metrics` table used by activity metrics.

Likewise, `verification_requests` and `verification_tokens` remain present, and the older verification service still contains routes using them. Their presence is not proof that they are unused, and this documentation does not recommend deleting them without a usage and migration review.

### 7. Media storage has two implementations

Resource uploads use `resource_assets` metadata and Supabase Storage paths. Resources select thumbnail, media and caption assets through foreign keys, while each asset also references its resource. This creates a deliberate relationship cycle. The database links do not, on their own, enforce that a selected asset belongs to that resource or has the matching purpose.

Coach qualification certificates instead use `coach_portfolio.certificate_data` binary content in PostgreSQL, with a 2 MiB constraint. They are not resource assets. OAuth sessions are JSON records in `oauth_sessions`; recovery tokens and rate-limit buckets are separate tables.

### 8. ID-shaped fields do not always have database relationships

The following columns have no foreign-key constraint in the snapshot. They are shown as fields, not invented relationship lines:

| Table | Columns without an enforced reference |
|---|---|
| athlete_profiles | school_id |
| coach_profiles | organisation_id, sport_id |
| scout_profiles | organisation_id, sport_id |
| athlete_sport_positions | athlete_id, sport_id, position_id |
| metrics | sport_id |
| verification_requests | coach_id, athlete_id (requested_by_athlete_id does have an FK) |
| videos | event_id |
| opportunities | sport_id |
| coach_schedule_events | series_id is a grouping identifier, not a link to a series table |

All 51 public tables have row-level security enabled, none forced, and no public RLS policies were returned. This is not evidence that tables are disabled: the NestJS backend connects directly to PostgreSQL and applies application authorisation. Effective database access also depends on the connection role and grants, which were not audited across the full schema here. The new affiliation tables explicitly revoke browser-role privileges.

## Proposed changes — not implemented

See the separate [remaining proposals and priorities](proposed/README.md) and [proposal diagram](proposed/organisation-affiliations.svg). The initial affiliation and directory mapping are now implemented and shown in the current diagram; confirmation, public counts and official team associations remain proposals.

## Maintaining this model

Athlete badges (23 November 2026): `athlete_portfolio_entries.selection_level` explicitly distinguishes school, club, provincial and national team selections. `/athlete-profile/badges` derives provincial selection and captaincy badges from coach-verified achievements, and 10/25/50/100/250-hour milestones from verified training logs and completed team attendance. Training milestones reset each calendar year in Africa/Johannesburg; sessions crossing New Year are split at local midnight. Previous years’ earned milestones remain in the collection, and progress reflects the current year. The UI groups training awards by threshold, provincial selections by organisation, and captaincies together, with superscript award counts and dated evidence in the details. Overlapping time intervals are merged; matches and future sessions are excluded. Awards are recalculated from source records rather than stored as a second editable counter. See `docs/sql/athlete-badges.sql`; the generated diagrams predate this field.

Personal session invitations (23 November 2026): `personal_session_invitations` links one optional guest (`users`) to an organiser-owned `athlete_calendar_events` record. Responses are pending, accepted or declined. Only existing active roster connections are eligible; this creates no team membership or parent permission. Changes require a fresh response, and cancellation remains on the shared event. See `docs/sql/personal-session-invitations.sql`; the generated diagrams predate this addition.

1. Run `node docs/data-model/export-schema.cjs` with authorised access to the private database environment. It uses a read-only transaction and exports metadata only. An optional first argument selects another environment file; never commit that file.
2. Run `node docs/data-model/build-model.cjs`. It checks table ownership and foreign-key coverage, then generates Mermaid detail diagrams, the dictionary and register. New tables require a deliberate group assignment.
3. Run `./docs/data-model/render-model.ps1` in PowerShell to render all sources and rebuild the portable viewer. It uses Mermaid CLI 11.12.0 and installed Chrome; pass `-BrowserPath` for another Chromium executable. The first run needs package-download access. The overview and proposed view are curated, not inferred from foreign keys.
4. Review source-code usage and findings again. A schema refresh alone does not validate application behaviour. Open the visual explorer and inspect the renders before publishing an updated snapshot.

Application evidence: `backend/src/athlete-profile/profile.service.ts`, `backend/src/athlete-profile/profile.validation.ts`, `backend/src/athlete-sports/athlete-sports.service.ts`, `backend/src/guardian/guardian.service.ts`, `backend/src/verification/verification.service.ts`, `backend/src/schools/schools.service.ts`, `frontend/app/network/NetworkDirectory.tsx`, and the relevant SQL migrations under `docs/sql`.
