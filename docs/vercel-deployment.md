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
