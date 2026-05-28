import { WEATHER_CONFIG } from '@/constants/weather-config';
import {
  fetchCityForecast,
  isDateBeyondForecastWindow,
  type DailyWeatherSummary,
} from '@/lib/weather';
import { supabase } from '@/services/supabase';

export type WeatherForecastResult = {
  forecast: DailyWeatherSummary[];
  source: string;
  cache: 'hit' | 'miss' | 'fallback';
  forecastUnavailable: boolean;
};

type WeatherFunctionResponse = {
  forecast?: DailyWeatherSummary[];
  source?: string;
  cache?: 'hit' | 'miss';
  forecastUnavailable?: boolean;
};

export async function getDestinationWeatherForecast(params: {
  city: string;
  startDate?: string;
  days: number;
}): Promise<WeatherForecastResult> {
  const forecastUnavailable = isDateBeyondForecastWindow(params.startDate);

  const { data, error } = await supabase.functions.invoke<WeatherFunctionResponse>(
    WEATHER_CONFIG.forecastFunctionName,
    { body: params },
  );

  if (!error && data?.forecast?.length) {
    return {
      forecast: data.forecast,
      source: data.source ?? WEATHER_CONFIG.sourceName,
      cache: data.cache ?? 'miss',
      forecastUnavailable: data.forecastUnavailable ?? forecastUnavailable,
    };
  }

  const forecast = await fetchCityForecast(params).catch(() => []);
  return {
    forecast,
    source: WEATHER_CONFIG.sourceName,
    cache: 'fallback',
    forecastUnavailable,
  };
}
