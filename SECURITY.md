# Security review — 26 September 2026

Scope: application source and dependencies, live Supabase project
`wwnhgqxcuvrqbkglpvye`, and `https://fullbodygym.netlify.app`.

## Fixes

- **Malformed backup denial of service:** null sets, object-valued notes, invalid
  sessions and other malformed values could be persisted and crash rendering on
  subsequent visits. Validate and reconstruct imported, cached and cloud data;
  reject oversized files before reading them; skip corrupt cached/cloud days.
  An attacker would need a victim to import a malicious backup (or control their
  browser storage); no cross-account delivery route was found.
- **Excess database privileges:** the live authenticated role retained default
  `TRUNCATE`, `REFERENCES` and `TRIGGER` privileges. Revoke all client grants and
  restore only SELECT/INSERT/UPDATE/DELETE. TRUNCATE bypasses row policies, but
  no public RPC exposing it was identified. This closes an unnecessary privilege,
  not a demonstrated anonymous table-wipe endpoint.
- **Unbounded day payloads:** enforce a 64 KiB JSON-object limit and finite date
  range in Postgres, including requests that bypass the frontend. Existing rows
  passed these constraints before deployment.
- **Browser hardening:** add CSP with no inline/evaluated JavaScript, framing
  denial, nosniff, no-referrer and restrictive permissions headers. Inline CSS
  remains allowed for React and hCaptcha. The hero now uses a local Three.js
  scene with no remote 3D assets.
- **Account CAPTCHA client:** email/password sign-in and registration use
  hCaptcha's React widget and pass its token to Supabase Auth. The public site
  key is safe in client code; server-side token verification needs the secret
  configured in Supabase Authentication → Attack Protection.
- **Client safeguards:** refuse builds configured with secret/legacy keys,
  ignore environment files in Git, bound bulk synchronization concurrency and
  stop imports when the account changes during file reading/synchronization.

## Verification

- `npm audit`: zero reported advisories after the account and hCaptcha update.
- `npm test`: malicious data, size limits, prototype keys, valid legacy shapes
  and persistent-cache recovery tests pass.
- Production build passes; deliberately supplying a fake `sb_secret_` key fails
  before bundling.
- `supabase/tests/access.sql` passes against the live database: owner CRUD,
  cross-account SELECT/INSERT/UPDATE/DELETE denial, owner reassignment denial,
  anonymous access denial, payload limits and least privilege. Test fixtures run
  inside a rolled-back transaction; existing workouts are not modified.
- Supabase security advisor: no findings after the migration.
- Browser smoke test under the production CSP: workout inputs, totals, completion,
  animation, account page, hCaptcha widget and demonstration work without CSP errors. The browser file-import
  end-to-end check was blocked by the extension's file-URL permission; the import
  parser itself is covered by automated tests.
- Public `.env.local` and `.git/config` paths returned the SPA HTML fallback,
  not private file contents. Only a publishable Supabase key is configured locally.
- Supabase redirect allowlist contains the exact production origin; rate limits
  are enabled and IP forwarding is disabled.

## Remaining limits

- CAPTCHA is not yet enabled in Supabase. The widget alone does not enforce
  anything server-side. Add the hCaptcha **secret** directly in Supabase
  Authentication → Attack Protection and enable CAPTCHA protection; never
  place that secret in frontend environment variables. Rate limits remain
  enabled, but do not fully prevent distributed sign-in/email abuse.
- Row size limits are not per-account storage quotas or API rate limits. Monitor
  usage and billing; for stronger resource-abuse protection, use enforced
  per-account quotas and a rate-limited write service. Client limits alone are
  not a security boundary.
- Browser caches and auth sessions use local storage: people/extensions with
  access to the same browser profile can inspect them. This is not protection
  against a compromised device.
- This review is not a guarantee that the app is free of all vulnerabilities.
  No load testing, real-email abuse testing or new email-login round trip was
  performed.

The database migration and frontend protections are live on Netlify. When changing Supabase projects, update the
exact `connect-src` origin in `netlify.toml` as well as environment variables.
