# Security review — 28 September 2026

Scope: the standalone Vite web tracker in this repository. The Expo mobile app and its Supabase backend have a separate account and sync threat model documented in [`docs/COMPLIANCE_AUDIT.md`](docs/COMPLIANCE_AUDIT.md).

## Current web architecture

- The web tracker has no authentication, registration, cloud database, or API client.
- Workout progress is validated and stored only in browser local storage. The interface warns users that browser data can be cleared and provides JSON export/import plus a confirmed delete-all action.
- Anyone or any extension with access to the same browser profile may be able to inspect local workout data. Local storage does not protect against a compromised or shared device.
- The production Content Security Policy allows same-origin scripts, images, and network connections only. Framing, browser MIME sniffing, referrer transmission, camera, microphone, geolocation, and payment access are restricted by response headers.
- Exercise art, animation data, fonts, and application assets are hosted locally. No advertising, analytics, CAPTCHA, tracking pixel, or remote media request is present in the web runtime.

## Input and storage safeguards

- Imported, cached, and legacy workout data is reconstructed through a strict validator. Invalid dates, prototype keys, malformed values, oversized backups, excessive set counts, unsafe numeric ranges, and oversized notes are rejected or skipped as appropriate.
- User notes are rendered by React as plain text rather than injected HTML.
- Completing a set requires positive, finite weight and repetition values. Backup imports are capped before file contents are read.
- Local-storage failures are handled without crashing the workout screen and are reported through the save status.

## Verification

- `npm test` covers malicious backup shapes, prototype pollution attempts, size limits, cached-data recovery, completion validation, and recap calculations.
- `npm run build` produces the production Vite bundle without Supabase or authentication packages.
- `npm audit` currently reports zero known dependency advisories.

## Remaining limits

- Browser storage is best-effort and may be removed by the browser, private-browsing rules, device cleanup, or the user. Users should export backups when the history matters.
- The application cannot remotely recover or delete web progress because that progress is never received by Full Body.
- This review is not a guarantee that the application is free of every vulnerability. Re-run dependency, CSP, import, keyboard, and browser-storage checks before each production release.
