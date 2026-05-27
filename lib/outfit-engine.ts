import { parseIntent } from '@/lib/intent-parser';
import { inferEventContext, getVenueMoodBias } from '@/lib/event-intelligence';
import { computeLuxuryScores, type LuxuryScores } from '@/lib/luxury-scores';
import {
  buildEditorialReasoning,
  suggestMissingPieces,
  type EditorialReasoning,
  type MissingPiece,
} from '@/lib/editorial-reasoning';
import type { EventContext } from '@/lib/event-intelligence';
import type { StyleMemory } from '@/lib/style-memory';
import type { MoodId, OutfitVariant, WardrobeCategoryId, WardrobeItemTypeId } from '@/i18n/types';
import type { TranslationKeys } from '@/i18n/types';
import type { WeatherSnapshot } from '@/lib/weather';
import { weatherMoodBoost } from '@/lib/weather';
import { getStylingWardrobe } from '@/lib/wardrobe-utils';

export type WardrobeProcessingStatus = 'pending' | 'processing' | 'done' | 'failed';

export type WardrobeItem = {
  id: string;
  name: string;
  /** Detailed clothing type shown on wardrobe cards. */
  itemType: WardrobeItemTypeId;
  /** Mapped engine category for outfit / travel generation. */
  category: WardrobeCategoryId;
  /** Display URI — prefers cleaned_image_uri when processing is done. */
  imageUri: string;
  /** Original upload in wardrobe-originals (backup). */
  originalImageUri: string;
  /** Background-removed cutout in wardrobe-cleaned. */
  cleanedImageUri?: string;
  processingStatus: WardrobeProcessingStatus;
  processingError?: string;
  createdAt: number;
};

export type CuratedLook = {
  id: string;
  title: string;
  occasion: string;
  description: string;
  eleganceScore: number;
  luxuryScores: LuxuryScores;
  vibes: string[];
  image: string;
  mood: MoodId;
  itemIds: string[];
  createdAt: number;
  saved?: boolean;
  weatherNote?: string;
  weatherStyling?: string;
  whyThisWorks?: string;
  editorialReasoning?: EditorialReasoning;
  missingPieces?: MissingPiece[];
  eventContext?: EventContext;
  intent?: string;
  wardrobeHint?: string;
  usesWardrobeImage?: boolean;
};

export type { LuxuryScores, EditorialReasoning, MissingPiece, EventContext };

const MOOD_IMAGES: Record<MoodId, string[]> = {
  elegant: [
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
    'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80',
  ],
  soft: [
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
  ],
  confident: [
    'https://images.unsplash.com/photo-1483985988350-763728e1935b?w=800&q=80',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
  ],
  oldMoney: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
  ],
  seductive: [
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
  ],
  minimal: [
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
    'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&q=80',
  ],
};

const RAIN_IMAGES = [
  'https://images.unsplash.com/photo-1483985988350-763728e1935b?w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
];

const WARM_IMAGES = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
];

const VARIANT_MOOD: Record<OutfitVariant, MoodId> = {
  default: 'elegant',
  elegant: 'elegant',
  feminine: 'soft',
  minimal: 'minimal',
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function resolveStockImage(mood: MoodId, weather: WeatherSnapshot | undefined, seed: number): string {
  if (!weather) return pick(MOOD_IMAGES[mood], seed + 2);
  const { layerHint, preferIndoor } = weatherMoodBoost(weather.condition, weather.temperature);
  if (preferIndoor || weather.condition === 'rain' || weather.condition === 'drizzle') {
    return pick(RAIN_IMAGES, seed + 2);
  }
  if (layerHint === 'warm') return pick(WARM_IMAGES, seed + 2);
  return pick(MOOD_IMAGES[mood], seed + 2);
}

function resolveLookImage(
  stylingWardrobe: WardrobeItem[],
  mood: MoodId,
  weather: WeatherSnapshot | undefined,
  seed: number,
): { image: string; usesWardrobeImage: boolean } {
  if (stylingWardrobe.length > 0) {
    return {
      image: pick(stylingWardrobe, seed).imageUri,
      usesWardrobeImage: true,
    };
  }
  return {
    image: resolveStockImage(mood, weather, seed),
    usesWardrobeImage: false,
  };
}

export function generateLook(
  t: TranslationKeys,
  params: {
    intent: string;
    wardrobe: WardrobeItem[];
    weather?: WeatherSnapshot;
    variant?: OutfitVariant;
    seed?: number;
    styleMemory?: StyleMemory;
    moodOverride?: MoodId;
  },
): CuratedLook {
  const { intent, wardrobe, weather, variant = 'default', styleMemory, moodOverride } = params;
  const parsed = parseIntent(intent);
  const eventContext = inferEventContext(intent, t, weather, parsed.occasion);
  const venueBias = getVenueMoodBias(intent);

  let mood = moodOverride ?? parsed.mood;
  if (venueBias && !moodOverride) mood = venueBias;
  if (styleMemory && !moodOverride) {
    const topMood = (Object.entries(styleMemory.moodFrequency) as [MoodId, number][])
      .sort((a, b) => b[1] - a[1])[0];
    if (topMood && topMood[1] >= 3 && !venueBias) mood = topMood[0];
  }

  const effectiveMood = variant === 'default' ? mood : VARIANT_MOOD[variant];
  const { label } = parsed;
  const seed =
    params.seed ??
    hashSeed(`${intent}-${effectiveMood}-${variant}-${weather?.temperature ?? 0}-${Date.now()}`);

  const titles = t.outfit.titles[effectiveMood];
  const descriptions = t.outfit.descriptions[effectiveMood];
  const vibes = [...t.outfit.vibes[effectiveMood]];

  if (weather) {
    const { layerHint } = weatherMoodBoost(weather.condition, weather.temperature);
    if (layerHint === 'warm') vibes.push(t.outfit.weatherVibes.layered);
    if (weather.condition === 'rain' || weather.condition === 'drizzle') {
      vibes.push(t.outfit.weatherVibes.weatherReady);
    }
    if (weather.isDay && weather.hour < 17) vibes.push(t.outfit.weatherVibes.daylight);
  }

  const stylingWardrobe = getStylingWardrobe(wardrobe);
  const wardrobeHint =
    stylingWardrobe.length === 1 ? t.home.wardrobeHintSingle : undefined;
  const itemIds = stylingWardrobe.slice(0, 4).map((item) => item.id);
  let { image, usesWardrobeImage } = resolveLookImage(
    stylingWardrobe,
    effectiveMood,
    weather,
    seed,
  );
  if (stylingWardrobe.length > 0) {
    image = pick(stylingWardrobe, seed).imageUri;
    usesWardrobeImage = true;
  }
  const luxuryScores = computeLuxuryScores(effectiveMood, seed, weather, eventContext);
  const eleganceScore = luxuryScores.elegance;
  const editorialReasoning = buildEditorialReasoning(t, effectiveMood, seed, weather, eventContext);
  const missingPieces = suggestMissingPieces(t, effectiveMood, seed);
  const whyThisWorks = [
    editorialReasoning.colorHarmony,
    editorialReasoning.silhouetteBalance,
  ].join(' ');

  let description = pick(descriptions, seed + 1);
  if (eventContext.venue) {
    description = t.outfit.descriptionVenue
      .replace('{description}', description)
      .replace('{venue}', eventContext.venue)
      .replace('{vibe}', eventContext.vibe);
  } else if (weather) {
    const { layerHint, preferIndoor } = weatherMoodBoost(weather.condition, weather.temperature);
    if (preferIndoor) {
      description = t.outfit.descriptionIndoor
        .replace('{description}', description)
        .replace('{city}', weather.city);
    } else if (layerHint === 'warm') {
      description = t.outfit.descriptionWarm
        .replace('{description}', description)
        .replace('{temp}', String(weather.temperature));
    } else {
      description = t.outfit.descriptionLight
        .replace('{description}', description)
        .replace('{temp}', String(weather.temperature))
        .replace('{city}', weather.city);
    }
  }

  let weatherStyling: string | undefined;
  if (weather) {
    const { layerHint, preferIndoor } = weatherMoodBoost(weather.condition, weather.temperature);
    const condition = t.weather.conditions[weather.condition];
    if (preferIndoor) {
      weatherStyling = t.outfit.weatherStylingIndoor
        .replace('{city}', weather.city)
        .replace('{temp}', String(weather.temperature))
        .replace('{condition}', condition);
    } else if (layerHint === 'warm') {
      weatherStyling = t.outfit.weatherStylingWarm
        .replace('{temp}', String(weather.temperature))
        .replace('{condition}', condition);
    } else {
      weatherStyling = t.outfit.weatherStylingLight
        .replace('{city}', weather.city)
        .replace('{temp}', String(weather.temperature))
        .replace('{condition}', condition);
    }
  }

  return {
    id: `look-${seed}-${Date.now()}`,
    title: pick(titles, seed),
    occasion: label,
    description,
    eleganceScore,
    luxuryScores,
    vibes: vibes.slice(0, 4),
    image,
    mood: effectiveMood,
    itemIds,
    wardrobeHint,
    usesWardrobeImage,
    createdAt: Date.now(),
    weatherNote: weather ? t.outfit.weatherNote : undefined,
    weatherStyling,
    whyThisWorks,
    editorialReasoning,
    missingPieces,
    eventContext,
    intent,
  };
}

export function getTonightsSelection(
  t: TranslationKeys,
  wardrobe: WardrobeItem[],
  weather?: WeatherSnapshot,
): CuratedLook {
  return generateLook(t, {
    intent: t.home.subGreeting,
    wardrobe,
    weather,
    seed: 42,
  });
}

export { WARDROBE_ENGINE_CATEGORIES as WARDROBE_CATEGORIES } from '@/lib/wardrobe-item-types';
export type { WardrobeItemTypeId };

export const MOODS: MoodId[] = [
  'elegant',
  'soft',
  'confident',
  'oldMoney',
  'seductive',
  'minimal',
];
