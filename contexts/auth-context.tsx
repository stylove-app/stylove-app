import type { AuthError, Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { isRegisteredAccount } from '@/lib/auth-session';
import { resetAllLocalCaches } from '@/lib/user-scoped-storage';
import {
  signInWithEmail,
  signOut as authSignOut,
  signUpWithEmail,
  type SignInResult,
  type SignUpResult,
} from '@/services/auth';
import { supabase } from '@/services/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  userId: string | null;
  ready: boolean;
  initError: boolean;
  isAnonymous: boolean;
  isRegistered: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<AuthError | null>;
  clearLocalSession: () => Promise<void>;
  retrySessionRestore: () => Promise<void>;
  resetBrokenSessionForSignIn: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState(false);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession((current) => {
      const currentToken = current?.access_token ?? null;
      const nextToken = nextSession?.access_token ?? null;
      return currentToken === nextToken ? current : nextSession;
    });
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setInitError(true);
        return;
      }
      if (data.session?.user) {
        applySession(data.session);
      }
      setInitError(false);
    } catch {
      setInitError(true);
    }
  }, [applySession]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await restoreSession();
      } finally {
        if (mounted) setReady(true);
      }
    };

    void init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
      setInitError(false);
      setReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applySession, restoreSession]);

  const retrySessionRestore = useCallback(async () => {
    setInitError(false);
    try {
      await restoreSession();
    } finally {
      setReady(true);
    }
  }, [restoreSession]);

  const resetBrokenSessionForSignIn = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Continue with local cleanup even if auth storage cannot be cleared.
    }
    applySession(null);
    await resetAllLocalCaches();
    setInitError(false);
    setReady(true);
  }, [applySession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInWithEmail(email, password);
    if (result.session) {
      await resetAllLocalCaches();
      applySession(result.session);
    }
    return result;
  }, [applySession]);

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await signUpWithEmail(email, password);
    if (result.session) {
      await resetAllLocalCaches();
      applySession(result.session);
    }
    return result;
  }, [applySession]);

  const signOut = useCallback(async () => {
    const { error } = await authSignOut();
    if (!error) {
      applySession(null);
      await resetAllLocalCaches();
    }
    return error;
  }, [applySession]);

  const clearLocalSession = useCallback(async () => {
    applySession(null);
    await resetAllLocalCaches();
  }, [applySession]);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  const isRegistered = isRegisteredAccount(user);

  const value = useMemo(
    () => ({
      session,
      user,
      userId,
      ready,
      initError,
      isAnonymous: !!user && !isRegistered,
      isRegistered,
      signIn,
      signUp,
      signOut,
      clearLocalSession,
      retrySessionRestore,
      resetBrokenSessionForSignIn,
    }),
    [session, user, userId, ready, initError, isRegistered, signIn, signUp, signOut, clearLocalSession, retrySessionRestore, resetBrokenSessionForSignIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
