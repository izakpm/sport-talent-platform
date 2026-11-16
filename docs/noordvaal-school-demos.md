# Noordvaal school demonstrations — 2026

Imported on 16 November 2026. These are unclaimed demonstration workspaces, not endorsements or school-authorized accounts.

## Scope and provenance

- All 39 schools from https://www.virsekernoordvaalcup.co.za/skole (9 Cup, 9 Plate, 9 Shield, 6 Bowl East, 6 Bowl West).
- Official site's public Sanity school/fixture feed: 148 first-team records, with source IDs retained. Public query configuration is present in the site's JavaScript.
- Check-e-Log 2026 calendars 1957 (Cup), 1959 (Plate), 1960 (Shield), including playoffs. Paginated public calendar pages supply senior/reserve/U14–U16 records. Every fixture retains its match URL.
- 291 observed teams; 1,186 unique fixtures; 1,183 scores. Bowl coverage is currently first teams only and is not represented as complete junior coverage.
- Three conflicting scores withheld: Noordheuwel / EG Jansen on 23 May; Marais Viljoen / Secunda on 16 May; Pietersburg / Piet Retief on 15 August. Both sources retained.
- Knockout draw decisions are noted, not automatically treated as wins. Season summaries are score-based records, not official standings or promotion points.
- No kickoff time, player appearances, attendance, coaches, achievements or rosters inferred.
- Jeugland location corrected to Kempton Park using https://jeugland.co.za/; Transvalia corrected to Vanderbijlpark using https://www.hstransvalia.co.za/kontakons. Incorrect/reused Jeugland crest omitted. Other crests use official-directory asset URLs where supplied.

## Storage and access

`docs/sql/school-competition-demos.sql` adds sourced competition profiles, teams and fixtures against existing `organisations` / `organisation_users`. RLS enabled, anon/authenticated SQL access revoked. The backend uses its existing database connection; `/schools/workspace` checks SCHOOL/ORG role and membership before returning only that school's records.

Demo emails use `<school-slug>.demo@playverified.test`, never school staff addresses. Bcrypt-hashed demo passwords are supplied at import, not stored in source control. Accounts are DEMO_VIEWER members; the new workspace API is read-only. Private coach teams and athlete data remain separate. No invitations/emails are sent.

`backend/scripts/import-school-demos.cjs` accepts a connected PostgreSQL client, a reviewed plan, and a password. It runs in one transaction, locks concurrent imports, validates mappings, preserves existing passwords, rejects login ownership conflicts, and deduplicates teams/fixtures. Run schema first. Conflicting existing records are not overwritten silently.

Private source snapshots, reviewed plan, import manifest and verification are in ignored `.vercel/team-sheet-import/`. Customer-demo login list and research exports are in ignored `output/noordvaal-schools/`. Do not commit the login list or runtime credentials.

## UI and verification

School overview, teams, fixtures and season record use real database records. Year/team/opponent filters scope results. Fixture rows expand to source links and notes. Coaches and achievements show honest empty states until confirmed data is supported; previous mock mutations are no longer presented as saved operations.

Validated: both production builds; backend role/membership tests; frontend filtering, missing scores, zero-score draws, source details, empty/error states and role page checks. Import audit checks totals, hashed passwords for all 39 accounts, RLS, no duplicate reversed fixtures, and no links to private coach workspaces.
