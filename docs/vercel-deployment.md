# Deploy PlayVerified to Vercel

Deploy this repository as **two projects**, using the existing Supabase PostgreSQL database. No static export, custom serverless wrapper, or root-level build command is needed. Vercel supports the existing `backend/src/main.ts` NestJS entry point.

## Project settings

| Setting | Website | API |
| --- | --- | --- |
| Suggested project name | playverified | playverified-api |
| Root Directory | `frontend` | `backend` |
| Framework | Next.js | NestJS |
| Node.js | 24.x | 24.x |
| Install | `npm ci` | `npm ci` |
| Build | `npm run build` | `npm run build` |
| Output Directory | Framework default | Framework default |

The `vercel.json` in each project supplies framework/install/build settings. Set Root Directory in Vercel when importing the repository; do not import the repository root as a single Next.js project. Choose the API function region close to the database.

## 1. Prepare the database

Use an existing initialized application database. TypeORM has `synchronize: false`; deployment will not create the application schema. The older SQL/schema documents are not an automated migration history.

Apply [oauth-sessions.sql](sql/oauth-sessions.sql) once through your trusted database administration connection. It creates the session table required by production Google OAuth, with RLS enabled. The backend database role must own that table or have an appropriate RLS policy and SELECT/INSERT/UPDATE/DELETE grants. Do not expose sessions through Supabase's browser API.

Schedule the commented expired-session cleanup query daily using the database scheduler. Vercel instances do not run background cleanup timers. Expired sessions are rejected even before physical cleanup.

Use Supabase's **Connect** dialog to copy its pooler host, port, user, password, and database for serverless connections. Do not guess these values or reuse a direct IPv6-only connection endpoint. TLS certificate validation is enabled; if your connection requires a CA certificate, set `DB_SSL_CA` to its PEM content (literal newlines or `\n` escapes).

## 2. Configure the API project

Create/reserve both project domains first so the frontend origin is known, then deploy the API.

| Variable | Value |
| --- | --- |
| `FRONTEND_URL` | Stable website HTTPS origin, e.g. `https://playverified.vercel.app`; no path |
| `JWT_SECRET` | Independently generated random secret, at least 32 characters |
| `SESSION_SECRET` | A different independently generated random secret, at least 32 characters |
| `DB_HOST` | Supabase pooler hostname |
| `DB_PORT` | Port supplied by Supabase |
| `DB_USERNAME` | Pooler username supplied by Supabase |
| `DB_PASSWORD` | Database password |
| `DB_DATABASE` | Database name, usually `postgres` |
| `DB_SSL_CA` | Optional trusted database CA certificate |
| `GOOGLE_CLIENT_ID` | Optional Google OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | Matching Google OAuth secret |
| `GOOGLE_CALLBACK_URL` | `https://<website-domain>/api/auth/google/callback` |

Vercel supplies its runtime port and production environment. Never put database credentials or secrets in a `NEXT_PUBLIC_*` variable. Do not commit `.env`, `.env.local`, or `.vercel` metadata. Templates are in `backend/.env.example` and `frontend/.env.example`.

If Google credentials are omitted, email/password login remains available and Google endpoints return 503. If Google sign-in is enabled, register the **exact** callback URI above in Google Cloud. Start and finish OAuth on the same website origin so the session cookie is present on the callback. Do not configure the API domain as the callback when login starts through the website's proxy.

Changing `JWT_SECRET` invalidates previously issued tokens, including old local development tokens. Changing `SESSION_SECRET` invalidates pending OAuth sessions.

## 3. Configure the website project

Set `BACKEND_URL=https://<api-project-domain>` in the website project's environment settings. Use the API's stable HTTPS origin, without a path, query, or credentials.

Leave `NEXT_PUBLIC_API_URL` **unset** (or set it to `/api`). Browser requests use `/api/*`; Next.js forwards them to the API. This avoids browser CORS requirements and keeps Google OAuth on the website's origin. Remove any old `NEXT_PUBLIC_API_URL=http://localhost:3001` value from Vercel.

The build rejects missing/invalid/localhost backend origins on Vercel. Environment changes used by Next.js configuration require a new deployment. After assigning a custom website domain, update `FRONTEND_URL`, `GOOGLE_CALLBACK_URL`, and the Google Cloud redirect URI, then redeploy the API.

## 4. Preview environments and access

Use separate Preview environment values and a separate test database. A stable staging website/API domain pair is simplest for OAuth; arbitrary branch preview domains will not match a fixed OAuth callback. Do not point public previews at the production database.

Deployment Protection on the API can block website proxy requests with Vercel's login screen. Configure an appropriate Vercel protection-bypass integration before testing protected projects; the application does not currently inject a bypass secret. Do not place bypass secrets in public browser variables. Protecting only the website does not protect a directly reachable API.

## 5. Verification after deployment

1. Check `https://<api-domain>/health` returns `{"status":"ok"}`. The API initializes its database connection before serving requests.
2. Check `https://<website-domain>/api/health` returns the same JSON, not an HTML login/error page.
3. Open landing, login, registration, and the school tournament standings route.
4. With test accounts, exercise email/password login and role-specific dashboard navigation.
5. If enabled, test Google registration/login for ATHLETE, COACH, and SCHOOL; check redirects remain on the intended website domain.
6. Save a profile image under 3 MB; base64 encoding increases request size. Vercel's request/response size limits still apply despite the backend JSON parser's larger local limit.
7. Check function logs for database TLS/pool failures and missing `oauth_sessions` table errors.

Local validation commands, from the corresponding project directories:

```text
# frontend
npm ci
npm test -- --runInBand
npm run build

# backend
npm ci
npm test -- --runInBand deployment-config.spec.ts
npm run build
```

The frontend build downloads its existing Google Fonts and requires network access. The complete backend test suite has pre-existing dependency-injection failures; the targeted deployment tests do not replace it.

## Release limits

This work prepares the hosting configuration, not a completed production security release. Before public use with real athlete data, resolve the previously identified unguarded user/activity/verification endpoints, ownership checks, password-field exposure outside login responses, discovery privacy enforcement, guardian consent, and verification authorization. Also review the existing dependency audit findings and repair the backend test suite. Use synthetic data in a controlled staging environment until those issues are addressed.

The working tree contains substantial earlier uncommitted work, including pages and assets required by this deployment. Review and include that work as well as these deployment files in the Git commit deployed by Vercel. The school `logs` route was previously hidden by `.gitignore`; it is now visible to Git, but still needs to be committed.

## References

- [Vercel monorepo projects](https://vercel.com/docs/monorepos)
- [NestJS on Vercel](https://vercel.com/docs/frameworks/backend/nestjs)
- [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Environment variables](https://vercel.com/docs/environment-variables)


### Coach portfolio

Apply `docs/sql/coach-portfolio.sql` before deploying the coach portfolio API. The migration is additive and enables RLS, with no direct anon/authenticated access. The NestJS API checks coach role, suspension status and ownership on every operation.

Achievements, coaching history and qualifications are stored in `coach_portfolio`. Certificates are private bytea attachments (one per qualification), limited to 2 MB, with PDF/JPEG/PNG signature validation. List responses exclude certificate bytes; downloads require the owner's JWT and use attachment/no-store headers. Removing a qualification removes its attachment. Uploading a certificate does not mark a qualification verified.

For a manual database integration check after building the backend, set `RUN_PORTFOLIO_DB_CHECK=1` and run `node backend/test/portfolio-db-check.cjs`. It requires a configured backend `.env` and an existing active coach, checks CRUD and certificate handling, and rolls the entire test transaction back. No test records are retained.


### Coach profile editing

Apply `docs/sql/coach-profile.sql` before deploying the coach profile editor. It extends the existing `coach_profiles` table with headline, specialisms and bio, enforces one profile per user and enables RLS with no direct anon/authenticated access. The authenticated `/coach-profile` endpoint restricts reads and writes to the requesting active coach, using an explicit field allowlist. Personal details and photo remain in `users`; the coaching summary uses `coach_profiles`; portfolio counts use existing teams and portfolio records.

The sign-in email, account role, credentials and verification state cannot be edited through this endpoint. Photo updates support JPEG, PNG and WebP up to 2 MB, with server-side signature checks. The coach-directory query returns only identity/display fields, excluding contact details and credentials.

After a backend build, set `RUN_COACH_PROFILE_DB_CHECK=1` and run `node backend/test/coach-profile-db-check.cjs` for an opt-in integration check against the configured database. All changes are rolled back.

Profile design follows section-level edits, prefilled fields and clear save/cancel actions from https://design-system.service.gov.uk/patterns/check-answers/ and retained input on failed saves from https://design-system.service.gov.uk/components/error-message/. The coach profile replaces fixed statistics and irrelevant athlete fields with real portfolio counts and coaching-specific details.


### Team feed and session attendance

Apply `docs/sql/team-hub.sql` before deploying. The private tables store roster-to-account links, team announcements, per-player session attendance and hashed, expiring QR tokens. RLS is enabled with no direct anon/authenticated access. Team-hub routes require JWT authentication and check active account role, team ownership or active roster membership.

Coaches link a roster player to an existing ATHLETE account using their registered email under Teams > team > Athlete account. A user can be linked only once per team. Unlinking or marking a player inactive removes feed/check-in access; existing attendance is retained. Roster records with attendance cannot be deleted or reassigned to another athlete; mark them inactive instead.

Team feed posts are in-app announcements/reminders, visible only to linked active members and the owning coach. No email, SMS or push service is configured. Cancelling a session posts a cancellation to its feed atomically, preserves the session and closes QR check-in. Cancellation posts cannot be deleted separately. The feed shows the latest 100 updates.

Verification requests appear in the coach queue; the sidebar count polls every 60 seconds and refreshes after decisions. Athletes use their Attendance page to request confirmation. Coaches can approve/decline requests or mark players attended/absent manually. The attendance list covers 90 days back and 31 days ahead (up to 500 sessions); coaches can access older registers through the schedule.

QR codes use 32 random bytes, SHA-256 hashes in storage, a 15-minute expiry and a window from 30 minutes before the session to one hour after it ends. Each code is bound to a coach-owned session; replacing or closing it revokes the previous code. A scan requires an authenticated, active linked athlete and an explicit confirmation. Repeat scans are idempotent; QR scans cannot override a coach’s declined/absent decision. QR check-ins and coach-confirmed attendance are labelled separately. A QR check-in records possession of the current code, not an independent location measurement. The link carries the code in its fragment, which the check-in page removes and retains temporarily in sessionStorage for the Google/password login return flow. Codes are generated server-side using node-qrcode; no third-party QR service receives the link.

Sessions with attendance cannot be edited or deleted; cancel and create a new session if necessary. Editing an untouched session revokes outstanding codes. Legacy /verification token/scan/approve endpoints now require authentication and return 410, because those codes were not bound to a team or user. The legacy UI points to the new attendance pages.

After building the backend, set `RUN_TEAM_HUB_DB_CHECK=1` and run `node backend/test/team-hub-db-check.cjs`. This opt-in integration check creates synthetic users, team and sessions inside a rolled-back transaction; it independently decodes the QR PNG, checks member/non-member access, requests, approval, duplicates, expiry, rotation, revocation, cancellation and preservation of history.

### Athlete sporting profiles

Apply `docs/sql/athlete-profile.sql` before deploying `/athlete-profile`. It adds an optional biography and primary-position flag to existing athlete records, plus a private, RLS-enabled portfolio table. Existing sports and positions are retained. The authenticated endpoint derives ownership from the JWT and allows active athletes to update only their own details, sports, achievements and metric records. Metric units are assigned server-side; all manually entered portfolio records are self-reported. No public sharing or verification status is granted by editing a profile.

Athletes use Profile → My details / Sports & positions / Achievements / Performance metrics. Sports and Achievements navigation opens the same editor. Each metric result has its own test date and notes; adding a result preserves previous measurements. Email remains read-only. Photos accept JPG, PNG or WebP up to 2 MB.

Run the rollback-only database check after building the API: set `RUN_ATHLETE_PROFILE_DB_CHECK=1` and run `node backend/test/athlete-profile-db-check.cjs`. Set `APPLY_ATHLETE_PROFILE_MIGRATION=1` only when intentionally applying the migration; migration changes are committed separately from rolled-back synthetic fixtures.

### Athlete training logs and coach verification

Apply `docs/sql/athlete-activities.sql` before deploying this release. The migration preserves existing `activities`, adds training type/effort fields, and creates the private `activity_coach_requests` table. Both activities and requests use RLS with direct anonymous/authenticated Supabase access revoked; the authenticated NestJS API enforces ownership. Legacy activity verification records are retained and displayed as “Previously verified”.

The `/activities` endpoints now require JWT authentication and derive the athlete from the signed-in account, ignoring old query-based owner selection. Athletes record completed sessions in SAST with duration, sport, type, notes, venue and optional effort. `/activities/options` lists only coaches linked through an active team roster. Requests appear in the coach Verification page and the combined pending count. Notifications are in-app, with periodic refresh; no email/SMS is sent.

Pending logs cannot be edited or deleted until the athlete withdraws the request. Coach-verified and legacy-verified logs are locked. Only the selected active, linked coach can review; a decline requires feedback. Editing a declined log clears the review before resubmission. Requests, withdrawal and decisions serialize on the activity row. Scheduled-team attendance and QR check-ins retain their separate flow, linked from Activities.

After building the API, set `RUN_ACTIVITY_DB_CHECK=1` and run `node backend/test/activity-db-check.cjs` for the rollback-only workflow test. `APPLY_ACTIVITY_MIGRATION=1` intentionally commits the additive migration before creating disposable test records.

### Athlete team calendar

The athlete Calendar now reads `GET /team-hub/calendar?month=YYYY-MM`, replacing the sample events. This authenticated endpoint accepts a validated calendar month (1900–2099), requires an active athlete account, and returns sessions only for current active roster/account links. Month navigation is not limited to the older attendance endpoint’s 31-day upcoming window. Personal planning now requires the additional migration described below.

Month and list views share team/type/upcoming/cancellation filters. Events use their team-local dates and times, with the timezone shown in details. Match highlighting, selected-day details, coach notes and cancellation notices are available on desktop and mobile. The “Next up” panel is scoped to the displayed month and active filters, excludes cancellations, and includes sessions still in progress. The calendar refreshes every minute while open. The team-hub database check now also covers future-month matches, month boundaries, cancellations and inactive/unlinked account isolation.

### Personal calendar plans

Apply `docs/sql/athlete-personal-calendar.sql` before deploying personal planning. It creates an RLS-protected private `athlete_calendar_events` table with no direct anonymous/authenticated Supabase access. The calendar endpoint now combines active team memberships with the signed-in athlete’s personal plans, ordered chronologically. Personal plans are identified by `source: personal` and the display-only `team_id: personal` filter value.

Athletes use Calendar → Plan my own session to schedule a future session, even without a team. Plans include type, date, start/end times (SAST), venue and notes. Athletes may edit their own active plans or cancel them with confirmation; cancelled records remain visible. Personal endpoints cannot edit team events or another athlete’s plans. Planning does not create completed training logs, attendance or verification. The editor flags overlaps with events loaded for the displayed month, but does not prohibit intentional overlaps or guarantee cross-month conflict detection.

After building the API, run `node backend/test/personal-calendar-db-check.cjs` with `RUN_PERSONAL_CALENDAR_CHECK=1`. Set `APPLY_PERSONAL_CALENDAR_MIGRATION=1` only when intentionally applying the additive migration. All synthetic test records are rolled back independently of the committed migration.

### Coach match results and athlete performance

Apply `docs/sql/match-results.sql` before deploying. It adds `match_results` and `athlete_match_stats`, with RLS enabled and direct anonymous/authenticated Supabase access revoked. No existing records are rewritten. Results reference existing team schedule events of type Match; coaches can also schedule a past fixture to enter an older result.

Authenticated `GET /team-hub/matches` returns a coach's own team fixtures, or an athlete's active linked team fixtures plus matches with that athlete's saved personal stats. Personal stats are returned only to their owner. `POST /team-hub/matches/:id/result` requires the owning coach and an ended, uncancelled match. `POST /team-hub/matches/:id/stats` requires the athlete's own account, active membership (or an already-owned performance record), and a recorded team result. Client-supplied ownership is rejected. Scores determine win/loss/draw; personal stats are self-reported and do not certify attendance.

Result corrections preserve athlete stats. Matches with results cannot be rescheduled, deleted or cancelled through the schedule, preventing historical records from silently changing. Results and stats persist in separate tables; personal records remain visible after leaving a team. Video links accept only HTTP(S), are opened with noopener/noreferrer and are never fetched by the API. Blank statistics remain null rather than implying zero. Both Matches pages show historical results and upcoming team fixtures across months; private calendar plans remain in Calendar.

After building the API, `RUN_MATCH_CHECK=1 node backend/test/matches-db-check.cjs` runs the transactional ownership and workflow check. Set `APPLY_MATCH_MIGRATION=1` only to intentionally commit the additive migration before testing. Synthetic test records are rolled back.

### Athlete navigation consolidation

The athlete sidebar now has Dashboard, Profile, Activities, Matches, Calendar, Team Feed and Connections. Activities contains URL-backed Training log (`#training`) and Team attendance (`#attendance`) tabs, reusing the existing attendance and verification workflow. The old `/dashboard/athlete/attendance` route redirects to Activities' attendance tab. Sports and Achievements redirect to `/dashboard/profile#sports` and `#achievement`; Profile also supports `#details` and `#metric`. Overview, calendar and QR check-in shortcuts point directly to the new locations. No records, APIs or Connections behavior changed.

### Athlete Connections

`GET /team-hub/connections` is JWT-protected, athlete-only and private/no-store. It derives teams from the caller's active linked roster memberships, then returns those teams' active coach accounts and active linked athlete accounts, excluding the caller. Suspended accounts and unlinked/inactive roster entries are excluded. People shared across teams are deduplicated, with all shared teams retained. The payload contains only account ID, name, profile image, role and shared-team details; no email, phone, birth date or full profile is returned. No migration is required.

The athlete page shows real counts, name/team/role filters, photo fallback, linked-team onboarding, recoverable errors and a Team Feed shortcut. Data refreshes every minute while open. After building the backend, run `RUN_CONNECTIONS_CHECK=1 node backend/test/connections-db-check.cjs` for a rollback-only shared-team privacy and linkage check.

### Athlete Team Feed presentation

The athlete feed uses the existing membership-scoped `/team-hub/feed` endpoint and coach publishing workflow. It adds team/type/search filters, newest-first posts, SAST timestamps, expandable long messages, calendar links for cancellations and up to three matching reminders/cancellations posted in the last seven days. Highlights describe recent posts, not unread status or future session validity. The existing latest-100 limit is stated on the page; changing teams queries that team's latest 100 posts. Polling remains once per minute, with manual refresh and clear empty/error states. No migration or backend changes are required.

### Coach Team Feed and session updates

Apply `docs/sql/coach-session-updates.sql` before deployment. This expands the existing post category constraint to include `session_update`; it preserves existing posts. The coach feed shares the athlete feed's visual styling, with quick compose actions, team/type/search filters, a recipient-aware preview, persistent drafts after failed submissions and removal confirmation. Posts are in-app only.

Session updates select a team and month, then load that coach's scheduled sessions for the month. Cancelled sessions are excluded. The API checks coach ownership, selected-team/session consistency and cancellation under a row lock, then stores the event link and a snapshot of its title, date, time, timezone and venue in the message. Posting does not modify or cancel a session. Existing schedule and verification controls remain responsible for those actions; cancellation notices are still generated automatically and cannot be manually removed. Athletes see Session updates as a filterable category and in recent highlights.

After building the API, `RUN_FEED_CHECK=1 node backend/test/coach-feed-db-check.cjs` verifies posting, linked athlete delivery, ownership, snapshot context and protected cancellations with rollback-only fixtures. `APPLY_FEED_MIGRATION=1` intentionally commits the category migration first.

### Parent-approved team invitations

Apply `docs/sql/team-invitations.sql` before deploying the API. The additive table has RLS enabled and denies direct browser access. No WhatsApp API credentials are needed: coaches choose a recipient and send the generated message in WhatsApp themselves.

Coach team rosters generate single-use, seven-day invitation links. Only token hashes are stored. `/join-team` carries the token in the URL fragment, removes it after loading and retains it in session storage through login/registration. An authenticated parent previews only the coach/team identity and explicitly accepts for an accepted managed child; read-only athlete links cannot enrol players. Parent Connections lists invitation status and supports withdrawing a pending request.

Acceptance creates no membership. The owning coach must confirm before a roster account link is inserted, either for a new player or an existing active, unlinked entry without another athlete's attendance history. Transactions lock invitations and relevant guardian/player records, recheck current authority, and reject reused, expired, revoked or withdrawn invitations. Existing manual account-linking workflows remain available; this change does not certify coach identities or introduce public athlete search.

Validation: backend guardian tests, frontend JoinTeam/TeamInvitations/TeamRoster/parent tests, and both production builds. The test accounts were also exercised against Supabase for parent acceptance, no access before confirmation, coach approval, existing/new roster entries, withdrawal, expiry, revocation, read-only restrictions and concurrent acceptance.

### Parent's own profile

`/dashboard/parents/profile` edits the signed-in parent's name, phone and profile photo through `GET/PATCH /guardian/profile`. Email is displayed read-only. The server derives the account from the JWT, allows only those personal fields, validates photo type/size and rechecks the active guardian role before saving. It does not accept an account or child ID. No migration is required.

Children's sporting profiles remain at `/dashboard/parents/children/profiles`, with the existing all-children filter and in-place editors. My children links to this view, including a child-specific filter from each child card. Saving the parent's own profile refreshes their sidebar identity/photo without switching to child context.

### Invitations for athletes with their own accounts

Apply `docs/sql/athlete-team-invitations.sql` after the original invitation migration and before deploying the API. Athletes can now accept the same single-use invitation themselves. A recorded birth date is required: adults move to coach review; under-18 athletes move to `awaiting_parent`. No membership or team access is created at either stage.

An accepted linked parent reviews the request in Connections and explicitly confirms parental/legal-guardian authority. Approval moves it to coach review. Coach confirmation rechecks the athlete's age, active accounts and the exact parent link used for approval. Revoking and reaccepting that link invalidates the old approval; the athlete must withdraw and use a fresh invitation. Parents can decline, athletes can withdraw, and coaches can revoke invitations. Existing managed-child invitations remain supported.

Athletes without a linked parent can accept and wait while their parent requests a link through My children and the athlete approves it in Connections. Age uses the recorded/self-reported birth date; this does not verify identity or guardianship documents. Existing dates cannot be changed through invitation acceptance. Direct coach email-linking is blocked for minors and missing birth dates so it cannot bypass the invitation approval process. Existing memberships are unchanged.

Validation includes guardian and team-hub unit tests, invitation UI tests, production builds and real Supabase/API checks for adult acceptance, minor access restrictions, unrelated parents, revoked approval, withdrawal, decline, invalid birth dates and the email-link bypass.
