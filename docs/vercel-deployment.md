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
