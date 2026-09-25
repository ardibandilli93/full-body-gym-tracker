# Full Body Gym Tracker

A React workout journal for the existing three-day full-body routine. Set logs stay on the device until Supabase is configured. Signed-in users can sync workouts across devices.

## Run locally

```bash
npm install
npm run dev
```

To package the 22 exercise demonstration GIFs locally, run `npm run assets`. Until then the app uses the Exercise Library remote GIFs as a fallback.

## Enable Supabase

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the project URL and **publishable** key. Never put a secret or service role key in the client.
3. In Supabase Auth URL configuration, add the app's local and production URLs to the redirect allow list. Email OTP sign in must be enabled.
4. Restart the dev server. Sign in by email. Existing browser workout data can be imported with **Import workouts from this browser** after sign in.

The app retains compatibility with the prior local history key and backup JSON format. Each account's cached history has a separate browser key. RLS restricts cloud rows to their owner.

## Deploy

Netlify builds the Vite app with `npm run build` and publishes `dist`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as Netlify environment variables to enable cloud sync.
