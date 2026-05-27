import type { MoodId, TranslationKeys } from '@/i18n/types';
import type { StyleMemory } from '@/lib/style-memory';
import type { WeatherSnapshot } from '@/lib/weather';
import { getTimeOfDay } from '@/lib/weather';

type AuraInput = {
  t: TranslationKeys;
  weather?: WeatherSnapshot;
  intent?: string;
  wardrobeTone?: MoodId;
  styleMemory?: StyleMemory;
  styleMood?: MoodId;
};

function dominantMood(memory?: StyleMemory): MoodId | null {
  if (!memory) return null;
  const entries = Object.entries(memory.moodFrequency) as [MoodId, number][];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 0 ? top[0] : null;
}

export function getTodaysAura({
  t,
  weather,
  intent,
  wardrobeTone,
  styleMemory,
  styleMood,
}: AuraInput): string {
  const hour = weather?.hour ?? new Date().getHours();
  const timeOfDay = weather ? getTimeOfDay(hour) : getTimeOfDay(new Date().getHours());
  const memoryMood = dominantMood(styleMemory);
  const tone = styleMood ?? wardrobeTone ?? memoryMood ?? 'elegant';
  const intentLower = (intent ?? '').toLowerCase();

  const timeAuras = t.aura.byTime[timeOfDay];
  const toneAuras = t.aura.byTone[tone];
  const seed = (hour + (weather?.temperature ?? 18) + intentLower.length) % timeAuras.length;
  let aura = timeAuras[seed] ?? toneAuras[0];

  if (intentLower.includes('minimal') || tone === 'minimal') {
    aura = pick(t.aura.byTone.minimal, seed);
  } else if (intentLower.includes('confident') || intentLower.includes('cesur') || tone === 'confident') {
    aura = pick(t.aura.byTone.confident, seed);
  } else if (
    intentLower.includes('romantik') ||
    intentLower.includes('romantic') ||
    tone === 'soft' ||
    tone === 'seductive'
  ) {
    aura = pick(t.aura.byTone.soft, seed);
  } else if (intentLower.includes('quiet luxury') || tone === 'oldMoney') {
    aura = pick(t.aura.byTone.oldMoney, seed);
  } else if (tone === 'elegant') {
    aura = pick(t.aura.byTone.elegant, seed);
  }

  if (weather) {
    const { condition } = weather;
    if (condition === 'rain' || condition === 'drizzle') {
      aura = `${aura} ${t.aura.weatherSuffix.rain}`;
    } else if (condition === 'clear' && weather.isDay) {
      aura = `${aura} ${t.aura.weatherSuffix.clear}`;
    } else if (!weather.isDay || hour >= 20) {
      aura = `${aura} ${t.aura.weatherSuffix.night}`;
    }
  }

  return aura.trim();
}

function pick(arr: readonly string[], seed: number): string {
  return arr[seed % arr.length];
}

export function inferWardrobeTone(categories: string[]): MoodId {
  const counts: Partial<Record<string, number>> = {};
  for (const cat of categories) counts[cat] = (counts[cat] ?? 0) + 1;

  if ((counts.outerwear ?? 0) + (counts.dress ?? 0) >= 3) return 'elegant';
  if ((counts.accessory ?? 0) + (counts.bag ?? 0) >= 2) return 'oldMoney';
  if ((counts.shoes ?? 0) >= 2) return 'confident';
  return 'elegant';
}
