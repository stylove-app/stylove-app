import type { TranslationKeys, TravelVibeId } from '@/i18n/types';
import type { CuratedLook, OutfitPiece, WardrobeItem } from '@/lib/outfit-engine';
import { generateLook } from '@/lib/outfit-engine';
import { normalizeWeather, type DailyWeatherSummary, type WeatherCondition, type WeatherSnapshot } from '@/lib/weather';
import { getStylingWardrobe } from '@/lib/wardrobe-utils';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import { enginePhraseForOccasion } from '@/lib/selected-occasion';
import { outfitItemSignature } from '@/lib/styling-bible';
import {
  corePieceIdsFromOutfit,
  isWearableOutfit,
} from '@/lib/outfit-assembly-rules';
import { shoeCategory } from '@/lib/layer-piece-rules';
import {
  buildOutfitDecisionReport,
  isOutfitDecisionDebugEnabled,
  logOutfitDecisionReport,
} from '@/lib/outfit-decision-debug';
import { stylingComboSignature } from '@/lib/outfit-diversity';
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
};

const TRAVEL_OCCASION: SelectedOccasionId = 'travel';
const MAX_DAY_ATTEMPTS_PER_PHASE = 12;

type TravelSessionState = {
  recentSets: string[][];
  recentCoreSets: string[][];
  seenSignatures: Set<string>;
  recentIds: string[];
  usedShoeIds: string[];
  usedShoeCategories: string[];
};

type TravelLookAttemptOptions = {
  seed: number;
  regenerate: boolean;
  useSession: boolean;
  previousItemIds?: string[];
  previousComboSignature?: string;
};

function generateTravelDayLook(
  t: TranslationKeys,
  params: {
    wardrobe: WardrobeItem[];
    weather: WeatherSnapshot;
    styleMemory?: StyleMemory;
    travelIntent: string;
    session: TravelSessionState;
    options: TravelLookAttemptOptions;
  },
): CuratedLook {
  const { wardrobe, weather, styleMemory, travelIntent, session, options } = params;
  return generateLook(t, {
    intent: travelIntent,
    wardrobe,
    weather,
    seed: options.seed,
    styleMemory,
    selectedOccasion: TRAVEL_OCCASION,
    displayOccasion: t.home.occasions.travel.title,
    recentOutfitSets: options.useSession ? session.recentSets : [],
    recentCoreSets: options.useSession ? session.recentCoreSets : [],
    recentItemIds: options.useSession ? session.recentIds : [],
    seenSignatures: options.useSession ? session.seenSignatures : new Set<string>(),
    regenerate: options.regenerate,
    previousItemIds: options.previousItemIds,
    previousComboSignature: options.previousComboSignature,
    travelPreviousShoeIds: options.useSession ? session.usedShoeIds : [],
    travelPreviousShoeCategories: options.useSession ? session.usedShoeCategories : [],
    diversitySource: 'engine',
  });
}

function pickValidatedTravelDayLook(
  t: TranslationKeys,
  params: {
    day: number;
    baseSeed: number;
    wardrobe: WardrobeItem[];
    weather: WeatherSnapshot;
    styleMemory?: StyleMemory;
    travelIntent: string;
    session: TravelSessionState;
    dayIndex: number;
    previousItemIds?: string[];
    previousComboSignature?: string;
  },
): { pieces: OutfitPiece[]; look: CuratedLook } | null {
  const phases: TravelLookAttemptOptions[] = [
    {
      seed: params.baseSeed,
      regenerate: params.dayIndex > 0,
      useSession: true,
      previousItemIds: params.previousItemIds,
      previousComboSignature: params.previousComboSignature,
    },
    {
      seed: params.baseSeed + 401,
      regenerate: false,
      useSession: true,
      previousItemIds: params.previousItemIds,
      previousComboSignature: params.previousComboSignature,
    },
    {
      seed: params.baseSeed + 907,
      regenerate: false,
      useSession: false,
    },
  ];

  for (const [phaseIndex, phase] of phases.entries()) {
    for (let attempt = 0; attempt < MAX_DAY_ATTEMPTS_PER_PHASE; attempt += 1) {
      const look = generateTravelDayLook(t, {
        wardrobe: params.wardrobe,
        weather: params.weather,
        styleMemory: params.styleMemory,
        travelIntent: params.travelIntent,
        session: params.session,
        options: {
          ...phase,
          seed: phase.seed + attempt * 37,
        },
      });

      const pieces = look.completeOutfit ?? [];
      if (!isWearableOutfit(pieces, TRAVEL_OCCASION, params.weather)) {
        continue;
      }

      if (isOutfitDecisionDebugEnabled()) {
        logOutfitDecisionReport(
          buildOutfitDecisionReport({
            path: 'travel_local',
            pieces,
            occasion: TRAVEL_OCCASION,
            weather: params.weather,
            recentOutfitSets: params.session.recentSets,
            recentCoreSets: params.session.recentCoreSets,
            seenSignatures: params.session.seenSignatures,
            extraNotes: [
              `travel day=${params.day} phase=${phaseIndex} attempt=${attempt} temp=${params.weather.temperature}°C`,
            ],
          }),
        );
      }

      return { pieces, look };
    }
  }

  return null;
}

function recordTravelSessionOutfit(session: TravelSessionState, pieces: OutfitPiece[]): void {
  const itemIds = pieces.map((piece) => piece.item.id);
  if (itemIds.length === 0) return;
  session.recentSets.push(itemIds);
  session.recentCoreSets.push(corePieceIdsFromOutfit(pieces));
  session.recentIds.push(...itemIds);
  session.seenSignatures.add(outfitItemSignature(itemIds));

  const shoePiece = pieces.find((piece) => piece.role === 'shoes');
  if (shoePiece) {
    session.usedShoeIds.push(shoePiece.item.id);
    session.usedShoeCategories.push(shoeCategory(shoePiece.item));
  }
}

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

  const session: TravelSessionState = {
    recentSets: [],
    recentCoreSets: [],
    seenSignatures: new Set<string>(),
    recentIds: [],
    usedShoeIds: [],
    usedShoeCategories: [],
  };
  let previousItemIds: string[] | undefined;
  let previousComboSignature: string | undefined;

  const dailyLooks: TravelDayPlan[] = [];
  for (let index = 0; index < duration; index += 1) {
    const day = index + 1;
    const dayWeather = weatherDays[index % weatherDays.length];
    const useDaytime = index % 2 === 0;
    const dayWeatherSnapshotValue = dayWeatherSnapshot(destination, dayWeather, useDaytime);

    const validated = pickValidatedTravelDayLook(t, {
      day,
      baseSeed: seed + day * 17,
      wardrobe: stylingWardrobe,
      weather: dayWeatherSnapshotValue,
      styleMemory,
      travelIntent,
      session,
      dayIndex: index,
      previousItemIds,
      previousComboSignature,
    });

    if (!validated) {
      continue;
    }

    const { pieces: outfitPieces, look } = validated;
    const outfitItems = outfitPieces.map((piece) => piece.item);
    recordTravelSessionOutfit(session, outfitPieces);
    previousItemIds = outfitItems.map((item) => item.id);
    previousComboSignature = stylingComboSignature(outfitPieces);

    dailyLooks.push({
      day: dailyLooks.length + 1,
      items: outfitItems,
      lookImage: outfitItems[0]?.imageUri ?? look.image,
    });
  }

  const packedItems = uniqueWardrobeItems(dailyLooks.flatMap((day) => day.items));

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
  };
}
