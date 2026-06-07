import type { AuthError } from '@supabase/supabase-js';

import type { TranslationKeys } from '@/i18n/types';

type AccountErrors = TranslationKeys['profile']['account']['errors'];

export function mapAuthError(
  error: AuthError | null,
  errors: AccountErrors,
  flow: 'signIn' | 'signUp' = 'signIn',
): string {
  if (!error) return flow === 'signUp' ? errors.genericSignUp : errors.genericSignIn;

  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return errors.invalidCredentials;
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return errors.emailNotConfirmed;
  }
  if (
    code === 'user_already_registered' ||
    message.includes('already registered') ||
    message.includes('already been registered')
  ) {
    return errors.userExists;
  }
  if (code === 'weak_password' || (message.includes('password') && message.includes('least'))) {
    return errors.weakPassword;
  }
  if (message.includes('valid email') || code === 'validation_failed') {
    return errors.invalidEmail;
  }
  if (message.includes('rate limit') || code === 'over_request_rate_limit') {
    return errors.rateLimited;
  }

  return error.message || (flow === 'signUp' ? errors.genericSignUp : errors.genericSignIn);
}

export function mapAppleSignInError(error: AuthError | null, errors: AccountErrors): string {
  if (!error) return errors.genericSignIn;

  const message = (error.message ?? '').toLowerCase();

  if (
    message.includes('only available on ios') ||
    message.includes('not available on this device')
  ) {
    return errors.appleUnavailable;
  }
  if (message.includes('identity token')) {
    return errors.appleSignInFailed;
  }

  return mapAuthError(error, errors, 'signIn');
}
