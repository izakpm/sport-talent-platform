# School and club affiliations

Implemented 23 November 2026. Athletes, coaches and parents can add multiple schools or clubs from their Profile page. Parents can switch between themselves and accepted linked children in the same section; only managed children can be edited. Approved view-only child links remain read-only.

## Data and authorisation

- `organisations` remains the canonical institution identity. `organisation_directory_sources` maps existing network school/club slugs to those records. The initial import mapped 39 existing organisations and created 199, covering 238 directory entries. Repeating the import creates none. No institution accounts or administrative memberships are created by the import.
- `organisation_affiliations` records account, organisation, role, start/end dates, status and requesting actor. Managed-child entries belong to the child account and record the parent as requester. This works without a child email address.
- New links use `status='requested'`, displayed as **Self-reported**, and `visibility='private'`. There is no organisation confirmation endpoint in this release. Confirmation fields are reserved for a separately authorised review workflow. No public counts or member lists are exposed.
- The server derives the role from the current account and rejects client-supplied account IDs, roles, confirmation and visibility. An active-pair unique index prevents duplicate current links; a user can end a link and later rejoin while retaining previous periods.
- These tables are never consulted by team, guardian or school-administration authorisation. `organisation_users`, `coach_player_accounts`, team invitations and `guardian_links` retain their existing meanings. Affiliation writes recheck a delegated parent's accepted managed link inside the write transaction.
- Tables use RLS with no browser policies; `anon` and `authenticated` have no privileges. The authenticated NestJS service applies owner checks through the existing private database connection.

## Endpoints

All require the existing JWT session. Parent delegation uses the existing `X-Athlete-Id` mechanism.

| Method / route | Purpose |
|---|---|
| GET `/affiliations` | Own current and historical links, plus edit capability |
| GET `/affiliations/organisations?q=…&type=SCHOOL` | Canonical school/club search, minimum 2 characters, maximum 30 results |
| POST `/affiliations` | Add `organisation_id` and optional `starts_on`; no permission grants |
| POST `/affiliations/:id/end` | End an owned current link; preserve history |

No arbitrary organisation creation is offered to users. Missing schools/clubs can be requested through the support contact. This avoids accumulating duplicate spelling variants.

## Migration and rollout

Apply `docs/sql/organisation-affiliations.sql` before deploying the API. The directory import helper is `backend/scripts/import-organisation-directory.cjs`; it receives a connected PostgreSQL client and defaults to dry-run. For apply, the caller must use a transaction and the `organisation-directory-import` advisory transaction lock. The helper fails on ambiguous matches rather than guessing. Existing organisation details and account passwords are not overwritten.

The current network page continues to read its existing website files and partnership flags. The mapping supports future integration without treating directory inclusion, partnership or a self-reported affiliation as verified membership.

## Validation

Focused tests cover profile search/save/history, read-only parents, direct parent child selection, role spoofing, invalid dates, actor attribution, revoked-link writes and ownership checks. Local HTTP integration tests use the existing athlete, coach and parent test accounts with real Supabase saves, duplicate rejection and history. Test-created affiliation rows are removed after verification. Permission-table counts are compared before and after the workflow. Desktop and mobile profile layouts are inspected separately.

Both production builds pass. The focused backend run passes 59 tests and the focused frontend run passes 20. The broader backend run passes 263 tests with 12 existing dependency-injection failures in unchanged scaffold tests (athlete-sports, athletes, positions, sports and trust). The broader frontend run passes all 204 browser tests; its Node deployment suite initially exposed an unconditional browser dialog shim, corrected by scoping that shim to environments where `HTMLDialogElement` exists.

## Future design work

Organisation confirmation/rejection, verified public aggregates, organisation-admin member management, university affiliation UI and official team-to-organisation associations are not part of this release. No historical `school_id` or `organisation_id` values are silently converted into confirmed affiliations.
