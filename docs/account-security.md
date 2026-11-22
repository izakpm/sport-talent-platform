# Account security

All profile types share `AccountSecurity`. Managed children have no standalone
credentials; parents change their own password on the parent profile. Delegated
requests cannot access any account-security endpoint.

## Deployment

1. Apply `docs/sql/account-security.sql` before deploying the backend.
2. Verify `auth.playverified.app` in Resend. Keep open/click tracking disabled
   for password emails. Do not replace existing root-domain mail records.
3. Set backend-only `RESEND_API_KEY` to a sending-only key scoped to that domain,
   and `AUTH_EMAIL_FROM=PlayVerified <security@auth.playverified.app>`.
4. `FRONTEND_URL` must be the trusted public origin, `https://playverified.app`.
5. Redeploy the API after changing environment variables.

Never commit keys. `.vercel/` and environment files are ignored. Recovery returns
a service-unavailable message if email configuration is missing. Provider failures
are logged without recipient addresses, credentials or reset links; monitor these
logs and Resend delivery status.

## Authentication behaviour

- New password registrations and successful password logins record password access.
- New Google accounts record the verified Google subject and disable local password
  login. Recovery sends Google sign-in guidance instead of a password reset.
- Historical accounts have an unknown password method because older Google signups
  stored random bcrypt hashes without provider metadata. Do not guess their method
  from the hash. They may use a current password or establish one through email
  recovery. A successful Google login records the Google subject without removing
  an existing password.
- Changes require the current password. New/reset passwords need at least 12
  characters and at most 72 UTF-8 bytes (bcrypt's input limit).
- Recovery uses a random 256-bit token, stored as SHA-256, valid for 30 minutes.
  Only a POST consumes it. The email uses a URL fragment, which the page removes
  immediately; raw tokens are never returned by the API or logged.
- A user-row lock serialises changes, recovery issuance and reset consumption.
  Changing/resetting a password invalidates outstanding links and increments the
  session version. Old tokens (including legacy tokens without a version) are
  rejected after a change. There is no automatic login after resetting.
- Database-backed 15-minute rate limits: 3 recovery requests/email, 20/IP;
  5 change attempts/account; 20 reset attempts/IP. Unknown/ineligible/throttled
  recovery requests use the same response body. HTTP latency is not guaranteed
  identical because mail is delivered synchronously.
- Periodically remove expired `auth_rate_limits` and `password_reset_tokens`
  rows as routine database maintenance. Both tables use RLS with no public access.

## Verification

Backend tests cover token handling, password checks, Google/managed accounts,
throttling and session revocation. Frontend tests cover the shared controls,
child restrictions, email requests and fragment-token handling in Strict Mode.
Use isolated QA records for integration tests; never change real users' passwords.
