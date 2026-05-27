/**
 * Localized event context for outfit generation.
 * Rule IDs map to i18n events.rules; occasions map to events.occasions.
 */

import type { OccasionId, TranslationKeys } from '@/i18n/types';
import type { WeatherSnapshot } from '@/lib/weather';
import { getTimeOfDay } from '@/lib/weather';

export type LuxuryLevel = 'casual-luxe' | 'elevated' | 'haute';

export type EventContext = {
  ruleId?: string;
  venue: string | null;
  dressCode: string;
  vibe: string;
  luxuryLevel: LuxuryLevel;
  timeContext: string;
  occasion: OccasionId;
};

type VenueRule = {
  id: string;
  patterns: RegExp[];
  luxuryLevel: LuxuryLevel;
  moodBias?: import('@/i18n/types').MoodId;
};

const VENUE_RULES: VenueRule[] = [
  {
    id: 'bodrum',
    patterns: [/bodrum/i, /beach club/i, /yalıkavak/i, /türkbükü/i],
    luxuryLevel: 'elevated',
    moodBias: 'soft',
  },
  {
    id: 'nisantasi',
    patterns: [/nişantaşı/i, /nisantasi/i, /maçka/i, /macka/i],
    luxuryLevel: 'haute',
    moodBias: 'oldMoney',
  },
  {
    id: 'paris',
    patterns: [/paris/i, /fashion week/i, /fashion night/i, /couture/i],
    luxuryLevel: 'haute',
    moodBias: 'elegant',
  },
  {
    id: 'gala',
    patterns: [/gala/i, /black tie/i, /ball/i],
    luxuryLevel: 'haute',
    moodBias: 'elegant',
  },
  {
    id: 'brunch',
    patterns: [/brunch/i, /café/i, /cafe/i],
    luxuryLevel: 'casual-luxe',
    moodBias: 'soft',
  },
  {
    id: 'meeting',
    patterns: [/meeting/i, /office/i, /boardroom/i],
    luxuryLevel: 'elevated',
    moodBias: 'confident',
  },
  {
    id: 'date',
    patterns: [/date/i, /romantic/i, /romantik/i, /buluşma/i],
    luxuryLevel: 'elevated',
    moodBias: 'seductive',
  },
  {
    id: 'night',
    patterns: [/club/i, /night/i, /after dark/i, /gece/i],
    luxuryLevel: 'elevated',
    moodBias: 'confident',
  },
];

function resolveRuleStrings(
  t: TranslationKeys,
  ruleId: string,
): { venue: string; dressCode: string; vibe: string } {
  const rule = t.events.rules[ruleId];
  if (rule) return rule;
  const fallback = t.events.rules.evening;
  return fallback ?? { venue: '', dressCode: '', vibe: '' };
}

function resolveOccasionStrings(
  t: TranslationKeys,
  occasion: OccasionId,
): { dressCode: string; vibe: string } {
  return t.events.occasions[occasion];
}

export function inferEventContext(
  intent: string,
  t: TranslationKeys,
  weather?: WeatherSnapshot,
  parsedOccasion?: OccasionId,
): EventContext {
  const lower = intent.toLowerCase();
  const hour = weather?.hour ?? new Date().getHours();
  const timeOfDay = weather ? getTimeOfDay(hour) : getTimeOfDay(new Date().getHours());
  const timeContext = t.events.time[timeOfDay];
  const occasion = parsedOccasion ?? 'evening';

  for (const rule of VENUE_RULES) {
    if (rule.patterns.some((p) => p.test(lower))) {
      const strings = resolveRuleStrings(t, rule.id);
      return {
        ruleId: rule.id,
        venue: strings.venue,
        dressCode: strings.dressCode,
        vibe: strings.vibe,
        luxuryLevel: rule.luxuryLevel,
        timeContext,
        occasion,
      };
    }
  }

  const occasionStrings = resolveOccasionStrings(t, occasion);
  return {
    venue: null,
    dressCode: occasionStrings.dressCode,
    vibe: occasionStrings.vibe,
    luxuryLevel: occasion === 'gala' ? 'haute' : occasion === 'brunch' ? 'casual-luxe' : 'elevated',
    timeContext,
    occasion,
  };
}

export function getVenueMoodBias(intent: string): import('@/i18n/types').MoodId | null {
  const lower = intent.toLowerCase();
  for (const rule of VENUE_RULES) {
    if (rule.patterns.some((p) => p.test(lower))) return rule.moodBias ?? null;
  }
  return null;
}

export function getVenueMoodBiasFromRule(ruleId: string): import('@/i18n/types').MoodId | null {
  return VENUE_RULES.find((r) => r.id === ruleId)?.moodBias ?? null;
}
