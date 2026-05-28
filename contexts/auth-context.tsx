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
  isAnonymous: boolean;
  isRegistered: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<AuthError | null>;
  clearLocalSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession((current) => {
      const currentToken = current?.access_token ?? null;
      const nextToken = nextSession?.access_token ?? null;
      return currentToken === nextToken ? current : nextSession;
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        if (mounted) applySession(data.session);
      }
      if (mounted) setReady(true);
    };

    void init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
      setReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(async (email: string, password: string) => {
    await resetAllLocalCaches();
    const result = await signInWithEmail(email, password);
    if (result.session) applySession(result.session);
    return result;
  }, [applySession]);

  const signUp = useCallback(async (email: string, password: string) => {
    await resetAllLocalCaches();
    const result = await signUpWithEmail(email, password);
    if (result.session) applySession(result.session);
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
      isAnonymous: !!user && !isRegistered,
      isRegistered,
      signIn,
      signUp,
      signOut,
      clearLocalSession,
    }),
    [session, user, userId, ready, isRegistered, signIn, signUp, signOut, clearLocalSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
