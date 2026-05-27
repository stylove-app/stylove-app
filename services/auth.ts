import type { AuthError, Session, User } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';

export type AuthResult = { error: AuthError | null };

export type SignUpResult = {
  error: AuthError | null;
  session: Session | null;
  needsEmailConfirmation: boolean;
};

export type SignInResult = {
  error: AuthError | null;
  session: Session | null;
};

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function ensureAuthSession(): Promise<{ user: User | null; error: AuthError | null }> {
  const existing = await getSession();
  if (existing?.user) {
    return { user: existing.user, error: null };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  return { user: data.user, error };
}

export async function signInWithEmail(email: string, password: string): Promise<SignInResult> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user?.is_anonymous) {
    await supabase.auth.signOut();
  }
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
  return { error, session: signInData.session };
}

export async function signUpWithEmail(email: string, password: string): Promise<SignUpResult> {
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user?.is_anonymous) {
    const { data, error } = await supabase.auth.updateUser({ email, password });
    const { data: sessionData } = await supabase.auth.getSession();
    return {
      error,
      session: sessionData.session ?? null,
      needsEmailConfirmation: !error && !!data.user && !sessionData.session,
    };
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  return {
    error,
    session: data.session,
    needsEmailConfirmation: !error && !!data.user && !data.session,
  };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export function isAnonymousUser(user: User | null): boolean {
  return user?.is_anonymous === true;
}
