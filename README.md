# Full Body Gym Tracker

A React workout journal for the existing three-day full-body routine. The web app has no account or backend: workout progress is stored only in the current browser's local storage.

## Run locally

```bash
npm install
npm run dev
```

To package the 22 exercise demonstration GIFs locally, run `npm run assets`. The production app does not fall back to third-party image hosts.

The app retains compatibility with the prior local history key and backup JSON format. When exactly one cache from the former web account system is present, it is copied into the local-only history automatically. Users can export and import a JSON backup from the **Your data** panel. Clearing browser site data removes progress, so the interface explains this before the workout dashboard.

## Deploy

Netlify builds the Vite app with `npm run build` and publishes `dist`. No backend or environment variables are required for the web app.

The hero uses locally hosted athlete sprite sheets for side, rear, and turning views. The athletes take about four steps, turn toward the viewer for a dumbbell press, take another four steps, turn for squats, and repeat in a closed loop. The canvas renders at up to 60 frames per second while visible and shows a still pose for reduced-motion preferences. No third-party video is embedded.
