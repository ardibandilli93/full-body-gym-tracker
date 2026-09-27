import { createClient } from '@supabase/supabase-js';
import { validateDay, validateHistory } from './validation.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// Only a publishable key belongs in a public bundle.
if (key && !key.startsWith('sb_publishable_')) throw new Error('Configure a Supabase publishable key');
export const supabase = url && key ? createClient(url, key) : null;

export async function loadCloudHistory(userId) {
  const { data, error } = await supabase.from('workout_days').select('workout_date,session,exercises,updated_at').eq('user_id', userId);
  if (error) throw error;
  return validateHistory(Object.fromEntries((data || []).map(row => [row.workout_date, { session: row.session, exercises: row.exercises || {}, updatedAt: row.updated_at }])), { skipInvalid: true });
}

export async function saveCloudDay(userId, date, day) {
  day = validateDay(date, day);
  const exercises = day.completion ? { ...day.exercises, _completion: day.completion } : day.exercises || {};
  const { error } = await supabase.from('workout_days').upsert({ user_id: userId, workout_date: date, session: day.session || '', exercises, updated_at: day.updatedAt || new Date().toISOString() }, { onConflict: 'user_id,workout_date' });
  if (error) throw error;
}

export async function deleteCloudDay(userId, date) {
  const { error } = await supabase.from('workout_days').delete().eq('user_id', userId).eq('workout_date', date);
  if (error) throw error;
}
