import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type WeatherCondition =
  | 'clear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'rain'
  | 'drizzle'
  | 'snow'
  | 'fog'
  | 'thunderstorm';

type DailyWeatherSummary = {
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
  source: 'open-meteo';
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FORECAST_TTL_HOURS = 12;
const MAX_FORECAST_DAYS = 16;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function mapWeatherCode(code: number): WeatherCondition {
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

function normalizeWeather(params: {
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
}): DailyWeatherSummary {
  const apparent = params.feelsLike ?? params.temperature;
  const isRainy =
    params.precipitation > 0.5 ||
    params.condition === 'rain' ||
    params.condition === 'drizzle' ||
    params.condition === 'thunderstorm' ||
    params.condition === 'snow';
  const isCold = params.temperature <= 16 || apparent <= 14 || params.lowTemperature <= 12;

  return {
    date: params.date,
    city: params.city,
    country: params.country,
    latitude: params.latitude,
    longitude: params.longitude,
    temperature: Math.round(params.temperature),
    lowTemperature: Math.round(params.lowTemperature),
    feelsLike: params.feelsLike === undefined ? undefined : Math.round(params.feelsLike),
    precipitation: params.precipitation,
    wind: params.wind,
    condition: params.condition,
    summary: params.condition,
    isCold,
    isRainy,
    needsOuterwear: isCold || isRainy,
    source: 'open-meteo',
  };
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDate(raw: unknown): Date {
  if (typeof raw !== 'string' || raw.trim().length === 0) return new Date();
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date();
}

function clampForecastWindow(date: Date): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(today.getDate() + MAX_FORECAST_DAYS - 1);
  if (date < today) return today;
  if (date > max) return max;
  return date;
}

function isBeyondForecastWindow(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(today.getDate() + MAX_FORECAST_DAYS - 1);
  return date > max;
}

function addHours(date: Date, hours: number): string {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const geocodingBaseUrl = Deno.env.get('OPEN_METEO_GEOCODING_URL') ?? 'https://geocoding-api.open-meteo.com/v1/search';
  const forecastBaseUrl = Deno.env.get('OPEN_METEO_FORECAST_URL') ?? 'https://api.open-meteo.com/v1/forecast';

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Server configuration incomplete' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const requestedCity = typeof body.city === 'string' ? body.city.trim() : '';
  if (!requestedCity) return jsonResponse({ error: 'City is required' }, 400);

  const requestedStart = parseDate(body.startDate);
  const forecastUnavailable = isBeyondForecastWindow(requestedStart);
  const start = clampForecastWindow(requestedStart);
  const requestedDays = Number.isFinite(Number(body.days)) ? Number(body.days) : 1;
  const days = Math.max(1, Math.min(MAX_FORECAST_DAYS, Math.floor(requestedDays)));
  const end = clampForecastWindow(new Date(start.getTime() + (days - 1) * 86400000));

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const requestedDates: string[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    requestedDates.push(toIsoDate(cursor));
  }

  const cacheCity = requestedCity.toLowerCase();
  const { data: cachedRows } = await admin
    .from('travel_weather_cache')
    .select('forecast_date, normalized_weather_json, expires_at')
    .eq('city', cacheCity)
    .in('forecast_date', requestedDates)
    .gt('expires_at', new Date().toISOString());

  const cachedByDate = new Map<string, DailyWeatherSummary>();
  (cachedRows ?? []).forEach((row) => {
    cachedByDate.set(row.forecast_date as string, row.normalized_weather_json as DailyWeatherSummary);
  });

  if (cachedByDate.size === requestedDates.length) {
    return jsonResponse({
      forecast: requestedDates.map((date) => cachedByDate.get(date)),
      source: 'open-meteo',
      cache: 'hit',
      forecastUnavailable,
    });
  }

  const geoUrl = `${geocodingBaseUrl}?name=${encodeURIComponent(requestedCity)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) return jsonResponse({ forecast: [], source: 'open-meteo', cache: 'miss', forecastUnavailable }, 200);
  const geo = await geoRes.json();
  const place = geo.results?.[0];
  if (!place) return jsonResponse({ forecast: [], source: 'open-meteo', cache: 'miss', forecastUnavailable }, 200);

  const cityLabel = place.name as string;
  const country = place.country as string | undefined;
  const canonicalCity = cityLabel.toLowerCase();
  const forecastUrl =
    `${forecastBaseUrl}?latitude=${place.latitude}&longitude=${place.longitude}` +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,wind_speed_10m_max' +
    `&start_date=${toIsoDate(start)}&end_date=${toIsoDate(end)}&timezone=auto`;
  const forecastRes = await fetch(forecastUrl);
  if (!forecastRes.ok) return jsonResponse({ forecast: [], source: 'open-meteo', cache: 'miss', forecastUnavailable }, 200);

  const forecastData = await forecastRes.json();
  const daily = forecastData.daily;
  const normalized = (daily?.time ?? []).map((date: string, index: number) =>
    normalizeWeather({
      date,
      city: country ? `${cityLabel}, ${country}` : cityLabel,
      country,
      latitude: place.latitude,
      longitude: place.longitude,
      temperature: daily.temperature_2m_max[index],
      lowTemperature: daily.temperature_2m_min[index],
      feelsLike: daily.apparent_temperature_max?.[index],
      precipitation: Number(daily.precipitation_sum?.[index] ?? 0),
      wind: Number(daily.wind_speed_10m_max?.[index] ?? 0),
      condition: mapWeatherCode(daily.weather_code[index]),
    }),
  );

  if (normalized.length > 0) {
    const expiresAt = addHours(new Date(), FORECAST_TTL_HOURS);
    const cacheRows = normalized.flatMap((day) => [
        {
          city: cacheCity,
          country,
          latitude: place.latitude,
          longitude: place.longitude,
          forecast_date: day.date,
          normalized_weather_json: day,
          source: 'open-meteo',
          expires_at: expiresAt,
        },
        {
          city: canonicalCity,
          country,
          latitude: place.latitude,
          longitude: place.longitude,
          forecast_date: day.date,
          normalized_weather_json: day,
          source: 'open-meteo',
          expires_at: expiresAt,
        },
      ]);
    const uniqueRows = Array.from(
      new Map(cacheRows.map((row) => [`${row.city}:${row.forecast_date}`, row])).values(),
    );
    await admin.from('travel_weather_cache').upsert(
      uniqueRows,
      { onConflict: 'city,forecast_date' },
    );
  }

  return jsonResponse({
    forecast: normalized,
    source: 'open-meteo',
    cache: 'miss',
    forecastUnavailable,
  });
});
