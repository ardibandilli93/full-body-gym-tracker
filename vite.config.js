import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (Boolean(url) !== Boolean(key)) throw new Error('Configure both Supabase URL and publishable key');
  if (key && !key.startsWith('sb_publishable_')) throw new Error('Only a Supabase publishable key may be bundled');
  // The bundled animation uses no expressions; omit Lottie's eval-capable engine.
  return { resolve: { alias: [{ find: /^lottie-web$/, replacement: 'lottie-web/build/player/lottie_light.js' }] } };
});
