import React, { createContext, useCallback, useContext, useMemo } from 'react';

import tr from '@/i18n/locales/tr';
import { interpolate } from '@/i18n';
import type { Locale, TranslationKeys } from '@/i18n/types';

/** App is Turkish-only until full EN locale QA is complete. */
const APP_LOCALE: Locale = 'tr';

type LocaleContextValue = {
  locale: Locale;
  t: TranslationKeys;
  isRtl: boolean;
  ready: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  i: (template: string, values?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const setLocale = useCallback(async (_next: Locale) => {
    // Turkish-only: language switching disabled for stability.
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: APP_LOCALE,
      t: tr,
      isRtl: false,
      ready: true,
      setLocale,
      i: (template, values) => interpolate(template, values ?? {}),
    }),
    [setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function useTranslation() {
  return useLocale().t;
}
