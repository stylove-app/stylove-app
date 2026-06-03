import { getLocales } from 'expo-localization';

import type { Locale } from '@/i18n/types';

export const SUPPORTED_LOCALES: readonly Locale[] = ['tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'ru'];

export const DEFAULT_LOCALE: Locale = 'en';

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return value != null && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Maps device language tags to a supported app locale, or English when unsupported. */
export function detectDeviceLocale(): Locale {
  const locales = getLocales();
  const candidates = [
    ...locales.map((entry) => entry.languageCode?.toLowerCase()),
    ...locales.map((entry) => entry.languageTag?.split('-')[0]?.toLowerCase()),
  ];

  for (const code of candidates) {
    if (isSupportedLocale(code)) return code;
  }

  return DEFAULT_LOCALE;
}
