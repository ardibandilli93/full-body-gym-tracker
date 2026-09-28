import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { isBackendConfigured, supabase } from '@/lib/supabase';
import { LEGAL_VERSION } from '@/legal/policies';
import { appRepository } from '@/repositories/app-repository';

type AuthResult = {
  error: string | null;
  needsEmailConfirmation?: boolean;
  emailAlreadyRegistered?: boolean;
};

type AuthContextValue = {
  session: Session | null;
  ownerId: string | null;
  loading: boolean;
  backendConfigured: boolean;
  offlinePreview: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  startOfflinePreview: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [offlinePreview, setOfflinePreview] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Add your Supabase keys to enable account sign in.' };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Add your Supabase keys to enable account creation.' };
    const acceptedAt = new Date().toISOString();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          legal_version: LEGAL_VERSION,
          terms_accepted_at: acceptedAt,
          privacy_acknowledged_at: acceptedAt,
        },
      },
    });

    const returnedObfuscatedUser = !error
      && Boolean(data.user)
      && Array.isArray(data.user?.identities)
      && data.user.identities.length === 0;
    const returnedDuplicateError = error?.code === 'user_already_exists'
      || error?.code === 'email_exists'
      || error?.message.toLowerCase().includes('already registered');

    if (returnedObfuscatedUser || returnedDuplicateError) {
      return { error: null, emailAlreadyRegistered: true };
    }

    return {
      error: error?.message ?? null,
      needsEmailConfirmation: !error && !data.session,
    };
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Add your Supabase keys to enable password reset.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'fullbody://reset-password',
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    setOfflinePreview(false);
    if (supabase) await supabase.auth.signOut();
  }, []);

  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
    const ownerId = session?.user.id ?? (offlinePreview ? 'local-preview' : null);
    if (!ownerId) return { error: 'No account is signed in.' };

    if (ownerId !== 'local-preview') {
      if (!supabase) return { error: 'The account service is unavailable.' };
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error) return { error: error.message || 'Could not delete the account.' };
    }

    await appRepository.deleteOwnerData(ownerId);
    setOfflinePreview(false);
    if (supabase) await supabase.auth.signOut({ scope: 'local' });
    setSession(null);
    return { error: null };
  }, [session, offlinePreview]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    ownerId: session?.user.id ?? (offlinePreview ? 'local-preview' : null),
    loading,
    backendConfigured: isBackendConfigured,
    offlinePreview,
    signIn,
    signUp,
    resetPassword,
    deleteAccount,
    signOut,
    startOfflinePreview: () => setOfflinePreview(true),
  }), [session, offlinePreview, loading, signIn, signUp, resetPassword, deleteAccount, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
