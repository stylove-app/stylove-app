export type QaAppEnv = 'development' | 'preview' | 'production';

/** Inlined at build time via EXPO_PUBLIC_APP_ENV (EAS profile env). */
export function getAppEnv(): QaAppEnv {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  if (raw === 'development' || raw === 'preview') return raw;
  return 'production';
}

/**
 * QA test mode for internal builds only.
 * Unlocks premium and disables free-plan limits. Never active when env is production or unset.
 */
export function isQaTestMode(): boolean {
  const env = getAppEnv();
  return env === 'development' || env === 'preview';
}
