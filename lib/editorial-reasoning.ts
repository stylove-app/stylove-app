import type { MoodId, TranslationKeys } from '@/i18n/types';
import type { EventContext } from '@/lib/event-intelligence';
import type { WeatherSnapshot } from '@/lib/weather';
import { weatherMoodBoost } from '@/lib/weather';

export type EditorialReasoning = {
  colorHarmony: string;
  weatherCompatibility: string;
  emotionalTone: string;
  silhouetteBalance: string;
};

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

export function buildEditorialReasoning(
  t: TranslationKeys,
  mood: MoodId,
  seed: number,
  weather?: WeatherSnapshot,
  event?: EventContext,
): EditorialReasoning {
  const colorHarmony = pick(t.editorial.colorHarmonyLines[mood], seed);
  let weatherCompatibility = pick(t.editorial.weatherDefault, seed + 1);

  if (weather) {
    const { layerHint, preferIndoor } = weatherMoodBoost(weather.condition, weather.temperature);
    const condition = t.weather.conditions[weather.condition];
    if (preferIndoor) {
      weatherCompatibility = t.editorial.weatherIndoor
        .replace('{condition}', condition)
        .replace('{temp}', String(weather.temperature));
    } else if (layerHint === 'warm') {
      weatherCompatibility = t.editorial.weatherWarm
        .replace('{condition}', condition)
        .replace('{temp}', String(weather.temperature));
    } else {
      weatherCompatibility = t.editorial.weatherLight
        .replace('{city}', weather.city)
        .replace('{condition}', condition)
        .replace('{temp}', String(weather.temperature));
    }
  }

  const emotionalTone = event
    ? `${pick(t.editorial.emotionalToneLines[mood], seed + 2)} ${event.vibe.toLowerCase()} — ${event.dressCode.toLowerCase()}.`
    : pick(t.editorial.emotionalToneLines[mood], seed + 2);

  const silhouetteBalance = pick(t.editorial.silhouetteBalanceLines[mood], seed + 3);

  return { colorHarmony, weatherCompatibility, emotionalTone, silhouetteBalance };
}
