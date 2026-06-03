import type { MoodId, TranslationKeys } from '@/i18n/types';
import type { OutfitPiece } from '@/lib/outfit-engine';
import type { StyleMemory } from '@/lib/style-memory';
import type { WeatherSnapshot } from '@/lib/weather';

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

export function truncateCopy(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Occasion line shown on look cards — user intent first, never a fabricated scenario. */
export function buildPersonalizedOccasion(intent: string | undefined, t: TranslationKeys): string {
  const trimmed = (intent ?? '').trim();
  if (trimmed) return truncateCopy(trimmed, 72);
  return t.lookCopy.defaultOccasion;
}

/** Title for a generated look — intent, wardrobe pieces, mood, or neutral pool. */
export function buildPersonalizedTitle(params: {
  t: TranslationKeys;
  intent: string;
  mood: MoodId;
  weather?: WeatherSnapshot;
  pieces: OutfitPiece[];
  seed: number;
  styleMemory?: StyleMemory;
}): string {
  const { t, intent, mood, weather, pieces, seed } = params;
  const trimmedIntent = intent.trim();

  if (trimmedIntent) {
    return truncateCopy(trimmedIntent, 56);
  }

  const moodLabel = t.moods[mood];
  const primary =
    pieces.find((piece) => piece.role === 'dress') ??
    pieces.find((piece) => piece.role === 'top') ??
    pieces[0];
  const secondary =
    pieces.find((piece) => piece.role === 'bottom') ??
    pieces.find((piece) => piece.role === 'shoes');

  if (primary?.item.name.trim()) {
    const name = truncateCopy(primary.item.name, 28);
    if (secondary?.item.name.trim()) {
      return `${name} · ${truncateCopy(secondary.item.name, 20)}`;
    }
    return `${name} · ${moodLabel}`;
  }

  if (pieces.length >= 2) {
    const roles = [...new Set(pieces.map((piece) => piece.label))].slice(0, 2).join(' · ');
    return truncateCopy(`${roles} · ${moodLabel}`, 56);
  }

  if (weather) {
    const condition = t.weather.conditions[weather.condition];
    return truncateCopy(`${moodLabel} · ${weather.temperature}° · ${condition}`, 56);
  }

  return pick(t.lookCopy.neutralTitles, seed);
}

export function buildPersonalizedSummaryLine(params: {
  lookTitle: string;
  description?: string;
  whyThisWorks?: string;
  intent?: string;
  maxLength?: number;
}): string {
  const max = params.maxLength ?? 140;
  const source =
    params.description?.trim() ||
    params.whyThisWorks?.trim() ||
    params.intent?.trim() ||
    params.lookTitle.trim();
  if (!source) return '';
  return truncateCopy(source, max);
}
