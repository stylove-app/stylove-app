import ar from '@/i18n/locales/ar';
import de from '@/i18n/locales/de';
import en from '@/i18n/locales/en';
import fr from '@/i18n/locales/fr';
import tr from '@/i18n/locales/tr';
import type { Locale, TranslationKeys } from '@/i18n/types';

export const LOCALES: { id: Locale; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'tr', label: 'Turkish', native: 'Türkçe' },
  { id: 'fr', label: 'French', native: 'Français' },
  { id: 'ar', label: 'Arabic', native: 'العربية' },
  { id: 'de', label: 'German', native: 'Deutsch' },
];

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends readonly unknown[]
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

const localePatches: Record<Locale, TranslationKeys | DeepPartial<TranslationKeys>> = {
  en,
  tr,
  fr,
  ar,
  de,
};

function mergeTranslations(
  base: TranslationKeys,
  patch: DeepPartial<TranslationKeys>,
): TranslationKeys {
  const result = { ...base, ...patch } as TranslationKeys;

  for (const key of Object.keys(patch) as (keyof TranslationKeys)[]) {
    const value = patch[key];
    const baseValue = base[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue)
    ) {
      (result as Record<string, unknown>)[key as string] = {
        ...(baseValue as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      };
    }
  }

  return result;
}

export function getTranslations(locale: Locale): TranslationKeys {
  if (locale === 'en') return en;
  if (locale === 'tr') return tr;
  const patch = localePatches[locale] ?? en;
  return mergeTranslations(en, patch);
}

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}
