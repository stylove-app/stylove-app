import { isQaTestMode } from '@/lib/qa-test-mode';
import type { WeatherCondition } from '@/lib/weather';

export type WeatherDataSource = 'gps' | 'cache' | 'initial' | 'permission_denied';

export function isWeatherDebugEnabled(): boolean {
  return __DEV__ || isQaTestMode();
}

export function logWeatherDebug(params: {
  source: WeatherDataSource;
  weatherReady: boolean;
  coords?: { lat: number; lng: number } | null;
  city: string;
  temp: number;
  condition: WeatherCondition;
  updatedAt?: number | null;
  usedForHomeOutfit?: boolean;
  note?: string;
}): void {
  if (!isWeatherDebugEnabled()) return;

  const coords =
    params.coords != null ? `${params.coords.lat.toFixed(5)},${params.coords.lng.toFixed(5)}` : 'none';
  const updatedAt =
    params.updatedAt != null ? new Date(params.updatedAt).toISOString() : 'none';

  console.log(
    [
      '[Stylove Weather DEBUG]',
      `source=${params.source}`,
      `weatherReady=${params.weatherReady}`,
      `coords=${coords}`,
      `city=${params.city}`,
      `temp=${params.temp}`,
      `condition=${params.condition}`,
      `updatedAt=${updatedAt}`,
      `usedForHomeOutfit=${params.usedForHomeOutfit ?? false}`,
      params.note ? `note=${params.note}` : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
  );
}
