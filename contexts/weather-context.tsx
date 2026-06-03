import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchWeather, getTimeOfDay, normalizeWeather, type WeatherSnapshot } from '@/lib/weather';
import { useLocale, useTranslation } from '@/contexts/locale-context';

function getFallbackWeather(city: string): WeatherSnapshot {
  return normalizeWeather({
    city,
    temperature: 18,
    condition: 'rain',
    isDay: false,
    hour: 20,
    precipitation: 1.2,
    wind: 12,
  });
}

type WeatherContextValue = {
  weather: WeatherSnapshot;
  weatherLine: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  loading: boolean;
  refresh: () => Promise<void>;
};

const WeatherContext = createContext<WeatherContextValue | null>(null);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const fallbackCity = t.weather.fallbackLocation;
  const [weather, setWeather] = useState<WeatherSnapshot>(() => getFallbackWeather(fallbackCity));
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setWeather(getFallbackWeather(fallbackCity));
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      const snapshot = await fetchWeather(latitude, longitude);

      let city = fallbackCity;
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place?.city) city = place.city;
      else if (place?.region) city = place.region;

      setWeather({ ...snapshot, city });
    } catch {
      setWeather(getFallbackWeather(fallbackCity));
    } finally {
      setLoading(false);
    }
  }, [fallbackCity]);

  useEffect(() => {
    load();
  }, [load]);

  const timeOfDay = getTimeOfDay(weather.hour);

  const weatherLine = useMemo(() => {
    const timeLabel = t.weather.timeOfDay[timeOfDay];
    const conditionLabel = t.weather.conditions[weather.condition];
    return t.weather.line
      .replace('{time}', timeLabel)
      .replace('{city}', weather.city)
      .replace('{temp}', String(weather.temperature))
      .replace('{condition}', conditionLabel);
  }, [t, weather, timeOfDay]);

  const value = useMemo(
    () => ({ weather, weatherLine, timeOfDay, loading, refresh: load }),
    [weather, weatherLine, timeOfDay, loading, load],
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within WeatherProvider');
  return ctx;
}
