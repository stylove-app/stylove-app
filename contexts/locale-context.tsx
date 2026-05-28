import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getTranslations, interpolate, isRtl } from '@/i18n';
import type { Locale, TranslationKeys } from '@/i18n/types';

const LOCALE_KEY = '@stylove/locale';
const SUPPORTED_LOCALES: readonly Locale[] = ['tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'ru'];

function isSupportedLocale(value: string | null): value is Locale {
  return value !== null && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

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
  const [locale, setLocaleState] = useState<Locale>('tr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AsyncStorage.getItem(LOCALE_KEY).then((stored) => {
      if (!mounted) return;
      if (isSupportedLocale(stored)) {
        setLocaleState(stored);
      }
      setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    await AsyncStorage.setItem(LOCALE_KEY, next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: getTranslations(locale),
      isRtl: isRtl(locale),
      ready,
      setLocale,
      i: (template, values) => interpolate(template, values ?? {}),
    }),
    [locale, ready, setLocale],
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
