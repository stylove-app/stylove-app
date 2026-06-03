import type { MoodId } from '@/i18n/types';
import type { EventContext } from '@/lib/event-intelligence';
import type { WeatherSnapshot } from '@/lib/weather';
import { weatherMoodBoost } from '@/lib/weather';

export type LuxuryScores = {
  elegance: number;
  confidence: number;
  minimalism: number;
  nightEnergy: number;
  streetLuxury: number;
};

const MOOD_BASE: Record<MoodId, LuxuryScores> = {
  elegant: { elegance: 94, confidence: 82, minimalism: 72, nightEnergy: 78, streetLuxury: 65 },
  soft: { elegance: 86, confidence: 70, minimalism: 68, nightEnergy: 62, streetLuxury: 58 },
  confident: { elegance: 88, confidence: 96, minimalism: 74, nightEnergy: 85, streetLuxury: 88 },
  oldMoney: { elegance: 97, confidence: 84, minimalism: 88, nightEnergy: 70, streetLuxury: 62 },
  seductive: { elegance: 90, confidence: 88, minimalism: 65, nightEnergy: 92, streetLuxury: 75 },
  minimal: { elegance: 85, confidence: 78, minimalism: 97, nightEnergy: 68, streetLuxury: 72 },
};

function clamp(n: number): number {
  return Math.min(99, Math.max(62, Math.round(n)));
}

export function computeLuxuryScores(
  mood: MoodId,
  seed: number,
  weather?: WeatherSnapshot,
  event?: EventContext,
  outfitCoherence?: number,
): LuxuryScores {
  const base = { ...MOOD_BASE[mood] };
  const mod = seed % 5;

  base.elegance += mod;
  base.confidence += (seed >> 2) % 4;
  base.minimalism += (seed >> 4) % 3;
  base.nightEnergy += (seed >> 6) % 4;
  base.streetLuxury += (seed >> 8) % 3;

  if (weather) {
    const { layerHint, preferIndoor } = weatherMoodBoost(weather.condition, weather.temperature);
    if (preferIndoor) base.elegance += 2;
    if (layerHint === 'warm') base.confidence += 1;
    if (weather.hour >= 18 || !weather.isDay) base.nightEnergy += 4;
    if (weather.isDay && weather.hour < 17) base.minimalism += 2;
  }

  if (event) {
    if (event.luxuryLevel === 'haute') {
      base.elegance += 3;
      base.minimalism += 2;
    }
    if (event.luxuryLevel === 'casual-luxe') base.streetLuxury += 3;
    if (event.vibe.toLowerCase().includes('night') || event.vibe.toLowerCase().includes('nocturnal')) {
      base.nightEnergy += 3;
    }
    if (event.dressCode.toLowerCase().includes('executive') || event.dressCode.toLowerCase().includes('sharp')) {
      base.confidence += 3;
    }
  }

  if (outfitCoherence != null && outfitCoherence > 12) {
    const boost = Math.min(4, Math.floor((outfitCoherence - 12) / 3));
    base.elegance += boost;
    base.minimalism += Math.min(2, boost);
  } else if (outfitCoherence != null && outfitCoherence < 4) {
    base.elegance -= 2;
  }

  return {
    elegance: clamp(base.elegance),
    confidence: clamp(base.confidence),
    minimalism: clamp(base.minimalism),
    nightEnergy: clamp(base.nightEnergy),
    streetLuxury: clamp(base.streetLuxury),
  };
}
