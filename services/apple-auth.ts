import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import type { AuthError, Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { EMPTY_USER_PROFILE } from '@/lib/user-profile';
import { fetchProfile, upsertProfile } from '@/services/profile-db';
import { supabase } from '@/services/supabase';

export type AppleSignInResult = {
  error: AuthError | null;
  session: Session | null;
  cancelled?: boolean;
};

async function generateSecureNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return { raw, hashed };
}

async function clearAnonymousSessionIfNeeded(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user?.is_anonymous) {
    await supabase.auth.signOut();
  }
}

async function applyAppleFullNameIfEmpty(
  userId: string,
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): Promise<void> {
  if (!fullName) return;

  const firstName = fullName.givenName?.trim() ?? '';
  const lastName = fullName.familyName?.trim() ?? '';
  if (!firstName && !lastName) return;

  const existing = await fetchProfile(userId);
  if (existing?.firstName.trim() || existing?.lastName.trim()) return;

  await upsertProfile(userId, {
    ...(existing ?? EMPTY_USER_PROFILE),
    firstName,
    lastName,
    username: existing?.username ?? '',
    photoUri: existing?.photoUri ?? null,
  });
}

function authError(message: string): AuthError {
  return { message, name: 'AuthApiError', status: 400 } as AuthError;
}

export async function signInWithApple(): Promise<AppleSignInResult> {
  if (Platform.OS !== 'ios') {
    return { error: authError('Apple Sign In is only available on iOS.'), session: null };
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    return { error: authError('Apple Sign In is not available on this device.'), session: null };
  }

  try {
    await clearAnonymousSessionIfNeeded();

    const { raw, hashed } = await generateSecureNonce();

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashed,
    });

    if (!credential.identityToken) {
      return { error: authError('Apple did not return an identity token.'), session: null };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: raw,
    });

    if (error) {
      return { error, session: null };
    }

    if (data.session?.user) {
      try {
        await applyAppleFullNameIfEmpty(data.session.user.id, credential.fullName);
      } catch {
        // Best-effort profile enrichment; auth already succeeded.
      }
    }

    return { error: null, session: data.session };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ERR_REQUEST_CANCELED'
    ) {
      return { error: null, session: null, cancelled: true };
    }

    const message = error instanceof Error ? error.message : 'Apple Sign In failed.';
    return { error: authError(message), session: null };
  }
}
