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
3. In Supabase **Authentication → URL Configuration**, set **Site URL** to `https://fullbodygym.netlify.app` and add `https://fullbodygym.netlify.app/sign-in` to **Redirect URLs**. Add a localhost URL separately if needed for local testing. The confirmation email uses the exact production sign-in URL, so leaving it off the allow list can make Supabase fall back to the Site URL. Enable email/password sign-in and email confirmation. If the Confirm signup email template has a custom link using `{{ .SiteURL }}`, update it to use `{{ .ConfirmationURL }}` or the supplied `{{ .RedirectTo }}` as appropriate.
4. Configure custom SMTP in Supabase before inviting public users. Supabase's default mail service only sends to project team members.
5. Create an hCaptcha site for the app's production hostname (and `localhost` for local testing). Set `VITE_HCAPTCHA_SITE_KEY` to its **public** site key. In Supabase **Authentication → Attack Protection**, select hCaptcha, enter its **secret key directly in the dashboard**, and enable CAPTCHA protection. Never put the secret in a `VITE_` variable or Git.
6. Restart the dev server. Create an account with email and password, confirm the email, then sign in. Existing browser workout data can be imported with **Import workouts from this browser** after sign in.

The app retains compatibility with the prior local history key and backup JSON format. Each account's cached history has a separate browser key. RLS restricts cloud rows to their owner.

## Deploy

Netlify builds the Vite app with `npm run build` and publishes `dist`. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_HCAPTCHA_SITE_KEY` as Netlify environment variables to enable cloud sync and the account CAPTCHA. The current public hCaptcha site key is also compiled as a fallback.

The hero uses locally hosted athlete sprite sheets for side, front, rear, and turning views. The athletes walk a closed path across a perspective floor, turn toward the viewer for dumbbell presses and squats, then walk away and return. The canvas renders at up to 60 frames per second while visible and shows a still pose for reduced-motion preferences. No third-party video is embedded.
