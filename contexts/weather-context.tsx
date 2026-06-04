import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { fetchWeather, getTimeOfDay, normalizeWeather, type WeatherSnapshot } from '@/lib/weather';
import { readHomeWeatherCache, writeHomeWeatherCache } from '@/lib/home-weather-cache';
import { logWeatherDebug, type WeatherDataSource } from '@/lib/weather-debug';
import { useTranslation } from '@/contexts/locale-context';

type WeatherContextValue = {
  weather: WeatherSnapshot;
  weatherLine: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  loading: boolean;
  /** True only for GPS or recent device cache — safe for outfit engine. */
  weatherReady: boolean;
  weatherSource: WeatherDataSource;
  coords: { lat: number; lng: number } | null;
  updatedAt: number | null;
  refresh: () => Promise<WeatherSnapshot | null>;
  getWeatherForOutfit: () => Promise<WeatherSnapshot | null>;
};

function placeholderWeather(): WeatherSnapshot {
  return normalizeWeather({
    city: '',
    temperature: 22,
    condition: 'partlyCloudy',
    hour: new Date().getHours(),
    isDay: true,
    precipitation: 0,
    wind: 0,
  });
}

const WeatherContext = createContext<WeatherContextValue | null>(null);

function isOutfitSafeSource(source: WeatherDataSource): boolean {
  return source === 'gps' || source === 'cache';
}

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslation();
  const areaLabel = t.weather.fallbackLocation;
  const [weather, setWeather] = useState<WeatherSnapshot>(() => placeholderWeather());
  const [loading, setLoading] = useState(true);
  const [weatherReady, setWeatherReady] = useState(false);
  const [weatherSource, setWeatherSource] = useState<WeatherDataSource>('initial');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const weatherRef = useRef(weather);
  const weatherReadyRef = useRef(weatherReady);
  const weatherSourceRef = useRef(weatherSource);
  const coordsRef = useRef(coords);
  const updatedAtRef = useRef(updatedAt);

  useEffect(() => {
    weatherRef.current = weather;
    weatherReadyRef.current = weatherReady;
    weatherSourceRef.current = weatherSource;
    coordsRef.current = coords;
    updatedAtRef.current = updatedAt;
  }, [weather, weatherReady, weatherSource, coords, updatedAt]);

  const applyWeather = useCallback(
    (
      snapshot: WeatherSnapshot,
      meta: {
        source: WeatherDataSource;
        latitude?: number;
        longitude?: number;
        savedAt?: number;
        note?: string;
      },
    ) => {
      const ready = isOutfitSafeSource(meta.source);
      setWeather(snapshot);
      setWeatherSource(meta.source);
      setCoords(
        meta.latitude != null && meta.longitude != null
          ? { lat: meta.latitude, lng: meta.longitude }
          : null,
      );
      const at = meta.savedAt ?? Date.now();
      setUpdatedAt(at);
      setWeatherReady(ready);
      if (meta.source === 'gps') {
        setLocationPermissionDenied(false);
      }
      logWeatherDebug({
        source: meta.source,
        weatherReady: ready,
        coords:
          meta.latitude != null && meta.longitude != null
            ? { lat: meta.latitude, lng: meta.longitude }
            : null,
        city: snapshot.city,
        temp: snapshot.temperature,
        condition: snapshot.condition,
        updatedAt: at,
        note: meta.note,
      });
    },
    [],
  );

  const markPermissionDenied = useCallback((note: string) => {
    setWeather(placeholderWeather());
    setWeatherSource('permission_denied');
    setCoords(null);
    setUpdatedAt(null);
    setWeatherReady(false);
    setLocationPermissionDenied(true);
    logWeatherDebug({
      source: 'permission_denied',
      weatherReady: false,
      coords: null,
      city: '',
      temp: 0,
      condition: 'partlyCloudy',
      updatedAt: null,
      note,
    });
  }, []);

  const fetchAtCoords = useCallback(
    async (
      latitude: number,
      longitude: number,
      cityLabel: string,
      source: 'gps' | 'cache',
      savedAt?: number,
    ) => {
      const snapshot = await fetchWeather(latitude, longitude);
      const next: WeatherSnapshot = { ...snapshot, city: cityLabel };
      if (source === 'gps') {
        await writeHomeWeatherCache({
          snapshot: next,
          latitude,
          longitude,
          savedAt: Date.now(),
        });
      }
      applyWeather(next, {
        source,
        latitude,
        longitude,
        savedAt: savedAt ?? Date.now(),
        note: source === 'cache' ? 'restored_from_device_cache' : undefined,
      });
      return next;
    },
    [applyWeather],
  );

  const load = useCallback(async (): Promise<WeatherSnapshot | null> => {
    setLoading(true);
    let hadCache = false;
    try {
      const cached = await readHomeWeatherCache();
      if (cached) {
        hadCache = true;
        await fetchAtCoords(
          cached.latitude,
          cached.longitude,
          cached.snapshot.city,
          'cache',
          cached.savedAt,
        );
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermissionDenied(true);
        if (!hadCache) {
          markPermissionDenied('permission_denied_no_cache');
        } else {
          logWeatherDebug({
            source: 'cache',
            weatherReady: true,
            coords: coordsRef.current,
            city: weatherRef.current.city,
            temp: weatherRef.current.temperature,
            condition: weatherRef.current.condition,
            updatedAt: updatedAtRef.current,
            note: 'permission_denied_using_cached_weather',
          });
        }
        return weatherReadyRef.current ? weatherRef.current : null;
      }

      setLocationPermissionDenied(false);

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = position.coords;

      let city = areaLabel;
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (place?.city) city = place.city;
        else if (place?.subregion) city = place.subregion;
        else if (place?.region) city = place.region;
      } catch {
        // keep area label when reverse geocode fails
      }

      return await fetchAtCoords(latitude, longitude, city, 'gps');
    } catch (error) {
      if (weatherReadyRef.current) {
        return weatherRef.current;
      }

      const cached = await readHomeWeatherCache();
      if (cached) {
        setLocationPermissionDenied(true);
        return fetchAtCoords(
          cached.latitude,
          cached.longitude,
          cached.snapshot.city,
          'cache',
          cached.savedAt,
        );
      }

      markPermissionDenied(`gps_unavailable:${error instanceof Error ? error.message : 'unknown'}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [areaLabel, fetchAtCoords, applyWeather, markPermissionDenied]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => load(), [load]);

  const getWeatherForOutfit = useCallback(async (): Promise<WeatherSnapshot | null> => {
    if (!weatherReadyRef.current) {
      await load();
    }
    if (!weatherReadyRef.current) {
      logWeatherDebug({
        source: weatherSourceRef.current,
        weatherReady: false,
        coords: coordsRef.current,
        city: weatherRef.current.city,
        temp: weatherRef.current.temperature,
        condition: weatherRef.current.condition,
        updatedAt: updatedAtRef.current,
        usedForHomeOutfit: false,
        note: 'weather_not_ready_no_fake_fallback',
      });
      return null;
    }
    logHomeOutfitWeatherUsage(weatherRef.current, {
      weatherSource: weatherSourceRef.current,
      coords: coordsRef.current,
      updatedAt: updatedAtRef.current,
      weatherReady: true,
    });
    return weatherRef.current;
  }, [load]);

  const timeOfDay = getTimeOfDay(weather.hour);

  const weatherLine = useMemo(() => {
    if (!weatherReady) {
      return t.weather.locationPermissionNeeded;
    }
    const timeLabel = t.weather.timeOfDay[timeOfDay];
    const conditionLabel = t.weather.conditions[weather.condition];
    const line = t.weather.line
      .replace('{time}', timeLabel)
      .replace('{city}', weather.city)
      .replace('{temp}', String(weather.temperature))
      .replace('{condition}', conditionLabel);
    if (weatherSource === 'cache' && locationPermissionDenied) {
      return `${line}${t.weather.cachedSuffix}`;
    }
    return line;
  }, [t, weather, timeOfDay, weatherReady, weatherSource, locationPermissionDenied]);

  const value = useMemo(
    () => ({
      weather,
      weatherLine,
      timeOfDay,
      loading,
      weatherReady,
      weatherSource,
      coords,
      updatedAt,
      refresh,
      getWeatherForOutfit,
    }),
    [
      weather,
      weatherLine,
      timeOfDay,
      loading,
      weatherReady,
      weatherSource,
      coords,
      updatedAt,
      refresh,
      getWeatherForOutfit,
    ],
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within WeatherProvider');
  return ctx;
}

export function logHomeOutfitWeatherUsage(
  weather: WeatherSnapshot,
  meta: Pick<WeatherContextValue, 'weatherSource' | 'coords' | 'updatedAt' | 'weatherReady'>,
): void {
  logWeatherDebug({
    source: meta.weatherSource,
    weatherReady: meta.weatherReady,
    coords: meta.coords,
    city: weather.city,
    temp: weather.temperature,
    condition: weather.condition,
    updatedAt: meta.updatedAt,
    usedForHomeOutfit: true,
    note: meta.weatherReady ? 'outfit_weather_applied' : 'outfit_weather_skipped',
  });
}
