# Full Body Gym Tracker

Mobile-first 3-day full-body workout tracker. Workout history, weights, reps and weekly reports are stored in each visitor's browser with localStorage.

## Real exercise GIFs

This version removes the generated stick-figure animations. The app uses real animated exercise demonstrations from the MIT-licensed [mohamedatef90/exercise-library](https://github.com/mohamedatef90/exercise-library).

There are **22 mapped GIFs**. On a Git-connected Netlify deployment the build command downloads them into `assets/exercises/` automatically:

```bash
npm run build
```

You can run the same command locally before committing if you want the binary GIF files stored in GitHub itself.

The HTML also contains the public raw GitHub URL for each exercise as a fallback. So if an asset is missing, the exercise demo still appears while online instead of showing a blank panel.

## Deploy to Netlify

For Git deployment, Netlify reads `netlify.toml`, runs `node scripts/download-exercise-gifs.mjs`, then publishes the project root.

For a manual drag-and-drop deployment, run `npm run build` first so the `assets/exercises/*.gif` files exist locally, then drag the complete folder into Netlify.

## Data privacy

No account or backend is required. Each visitor's workout logs remain in that browser/device. Export/import can be used to move history between devices.
