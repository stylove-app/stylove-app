import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WeatherSnapshot } from '@/lib/weather';

const HOME_WEATHER_CACHE_KEY = 'stylove:home-weather:v1';
const CACHE_MAX_AGE_MS = 45 * 60 * 1000;

export type CachedHomeWeather = {
  snapshot: WeatherSnapshot;
  latitude: number;
  longitude: number;
  savedAt: number;
};

export async function readHomeWeatherCache(): Promise<CachedHomeWeather | null> {
  try {
    const raw = await AsyncStorage.getItem(HOME_WEATHER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedHomeWeather;
    if (!parsed?.snapshot?.city || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > CACHE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeHomeWeatherCache(entry: CachedHomeWeather): Promise<void> {
  try {
    await AsyncStorage.setItem(HOME_WEATHER_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore persistence errors
  }
}
