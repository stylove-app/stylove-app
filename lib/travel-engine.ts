import type { TranslationKeys, TravelVibeId } from '@/i18n/types';
import type { WardrobeItem } from '@/lib/outfit-engine';
import { normalizeWeather, type DailyWeatherSummary, type WeatherCondition, type WeatherSnapshot } from '@/lib/weather';
import { getStylingWardrobe } from '@/lib/wardrobe-utils';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import { enginePhraseForOccasion } from '@/lib/selected-occasion';
import { planTravelDailyOutfits } from '@/lib/travel-planner';
import type { StyleMemory } from '@/lib/style-memory';

export type DestinationWeather = {
  city: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  temperature: number;
  feelsLike?: number;
  precipitation: number;
  wind: number;
  condition: WeatherCondition;
  summary: WeatherCondition;
  isDay: boolean;
  nightTemperature: number;
  nightCondition: WeatherCondition;
  isCold: boolean;
  isRainy: boolean;
  needsOuterwear: boolean;
  source?: string;
};

export type TravelDayPlan = {
  day: number;
  items: WardrobeItem[];
  lookImage: string;
};

export type LuxurySpot = {
  id: string;
  name: string;
  type: 'rooftop' | 'cafe' | 'restaurant' | 'beachClub' | 'gallery';
  image: string;
  outfitSuggested: boolean;
};

export type TravelPlan = {
  destination: string;
  duration: number;
  departureDate: string;
  vibe: TravelVibeId;
  weather: DestinationWeather;
  weatherDays: DailyWeatherSummary[];
  weatherSource: string;
  forecastUnavailable: boolean;
  baggageType: 'cabin';
  packingGuidance: string[];
  missingPieces: string[];
  packedItems: WardrobeItem[];
  accessories: WardrobeItem[];
  shoes: WardrobeItem[];
  outerwear: WardrobeItem[];
  dailyLooks: TravelDayPlan[];
  spots: LuxurySpot[];
  wardrobeHint?: string;
  generationFailed?: boolean;
  generationMessage?: string;
};

const TRAVEL_OCCASION: SelectedOccasionId = 'travel';

const DESTINATION_WEATHER: Record<
  string,
  Pick<DestinationWeather, 'temperature' | 'condition' | 'isDay' | 'nightTemperature' | 'nightCondition'>
> = {
  paris: { temperature: 17, condition: 'partlyCloudy', isDay: true, nightTemperature: 11, nightCondition: 'cloudy' },
  bodrum: { temperature: 29, condition: 'clear', isDay: true, nightTemperature: 22, nightCondition: 'clear' },
  milano: { temperature: 20, condition: 'clear', isDay: true, nightTemperature: 14, nightCondition: 'partlyCloudy' },
  london: { temperature: 14, condition: 'rain', isDay: true, nightTemperature: 9, nightCondition: 'drizzle' },
  dubai: { temperature: 34, condition: 'clear', isDay: true, nightTemperature: 26, nightCondition: 'clear' },
  istanbul: { temperature: 22, condition: 'partlyCloudy', isDay: true, nightTemperature: 16, nightCondition: 'cloudy' },
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeDestination(raw: string): string {
  return raw.trim().toLowerCase();
}

function resolveWeather(destination: string): Omit<DestinationWeather, 'city'> {
  const key = normalizeDestination(destination);
  for (const [name, profile] of Object.entries(DESTINATION_WEATHER)) {
    if (key.includes(name)) {
      const normalized = normalizeWeather({
        city: '',
        temperature: profile.temperature,
        condition: profile.condition,
        hour: 14,
        isDay: profile.isDay,
      });
      return {
        ...profile,
        feelsLike: normalized.feelsLike,
        precipitation: normalized.precipitation ?? 0,
        wind: normalized.wind ?? 0,
        summary: profile.condition,
        isCold: normalized.isCold,
        isRainy: normalized.isRainy,
        needsOuterwear: normalized.needsOuterwear,
      };
    }
  }
  const seed = hashString(key);
  const conditions: WeatherCondition[] = ['clear', 'partlyCloudy', 'cloudy', 'rain'];
  const temperature = 16 + (seed % 14);
  const condition = conditions[seed % conditions.length];
  const normalized = normalizeWeather({ city: '', temperature, condition, hour: 14, isDay: true });
  return {
    temperature: normalized.temperature,
    feelsLike: normalized.feelsLike,
    precipitation: normalized.precipitation ?? 0,
    wind: normalized.wind ?? 0,
    condition,
    summary: condition,
    isDay: true,
    nightTemperature: 10 + (seed % 10),
    nightCondition: conditions[(seed + 1) % conditions.length],
    isCold: normalized.isCold,
    isRainy: normalized.isRainy,
    needsOuterwear: normalized.needsOuterwear,
  };
}

function resolveFallbackWeather(destination: string): DestinationWeather {
  const profile = resolveWeather(destination);
  return { city: destination.trim(), ...profile };
}

function buildWeatherFromForecast(destination: string, forecast: DailyWeatherSummary[] | undefined): DestinationWeather {
  const first = forecast?.[0];
  if (!first) return resolveFallbackWeather(destination);
  return {
    city: first.city || destination.trim(),
    country: first.country,
    latitude: first.latitude,
    longitude: first.longitude,
    temperature: first.temperature,
    feelsLike: first.feelsLike,
    precipitation: first.precipitation,
    wind: first.wind,
    condition: first.condition,
    summary: first.summary,
    isDay: true,
    nightTemperature: first.lowTemperature,
    nightCondition: first.condition,
    isCold: first.isCold,
    isRainy: first.isRainy,
    needsOuterwear: first.needsOuterwear,
    source: first.source,
  };
}

function dayWeatherSnapshot(
  destination: string,
  dayWeather: DailyWeatherSummary,
  useDaytime: boolean,
): WeatherSnapshot {
  const condition = useDaytime ? dayWeather.condition : dayWeather.condition;
  const temp = useDaytime ? dayWeather.temperature : dayWeather.lowTemperature;
  return {
    city: dayWeather.city || destination,
    temperature: temp,
    feelsLike: dayWeather.feelsLike,
    precipitation: dayWeather.precipitation,
    wind: dayWeather.wind,
    condition,
    summary: condition,
    isDay: useDaytime,
    hour: useDaytime ? 14 : 21,
    isCold: dayWeather.isCold,
    isRainy: dayWeather.isRainy,
    needsOuterwear: dayWeather.needsOuterwear,
  };
}

function uniqueWardrobeItems(items: WardrobeItem[]): WardrobeItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function generateTravelPlan(
  t: TranslationKeys,
  params: {
    destination: string;
    duration: number;
    departureDate: string;
    vibe: TravelVibeId;
    wardrobe: WardrobeItem[];
    weatherForecast?: DailyWeatherSummary[];
    weatherSource?: string;
    forecastUnavailable?: boolean;
    seed?: number;
    styleMemory?: StyleMemory;
  },
): TravelPlan {
  const { destination, duration, departureDate, vibe, wardrobe, styleMemory } = params;
  const stylingWardrobe = getStylingWardrobe(wardrobe);
  const wardrobeHint =
    stylingWardrobe.length === 1 ? t.travel.wardrobeHintSingle : undefined;
  const seed = params.seed ?? hashString(`${destination}-${departureDate}`);
  const weatherDays = params.weatherForecast?.length
    ? params.weatherForecast
    : [buildWeatherFromForecast(destination, undefined)].map((day) => ({
        date: departureDate,
        city: day.city,
        temperature: day.temperature,
        lowTemperature: day.nightTemperature,
        feelsLike: day.feelsLike,
        precipitation: day.precipitation,
        wind: day.wind,
        condition: day.condition,
        summary: day.summary,
        isCold: day.isCold,
        isRainy: day.isRainy,
        needsOuterwear: day.needsOuterwear,
      }));
  const weather = buildWeatherFromForecast(destination, weatherDays);
  const travelIntent = enginePhraseForOccasion(TRAVEL_OCCASION);

  const weatherByDay: WeatherSnapshot[] = [];
  for (let index = 0; index < duration; index += 1) {
    const dayWeather = weatherDays[index % weatherDays.length];
    const useDaytime = index % 2 === 0;
    weatherByDay.push(dayWeatherSnapshot(destination, dayWeather, useDaytime));
  }

  const { selected } = planTravelDailyOutfits(t, {
    duration,
    baseSeed: seed,
    wardrobe: stylingWardrobe,
    weatherByDay,
    styleMemory,
    travelIntent,
  });

  const dailyLooks: TravelDayPlan[] = selected.map((candidate, index) => {
    const outfitItems = candidate.pieces.map((piece) => piece.item);
    return {
      day: index + 1,
      items: outfitItems,
      lookImage: outfitItems[0]?.imageUri ?? candidate.look.image,
    };
  });

  const packedItems = uniqueWardrobeItems(dailyLooks.flatMap((day) => day.items));
  const generationFailed = dailyLooks.length === 0;
  const generationMessage = generationFailed ? t.travel.insufficientWardrobeMessage : undefined;

  return {
    destination: destination.trim(),
    duration,
    departureDate,
    vibe,
    weather,
    weatherDays,
    weatherSource: params.weatherSource ?? weather.source ?? 'Open-Meteo',
    forecastUnavailable: params.forecastUnavailable ?? false,
    baggageType: 'cabin',
    packingGuidance: [],
    missingPieces: [],
    packedItems,
    accessories: [],
    shoes: [],
    outerwear: [],
    dailyLooks,
    spots: [],
    wardrobeHint,
    generationFailed,
    generationMessage,
  };
}
