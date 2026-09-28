# Mobile migration progress

This is the durable checkpoint for evolving the Vite workout tracker into the Expo mobile app. The existing web application remains available while native screens are built under `mobile/`.

## Current checkpoint

- [x] Audit the web screens, workout rules, validation, and Supabase access model.
- [x] Scaffold an Expo SDK 57 TypeScript application under `mobile/`.
- [x] Build the native shell, design system, authentication gate, and onboarding flow.
- [x] Add the 30-exercise catalog and editable routine templates.
- [x] Add offline SQLite workout logging, recap calculations, and a durable sync queue.
- [x] Add Today, Routine, Progress, and Profile tabs.
- [x] Add Lottie recaps and the Rive-compatible avatar interface.
- [x] Add the additive Supabase mobile schema and owner-isolation tests.
- [x] Verify lint, TypeScript, Expo Doctor, existing web tests/build, and native bundle export.

## Migration decisions

- Mobile is a native redesign rather than a DOM/WebView wrapper because Today and workout logging are high-frequency touch and keyboard flows.
- The web app and its uncommitted files remain untouched. The mobile app uses its own package, lockfile, routes, and assets.
- Existing Supabase email/password accounts remain valid. The new mobile schema is additive and legacy `workout_days` records remain readable for migration.
- Rive is the production character runtime once commissioned `.riv` assets exist. A native animated fallback implements the same avatar contract so onboarding can ship and be tested before artwork delivery.
- Existing recap Lottie assets are reused immediately for first/up/down/same completion states.

## Verification checkpoint

- Mobile TypeScript and Expo lint pass.
- Expo Doctor passes all 21 checks.
- Production Metro exports pass for iOS and Android.
- The existing web application still passes all 9 tests and its Vite production build.
- The Supabase CLI project is initialized and the migration plus owner-isolation SQL test are ready. Executing the database test locally requires Docker Desktop to be running; the daemon was unavailable in this environment.

## Remaining release inputs

- Apply the new migration to the target Supabase project and run `supabase/tests/mobile_access.sql` there or in a local stack.
- Add the project URL and publishable key from `mobile/.env.example`.
- Replace the Reanimated character fallback with the commissioned `.riv` artwork when it is delivered.
- Provide Apple and Google developer credentials, privacy copy, screenshots, and final store metadata for public release.
