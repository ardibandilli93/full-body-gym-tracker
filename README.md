# Full Body Gym Tracker

A React workout journal for the existing three-day full-body routine. Set logs stay on the device until Supabase is configured. Signed-in users can sync workouts across devices.

## Run locally

```bash
npm install
npm run dev
```

To package the 22 exercise demonstration GIFs locally, run `npm run assets`. The production app does not fall back to third-party image hosts.

## Enable Supabase

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the project URL and **publishable** key. Never put a secret or service role key in the client.
3. In Supabase **Authentication → URL Configuration**, set **Site URL** to `https://fullbodygym.netlify.app` and add `https://fullbodygym.netlify.app/sign-in` to **Redirect URLs**. Add a localhost URL separately if needed for local testing. The confirmation email uses the exact production sign-in URL, so leaving it off the allow list can make Supabase fall back to the Site URL. Enable email/password sign-in and email confirmation. If the Confirm signup email template has a custom link using `{{ .SiteURL }}`, update it to use `{{ .ConfirmationURL }}` or the supplied `{{ .RedirectTo }}` as appropriate.
4. Configure custom SMTP in Supabase before inviting public users. Supabase's default mail service only sends to project team members.
5. Keep Supabase authentication rate limits enabled. CAPTCHA is intentionally disabled because the mobile client does not embed a CAPTCHA collector.
6. Restart the dev server. Create an account with email and password, confirm the email, then sign in. Existing browser workout data can be imported with **Import workouts from this browser** after sign in.

The app retains compatibility with the prior local history key and backup JSON format. Each account's cached history has a separate browser key. RLS restricts cloud rows to their owner.

## Deploy

Netlify builds the Vite app with `npm run build` and publishes `dist`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as Netlify environment variables to enable cloud sync.

The hero uses locally hosted athlete sprite sheets for side, rear, and turning views. The athletes take about four steps, turn toward the viewer for a dumbbell press, take another four steps, turn for squats, and repeat in a closed loop. The canvas renders at up to 60 frames per second while visible and shows a still pose for reduced-motion preferences. No third-party video is embedded.
