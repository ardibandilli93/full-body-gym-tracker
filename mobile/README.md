# Full Body mobile

Native iOS and Android workout tracking built with Expo SDK 57 and Expo Router. The app is offline first: profile, routine, and workout edits commit to SQLite immediately, then an owner-scoped queue syncs them to Supabase when connectivity is available.

## Run locally

1. Copy `.env.example` to `.env` and add the Supabase project URL and publishable key.
2. Apply the root Supabase migrations, including `20260928082109_mobile_app_v1.sql`.
3. Install packages with `npm install`.
4. Build a development client with `npx expo run:ios`, `npx expo run:android`, or EAS using the `development` profile.
5. Start Metro with `npm run start:dev-client`.

`@expo/ui`, SQLite, SecureStore, and the other native packages require a development build. When no Supabase variables are configured, the sign-in screen offers a clearly labelled local preview for design and QA work.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run doctor
npx expo export --platform ios
npx expo export --platform android
```

The app targets users aged 16 and over. Calories are entered from a watch or gym machine because a formula-only estimate would imply more accuracy than the app has.
