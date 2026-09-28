import type { RoutinePlan, UserProfile, WorkoutSession } from '@/domain/types';
import { appRepository } from '@/repositories/app-repository';
import { supabase } from './supabase';

const activePushes = new Map<string, Promise<void>>();

async function pushQueue(ownerId: string): Promise<void> {
  if (!supabase) return;
  while (true) {
    const items = await appRepository.pendingSync(ownerId);
    if (!items.length) return;
    for (const item of items) {
      try {
      const payload = JSON.parse(item.payloadJson) as UserProfile | RoutinePlan | WorkoutSession;
      let error: { message: string } | null = null;

      if (item.entityType === 'profile') {
        const profile = payload as UserProfile;
        ({ error } = await supabase.from('mobile_profiles').upsert({
          user_id: ownerId,
          preferred_name: profile.preferredName,
          gender: profile.gender,
          age: profile.age,
          unit_system: profile.unitSystem,
          height_cm: profile.heightCm,
          current_weight_kg: profile.currentWeightKg,
          goal_weight_kg: profile.goalWeightKg,
          onboarding_complete: profile.onboardingComplete,
          payload: profile,
          created_at: profile.createdAt,
          updated_at: profile.updatedAt,
        }, { onConflict: 'user_id' }));
      } else if (item.entityType === 'plan') {
        const plan = payload as RoutinePlan;
        const inactiveResult = await supabase.from('routine_plans').update({ is_active: false }).eq('user_id', ownerId);
        error = inactiveResult.error;
        if (!error) {
          ({ error } = await supabase.from('routine_plans').upsert({
            user_id: ownerId,
            id: plan.id,
            name: plan.name,
            days_per_week: plan.daysPerWeek,
            is_active: true,
            payload: plan,
            updated_at: plan.updatedAt,
          }, { onConflict: 'user_id,id' }));
        }
      } else if (item.entityType === 'workout_session') {
        const session = payload as WorkoutSession;
        ({ error } = await supabase.from('mobile_workout_sessions').upsert({
          user_id: ownerId,
          id: session.id,
          local_date: session.localDate,
          plan_day_id: session.planDayId,
          status: session.status,
          calories_burned: session.caloriesBurned,
          payload: session,
          started_at: session.startedAt,
          finished_at: session.finishedAt,
          updated_at: session.updatedAt,
        }, { onConflict: 'user_id,id' }));
      }

      if (error) throw new Error(error.message);
      await appRepository.markSynced(item.id, item.entityType === 'workout_session' ? item.entityId : undefined);
      } catch (syncError) {
        const message = syncError instanceof Error ? syncError.message : 'Unknown sync failure';
        await appRepository.markSyncFailed(item.id, message);
        throw syncError;
      }
    }
  }
}

export function pushPendingChanges(ownerId: string): Promise<void> {
  if (!supabase || ownerId === 'local-preview') return Promise.resolve();
  const existing = activePushes.get(ownerId);
  if (existing) return existing;
  const push = pushQueue(ownerId).finally(() => { activePushes.delete(ownerId); });
  activePushes.set(ownerId, push);
  return push;
}

export async function pullCloudSnapshot(ownerId: string): Promise<void> {
  if (!supabase || ownerId === 'local-preview') return;
  const [profileResult, planResult, sessionsResult] = await Promise.all([
    supabase.from('mobile_profiles').select('payload').eq('user_id', ownerId).maybeSingle(),
    supabase.from('routine_plans').select('payload').eq('user_id', ownerId).eq('is_active', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('mobile_workout_sessions').select('payload').eq('user_id', ownerId).order('started_at', { ascending: false }).limit(500),
  ]);
  const error = profileResult.error ?? planResult.error ?? sessionsResult.error;
  if (error) throw new Error(error.message);

  const writes: Promise<void>[] = [];
  if (profileResult.data?.payload) writes.push(appRepository.saveProfile(ownerId, profileResult.data.payload as UserProfile, false));
  if (planResult.data?.payload) writes.push(appRepository.savePlan(ownerId, planResult.data.payload as RoutinePlan, false));
  for (const row of sessionsResult.data ?? []) {
    writes.push(appRepository.saveSession(ownerId, row.payload as WorkoutSession, false));
  }
  await Promise.all(writes);
}
