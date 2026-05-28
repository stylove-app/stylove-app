import ar from '@/i18n/locales/ar';
import de from '@/i18n/locales/de';
import en from '@/i18n/locales/en';
import fr from '@/i18n/locales/fr';
import { LOCALE_COMPLETION_PATCHES } from '@/i18n/locale-completion-patches';
import tr from '@/i18n/locales/tr';
import type { Locale, TranslationKeys } from '@/i18n/types';

export const LOCALES: { id: Locale; label: string; native: string }[] = [
  { id: 'tr', label: 'Turkish', native: 'Türkçe' },
  { id: 'en', label: 'English', native: 'English' },
  { id: 'de', label: 'German', native: 'Deutsch' },
  { id: 'fr', label: 'French', native: 'Français' },
  { id: 'es', label: 'Spanish', native: 'Español' },
  { id: 'it', label: 'Italian', native: 'Italiano' },
  { id: 'ar', label: 'Arabic', native: 'العربية' },
  { id: 'ru', label: 'Russian', native: 'Русский' },
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
  es: en,
  it: en,
  ru: en,
};

function mergeDeep<T>(base: T, patch: DeepPartial<T>): T {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch as T;
  if (!base || typeof base !== 'object' || Array.isArray(base)) return patch as T;

  const result = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(patch as Record<string, unknown>)) {
    const patchValue = (patch as Record<string, unknown>)[key];
    const baseValue = (base as Record<string, unknown>)[key];
    result[key] =
      patchValue &&
      typeof patchValue === 'object' &&
      !Array.isArray(patchValue) &&
      baseValue &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue)
        ? mergeDeep(baseValue, patchValue as DeepPartial<typeof baseValue>)
        : patchValue;
  }
  return result as T;
}

export function getTranslations(locale: Locale): TranslationKeys {
  if (locale === 'en') return en;
  if (locale === 'tr') return tr;
  const patch = localePatches[locale] ?? en;
  return mergeDeep(mergeDeep(en, patch), LOCALE_COMPLETION_PATCHES[locale] ?? {});
}

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}
