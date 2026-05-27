import type { AuthError, Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { isRegisteredAccount } from '@/lib/auth-session';
import { resetAllLocalCaches } from '@/lib/user-scoped-storage';
import {
  ensureAuthSession,
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
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        if (mounted) setSession(data.session);
      } else {
        const { error } = await ensureAuthSession();
        if (!error) {
          const { data: next } = await supabase.auth.getSession();
          if (mounted && next.session) setSession(next.session);
        }
      }
      if (mounted) setReady(true);
    };

    void init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await resetAllLocalCaches();
    const result = await signInWithEmail(email, password);
    if (result.session) setSession(result.session);
    return result;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    await resetAllLocalCaches();
    const result = await signUpWithEmail(email, password);
    if (result.session) setSession(result.session);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await authSignOut();
    if (!error) {
      setSession(null);
      await resetAllLocalCaches();
      const { error: anonError } = await ensureAuthSession();
      if (!anonError) {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
      } else {
        setSession(null);
      }
    }
    return error;
  }, []);

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
    }),
    [session, user, userId, ready, isRegistered, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
