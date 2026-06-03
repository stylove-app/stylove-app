/**
 * Event context from user intent + weather — no fabricated venues or cities.
 */

import type { OccasionId, TranslationKeys } from '@/i18n/types';
import type { WeatherSnapshot } from '@/lib/weather';
import { getTimeOfDay } from '@/lib/weather';

export type LuxuryLevel = 'casual-luxe' | 'elevated' | 'haute';

export type EventContext = {
  ruleId?: string;
  /** Only set when the user explicitly referenced a place in their intent. */
  venue: string | null;
  dressCode: string;
  vibe: string;
  luxuryLevel: LuxuryLevel;
  timeContext: string;
  occasion: OccasionId;
};

type MoodRule = {
  id: string;
  patterns: RegExp[];
  luxuryLevel: LuxuryLevel;
  moodBias?: import('@/i18n/types').MoodId;
};

const MOOD_RULES: MoodRule[] = [
  {
    id: 'bodrum',
    patterns: [/bodrum/i, /yalıkavak/i, /türkbükü/i],
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
    id: 'beach',
    patterns: [/beach club/i, /beach/i, /sahil/i, /plaj/i, /coastal/i, /deniz/i],
    luxuryLevel: 'elevated',
    moodBias: 'soft',
  },
  {
    id: 'gala',
    patterns: [/gala/i, /black tie/i, /ball/i],
    luxuryLevel: 'haute',
    moodBias: 'elegant',
  },
  {
    id: 'brunch',
    patterns: [/brunch/i, /lunch/i, /café/i, /cafe/i],
    luxuryLevel: 'casual-luxe',
    moodBias: 'soft',
  },
  {
    id: 'meeting',
    patterns: [/meeting/i, /office/i, /boardroom/i, /toplantı/i, /is\b/i],
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

const MOOD_ONLY_INTENT =
  /^(how do you|nasıl|minimal|confident|elegant|romantic|soft|i want to feel|hissetmek|tonight's mood|your plans|what's the vibe)/i;

/** Extract a place phrase only when the user wrote it — never from preset catalogs. */
export function extractUserVenuePhrase(intent: string): string | null {
  const text = intent.trim();
  if (!text || MOOD_ONLY_INTENT.test(text)) return null;

  const inAt = text.match(/\b(?:in|at|@)\s+([A-Za-zÀ-ÿİıĞğÖöŞşÜü][\w\s'.-]{2,48})/i);
  if (inAt?.[1]) return inAt[1].trim();

  const turkishLocative = text.match(
    /([A-Za-zÀ-ÿİıĞğÖöŞşÜü][\w\s'.-]{2,40})\s*(?:'ta|'te|'da|'de)\b/i,
  );
  if (turkishLocative?.[1]) return turkishLocative[1].trim();

  const forPlace = text.match(/\b(?:for|için|icin)\s+([A-Za-zÀ-ÿİıĞğÖöŞşÜü][\w\s'.-]{2,40})/i);
  if (forPlace?.[1] && !/tonight|evening|dinner|date|gala/i.test(forPlace[1])) {
    return forPlace[1].trim();
  }

  return null;
}

function resolveRuleStrings(
  t: TranslationKeys,
  ruleId: string,
): { dressCode: string; vibe: string } {
  const rule = t.events.rules[ruleId];
  if (rule) return { dressCode: rule.dressCode, vibe: rule.vibe };
  const fallback = t.events.rules.evening;
  return fallback ?? { dressCode: '', vibe: '' };
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
  const venue = extractUserVenuePhrase(intent);

  for (const rule of MOOD_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(lower))) {
      const strings = resolveRuleStrings(t, rule.id);
      return {
        ruleId: rule.id,
        venue,
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
    venue,
    dressCode: occasionStrings.dressCode,
    vibe: occasionStrings.vibe,
    luxuryLevel: occasion === 'gala' ? 'haute' : occasion === 'brunch' ? 'casual-luxe' : 'elevated',
    timeContext,
    occasion,
  };
}

export function getVenueMoodBias(intent: string): import('@/i18n/types').MoodId | null {
  const lower = intent.toLowerCase();
  for (const rule of MOOD_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(lower))) return rule.moodBias ?? null;
  }
  return null;
}

export function getVenueMoodBiasFromRule(ruleId: string): import('@/i18n/types').MoodId | null {
  return MOOD_RULES.find((rule) => rule.id === ruleId)?.moodBias ?? null;
}
