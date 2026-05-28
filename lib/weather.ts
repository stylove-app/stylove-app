export type WeatherCondition =
  | 'clear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'rain'
  | 'drizzle'
  | 'snow'
  | 'fog'
  | 'thunderstorm';

export type WeatherSnapshot = {
  city: string;
  temperature: number;
  feelsLike?: number;
  precipitation?: number;
  wind?: number;
  condition: WeatherCondition;
  summary: WeatherCondition;
  isDay: boolean;
  hour: number;
  isCold: boolean;
  isRainy: boolean;
  needsOuterwear: boolean;
};

export type DailyWeatherSummary = {
  date: string;
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  temperature: number;
  lowTemperature: number;
  feelsLike?: number;
  precipitation: number;
  wind: number;
  condition: WeatherCondition;
  summary: WeatherCondition;
  isCold: boolean;
  isRainy: boolean;
  needsOuterwear: boolean;
  source?: string;
};

type OpenMeteoGeocodeResult = {
  results?: {
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
  }[];
};

export function mapWeatherCode(code: number): WeatherCondition {
  if (code === 0) return 'clear';
  if (code <= 3) return 'partlyCloudy';
  if (code <= 48) return 'fog';
  if (code <= 57) return 'drizzle';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'rain';
  if (code <= 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'cloudy';
}

export function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export function normalizeWeather(params: {
  city: string;
  temperature: number;
  condition: WeatherCondition;
  hour?: number;
  isDay?: boolean;
  feelsLike?: number;
  precipitation?: number;
  wind?: number;
}): WeatherSnapshot {
  const precipitation = params.precipitation ?? 0;
  const isRainy =
    precipitation > 0.5 ||
    params.condition === 'rain' ||
    params.condition === 'drizzle' ||
    params.condition === 'thunderstorm' ||
    params.condition === 'snow';
  const hour = params.hour ?? new Date().getHours();
  const apparentTemperature = params.feelsLike ?? params.temperature;
  const isCold = params.temperature <= 16 || apparentTemperature <= 14;
  const isEvening = hour >= 17 || hour < 6;

  return {
    city: params.city,
    temperature: Math.round(params.temperature),
    feelsLike: params.feelsLike === undefined ? undefined : Math.round(params.feelsLike),
    precipitation,
    wind: params.wind,
    condition: params.condition,
    summary: params.condition,
    isDay: params.isDay ?? (hour >= 7 && hour < 19),
    hour,
    isCold,
    isRainy,
    needsOuterwear: isCold || isRainy || isEvening,
  };
}

export async function fetchWeather(lat: number, lon: number): Promise<Omit<WeatherSnapshot, 'city'>> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,apparent_temperature,precipitation,weather_code,is_day,wind_speed_10m&timezone=auto';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather request failed');
  const data = await res.json();
  const current = data.current;
  const normalized = normalizeWeather({
    city: '',
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    precipitation: current.precipitation,
    wind: current.wind_speed_10m,
    condition: mapWeatherCode(current.weather_code),
    isDay: current.is_day === 1,
  });
  const { city: _city, ...snapshot } = normalized;
  return snapshot;
}

export async function geocodeCity(city: string): Promise<{
  city: string;
  latitude: number;
  longitude: number;
} | null> {
  const query = city.trim();
  if (!query) return null;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed');
  const data = (await res.json()) as OpenMeteoGeocodeResult;
  const place = data.results?.[0];
  if (!place) return null;
  return {
    city: place.country ? `${place.name}, ${place.country}` : place.name,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function clampToForecastWindow(date: Date): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(today.getDate() + 15);
  if (date < today) return today;
  if (date > max) return max;
  return date;
}

export function isDateBeyondForecastWindow(raw: string | undefined): boolean {
  const date = parseForecastDate(raw);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(today.getDate() + 15);
  return date > max;
}

export function parseForecastDate(raw: string | undefined, fallbackOffsetDays = 0): Date {
  if (!raw?.trim()) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + fallbackOffsetDays);
    return fallback;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const numeric = raw.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);
  if (numeric) {
    const day = Number.parseInt(numeric[1], 10);
    const month = Number.parseInt(numeric[2], 10) - 1;
    const year = numeric[3] ? Number.parseInt(numeric[3].padStart(4, '20'), 10) : new Date().getFullYear();
    return new Date(year, month, day);
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + fallbackOffsetDays);
  return fallback;
}

export function clampForecastDays(days: number): number {
  if (!Number.isFinite(days)) return 1;
  return Math.max(1, Math.min(16, Math.floor(days)));
}

export async function fetchCityForecast(params: {
  city: string;
  startDate?: string;
  days?: number;
}): Promise<DailyWeatherSummary[]> {
  const place = await geocodeCity(params.city);
  if (!place) return [];

  const days = clampForecastDays(params.days ?? 1);
  const start = clampToForecastWindow(parseForecastDate(params.startDate));
  const end = new Date(start);
  end.setDate(start.getDate() + days - 1);
  const clampedEnd = clampToForecastWindow(end);

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,wind_speed_10m_max' +
    `&start_date=${toIsoDate(start)}&end_date=${toIsoDate(clampedEnd)}&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast request failed');
  const data = await res.json();
  const daily = data.daily;
  if (!daily?.time) return [];

  return daily.time.map((date: string, index: number) => {
    const temperature = Math.round(daily.temperature_2m_max[index]);
    const lowTemperature = Math.round(daily.temperature_2m_min[index]);
    const feelsLike =
      daily.apparent_temperature_max?.[index] === undefined
        ? undefined
        : Math.round(daily.apparent_temperature_max[index]);
    const precipitation = Number(daily.precipitation_sum?.[index] ?? 0);
    const wind = Number(daily.wind_speed_10m_max?.[index] ?? 0);
    const condition = mapWeatherCode(daily.weather_code[index]);
    const normalized = normalizeWeather({
      city: place.city,
      temperature,
      feelsLike,
      precipitation,
      wind,
      condition,
      hour: 14,
      isDay: true,
    });

    return {
      date,
      city: place.city,
      latitude: place.latitude,
      longitude: place.longitude,
      temperature: normalized.temperature,
      lowTemperature,
      feelsLike: normalized.feelsLike,
      precipitation,
      wind,
      condition,
      summary: condition,
      isCold: normalized.isCold,
      isRainy: normalized.isRainy,
      needsOuterwear: normalized.needsOuterwear,
      source: 'open-meteo',
    };
  });
}

export function weatherMoodBoost(condition: WeatherCondition, temp: number): {
  layerHint: 'light' | 'mid' | 'warm';
  preferIndoor: boolean;
} {
  const preferIndoor = condition === 'rain' || condition === 'drizzle' || condition === 'thunderstorm';
  if (temp <= 8) return { layerHint: 'warm', preferIndoor: preferIndoor || temp <= 5 };
  if (temp <= 16) return { layerHint: 'mid', preferIndoor };
  return { layerHint: 'light', preferIndoor };
}
