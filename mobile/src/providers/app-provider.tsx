import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import NetInfo from '@react-native-community/netinfo';

import type { AppSnapshot, RoutinePlan, UserProfile, WorkoutSession } from '@/domain/types';
import { createSession } from '@/domain/workout';
import { appRepository } from '@/repositories/app-repository';
import { pullCloudSnapshot, pushPendingChanges } from '@/lib/sync';
import { useAuth } from './auth-provider';

type ProfileDraft = Omit<UserProfile, 'id' | 'onboardingComplete' | 'createdAt' | 'updatedAt'>;

type AppContextValue = AppSnapshot & {
  loading: boolean;
  error: string | null;
  completeOnboarding: (profile: ProfileDraft, plan: RoutinePlan) => Promise<void>;
  savePlan: (plan: RoutinePlan) => Promise<void>;
  startWorkout: (dayId: string) => Promise<string>;
  saveSession: (session: WorkoutSession) => Promise<void>;
  finishWorkout: (sessionId: string, caloriesBurned: number | null) => Promise<WorkoutSession | null>;
  updateProfile: (changes: Partial<UserProfile>) => Promise<void>;
  refresh: () => Promise<void>;
};

const emptySnapshot: AppSnapshot = { profile: null, activePlan: null, sessions: [] };
const AppContext = createContext<AppContextValue | null>(null);

function pushSilently(ownerId: string) {
  void pushPendingChanges(ownerId).catch(() => undefined);
}

export function AppProvider({ children }: PropsWithChildren) {
  const { ownerId } = useAuth();
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ownerId) {
      setSnapshot(emptySnapshot);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setSnapshot(await appRepository.loadSnapshot(ownerId));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load local workout data.');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    let active = true;
    if (!ownerId) {
      Promise.resolve().then(() => {
        if (!active) return;
        setSnapshot(emptySnapshot);
        setLoading(false);
      });
      return () => { active = false; };
    }

    void appRepository.loadSnapshot(ownerId)
      .then((nextSnapshot) => {
        if (!active) return;
        setSnapshot(nextSnapshot);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Could not load local workout data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [ownerId]);

  useEffect(() => {
    if (!ownerId || ownerId === 'local-preview') return;
    return NetInfo.addEventListener((state) => {
      if (!state.isConnected) return;
      void pushPendingChanges(ownerId)
        .then(() => pullCloudSnapshot(ownerId))
        .then(() => appRepository.loadSnapshot(ownerId))
        .then((nextSnapshot) => setSnapshot(nextSnapshot))
        .catch(() => undefined);
    });
  }, [ownerId]);

  const completeOnboarding = useCallback(async (draft: ProfileDraft, plan: RoutinePlan) => {
    if (!ownerId) throw new Error('An account is required before onboarding.');
    const now = new Date().toISOString();
    const profile: UserProfile = {
      ...draft,
      id: ownerId,
      onboardingComplete: true,
      createdAt: now,
      updatedAt: now,
    };
    await Promise.all([
      appRepository.saveProfile(ownerId, profile),
      appRepository.savePlan(ownerId, plan),
    ]);
    setSnapshot((current) => ({ ...current, profile, activePlan: plan }));
    pushSilently(ownerId);
  }, [ownerId]);

  const savePlan = useCallback(async (plan: RoutinePlan) => {
    if (!ownerId) return;
    const nextPlan = { ...plan, updatedAt: new Date().toISOString() };
    await appRepository.savePlan(ownerId, nextPlan);
    setSnapshot((current) => ({ ...current, activePlan: nextPlan }));
    pushSilently(ownerId);
  }, [ownerId]);

  const startWorkout = useCallback(async (dayId: string) => {
    if (!ownerId || !snapshot.activePlan) throw new Error('Choose a routine before starting a workout.');
    const existing = snapshot.sessions.find((session) => session.status === 'in_progress');
    if (existing) return existing.id;
    const routineDay = snapshot.activePlan.days.find((day) => day.id === dayId);
    if (!routineDay || routineDay.isRest) throw new Error('Choose a training day with exercises.');
    const session = createSession(routineDay);
    await appRepository.saveSession(ownerId, session);
    setSnapshot((current) => ({ ...current, sessions: [session, ...current.sessions] }));
    pushSilently(ownerId);
    return session.id;
  }, [ownerId, snapshot.activePlan, snapshot.sessions]);

  const saveSession = useCallback(async (session: WorkoutSession) => {
    if (!ownerId) return;
    const next = { ...session, updatedAt: new Date().toISOString() };
    await appRepository.saveSession(ownerId, next);
    setSnapshot((current) => ({
      ...current,
      sessions: current.sessions.some((item) => item.id === next.id)
        ? current.sessions.map((item) => item.id === next.id ? next : item)
        : [next, ...current.sessions],
    }));
    pushSilently(ownerId);
  }, [ownerId]);

  const finishWorkout = useCallback(async (sessionId: string, caloriesBurned: number | null) => {
    if (!ownerId) return null;
    const session = snapshot.sessions.find((item) => item.id === sessionId);
    if (!session) return null;
    const now = new Date().toISOString();
    const finished: WorkoutSession = {
      ...session,
      status: 'complete',
      caloriesBurned,
      finishedAt: now,
      updatedAt: now,
    };
    await appRepository.saveSession(ownerId, finished);
    setSnapshot((current) => ({
      ...current,
      sessions: current.sessions.map((item) => item.id === finished.id ? finished : item),
    }));
    pushSilently(ownerId);
    return finished;
  }, [ownerId, snapshot.sessions]);

  const updateProfile = useCallback(async (changes: Partial<UserProfile>) => {
    if (!ownerId || !snapshot.profile) return;
    const profile = { ...snapshot.profile, ...changes, id: ownerId, updatedAt: new Date().toISOString() };
    await appRepository.saveProfile(ownerId, profile);
    setSnapshot((current) => ({ ...current, profile }));
    pushSilently(ownerId);
  }, [ownerId, snapshot.profile]);

  const value = useMemo<AppContextValue>(() => ({
    ...snapshot,
    loading,
    error,
    completeOnboarding,
    savePlan,
    startWorkout,
    saveSession,
    finishWorkout,
    updateProfile,
    refresh,
  }), [snapshot, loading, error, completeOnboarding, savePlan, startWorkout, saveSession, finishWorkout, updateProfile, refresh]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
