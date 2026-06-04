import { parseIntent } from '@/lib/intent-parser';
import { analyzeIntent, type ResolvedIntent } from '@/lib/intent-engine';
import { inferEventContext, getVenueMoodBias } from '@/lib/event-intelligence';
import { computeLuxuryScores, type LuxuryScores } from '@/lib/luxury-scores';
import { buildEditorialReasoning, type EditorialReasoning } from '@/lib/editorial-reasoning';
import {
  buildPersonalizedOccasion,
  buildPersonalizedTitle,
} from '@/lib/personalized-look-copy';
import type { EventContext } from '@/lib/event-intelligence';
import type { StyleMemory } from '@/lib/style-memory';
import type { MoodId, OutfitVariant, WardrobeCategoryId, WardrobeItemTypeId } from '@/i18n/types';
import type { TranslationKeys } from '@/i18n/types';
import type { WeatherSnapshot } from '@/lib/weather';
import { weatherMoodBoost } from '@/lib/weather';
import { getStylingWardrobe } from '@/lib/wardrobe-utils';
import { WARDROBE_ENGINE_CATEGORIES } from '@/lib/wardrobe-item-types';
import {
  analyzeWardrobeItem,
  needsOuterwearForContext,
  OUTFIT_CANDIDATE_COUNT,
  pickBestPiece,
  preferredTypesForSlot,
  REGENERATE_OUTFIT_CANDIDATE_COUNT,
  scoreOutfitPieces,
  type ItemStylingProfile,
  type OutfitStylingContext,
} from '@/lib/outfit-styling-intelligence';
import {
  buildBibleOutfitExplanation,
  preferredTypesForOccasion,
  scoreOutfitPiecesWithBible,
} from '@/lib/styling-bible';

export type WardrobeItem = {
  id: string;
  name: string;
  /** Detailed clothing type shown on wardrobe cards. */
  itemType: WardrobeItemTypeId;
  /** Mapped engine category for outfit / travel generation. */
  category: WardrobeCategoryId;
  /** Display URI — wardrobe-originals upload. */
  imageUri: string;
  /** Same as imageUri; kept for wardrobe row mapping. */
  originalImageUri: string;
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
  eventContext?: EventContext;
  intent?: string;
  wardrobeHint?: string;
  usesWardrobeImage?: boolean;
  completeOutfit?: OutfitPiece[];
  archiveCategory?: string;
};

export type OutfitPieceRole =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'shoes'
  | 'outerwear'
  | 'bag'
  | 'accessory'
  | 'jewelry';

export type OutfitPiece = {
  id: string;
  role: OutfitPieceRole;
  label: string;
  item: WardrobeItem;
};

export type { LuxuryScores, EditorialReasoning, EventContext };

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

function partitionWardrobe(wardrobe: WardrobeItem[]): Record<WardrobeCategoryId, WardrobeItem[]> {
  return WARDROBE_ENGINE_CATEGORIES.reduce<Record<WardrobeCategoryId, WardrobeItem[]>>(
    (acc, category) => {
      acc[category] = wardrobe.filter((item) => item.category === category);
      return acc;
    },
    {
      upper: [],
      outerwear: [],
      bottom: [],
      dress: [],
      shoes: [],
      bag: [],
      accessory: [],
    },
  );
}

function stylingContextBase(
  params: {
    intent: string;
    resolvedIntent?: ResolvedIntent;
    weather?: WeatherSnapshot;
    mood: MoodId;
    seed: number;
    recentItemIds?: string[];
    styleMemory?: StyleMemory;
  },
): Omit<OutfitStylingContext, 'anchor' | 'selected' | 'preferredTypes'> {
  return {
    mood: params.mood,
    intent: params.intent,
    resolvedIntent: params.resolvedIntent,
    weather: params.weather,
    recentItemIds: new Set(params.recentItemIds ?? []),
    styleMemory: params.styleMemory,
    seed: params.seed,
  };
}

type BibleSlotRole = 'top' | 'bottom' | 'dress' | 'shoes' | 'outerwear';

function biblePreferredTypes(
  resolvedIntent: import('@/lib/intent-engine').ResolvedIntent,
  wardrobe: WardrobeItem[],
  role: BibleSlotRole,
  mood: MoodId,
  slotRole: Parameters<typeof preferredTypesForSlot>[2],
): WardrobeItemTypeId[] {
  const occasion = resolvedIntent.occasion;
  const stylingWardrobe = wardrobe.map((item) => ({
    id: item.id,
    name: item.name,
    itemType: item.itemType,
    category: item.category,
  }));
  const bibleTypes = preferredTypesForOccasion(occasion, role, stylingWardrobe);
  const moodTypes = preferredTypesForSlot(mood, resolvedIntent.rawText, slotRole);
  return [...new Set([...bibleTypes, ...moodTypes])];
}

function assembleOutfitCandidate(
  t: TranslationKeys,
  byCategory: Record<WardrobeCategoryId, WardrobeItem[]>,
  params: {
    intent: string;
    resolvedIntent: ResolvedIntent;
    wardrobe: WardrobeItem[];
    weather?: WeatherSnapshot;
    mood: MoodId;
    seed: number;
    recentItemIds?: string[];
    styleMemory?: StyleMemory;
  },
): OutfitPiece[] {
  const stylingWardrobe = params.wardrobe.map((item) => ({
    id: item.id,
    name: item.name,
    itemType: item.itemType,
    category: item.category,
  }));
  const base: Omit<OutfitStylingContext, 'anchor' | 'selected' | 'preferredTypes'> = {
    ...stylingContextBase(params),
    wardrobe: stylingWardrobe,
  };
  const selected: ItemStylingProfile[] = [];

  const top = pickBestPiece(byCategory.upper, {
    ...base,
    anchor: null,
    selected,
    preferredTypes: biblePreferredTypes(
      params.resolvedIntent,
      params.wardrobe,
      'top',
      params.mood,
      'upper-anchor',
    ),
    seed: params.seed + 1,
  });
  const anchor = top ? analyzeWardrobeItem(top) : null;
  if (anchor) selected.push(anchor);

  const bottom = pickBestPiece(byCategory.bottom, {
    ...base,
    anchor,
    selected,
    preferredTypes: biblePreferredTypes(params.resolvedIntent, params.wardrobe, 'bottom', params.mood, 'bottom'),
    seed: params.seed + 2,
  });
  if (bottom) selected.push(analyzeWardrobeItem(bottom));

  const dress =
    !top || !bottom
      ? pickBestPiece(byCategory.dress, {
          ...base,
          anchor,
          selected,
          preferredTypes: biblePreferredTypes(params.resolvedIntent, params.wardrobe, 'dress', params.mood, 'dress'),
          seed: params.seed + 3,
        })
      : undefined;
  if (dress) selected.push(analyzeWardrobeItem(dress));

  const shoes = pickBestPiece(byCategory.shoes, {
    ...base,
    anchor,
    selected,
    preferredTypes: biblePreferredTypes(params.resolvedIntent, params.wardrobe, 'shoes', params.mood, 'shoes'),
    seed: params.seed + 4,
  });
  if (shoes) selected.push(analyzeWardrobeItem(shoes));

  const shouldLayer = needsOuterwearForContext(params.intent, params.weather);
  const outerwear = shouldLayer
    ? pickBestPiece(byCategory.outerwear, {
        ...base,
        anchor,
        selected,
        preferredTypes: biblePreferredTypes(params.resolvedIntent, params.wardrobe, 'outerwear', params.mood, 'outerwear'),
        seed: params.seed + 5,
      })
    : undefined;
  if (outerwear) selected.push(analyzeWardrobeItem(outerwear));

  const bag = pickBestPiece(byCategory.bag, {
    ...base,
    anchor,
    selected,
    preferredTypes: preferredTypesForSlot(params.mood, params.intent, 'bag'),
    seed: params.seed + 6,
  });
  if (bag) selected.push(analyzeWardrobeItem(bag));

  const accessoryItems = byCategory.accessory;
  const jewelry = pickBestPiece(
    accessoryItems.filter((item) => item.itemType === 'saat' || item.itemType === 'aksesuar'),
    {
      ...base,
      anchor,
      selected,
      preferredTypes: preferredTypesForSlot(params.mood, params.intent, 'jewelry'),
      seed: params.seed + 7,
    },
  );
  if (jewelry) selected.push(analyzeWardrobeItem(jewelry));

  const accessory = pickBestPiece(
    accessoryItems.filter((item) => item.id !== jewelry?.id),
    {
      ...base,
      anchor,
      selected,
      preferredTypes: preferredTypesForSlot(params.mood, params.intent, 'accessory'),
      seed: params.seed + 8,
    },
  );

  const pieces: OutfitPiece[] = [];
  if (top) pieces.push({ id: `${top.id}-top`, role: 'top', label: t.completeLook.top, item: top });
  if (bottom) pieces.push({ id: `${bottom.id}-bottom`, role: 'bottom', label: t.completeLook.bottom, item: bottom });
  if (!top && !bottom && dress) {
    pieces.push({ id: `${dress.id}-dress`, role: 'dress', label: t.completeLook.dress, item: dress });
  }
  if (shoes) pieces.push({ id: `${shoes.id}-shoes`, role: 'shoes', label: t.completeLook.shoes, item: shoes });
  if (outerwear) {
    pieces.push({ id: `${outerwear.id}-outerwear`, role: 'outerwear', label: t.completeLook.outerwear, item: outerwear });
  }
  if (bag) pieces.push({ id: `${bag.id}-bag`, role: 'bag', label: t.completeLook.bag, item: bag });
  if (accessory) {
    pieces.push({ id: `${accessory.id}-accessory`, role: 'accessory', label: t.completeLook.accessories, item: accessory });
  }
  if (jewelry) {
    pieces.push({ id: `${jewelry.id}-jewelry`, role: 'jewelry', label: t.completeLook.jewelry, item: jewelry });
  }

  return pieces;
}

function buildCompleteOutfit(
  t: TranslationKeys,
  params: {
    intent: string;
    resolvedIntent: ResolvedIntent;
    wardrobe: WardrobeItem[];
    weather?: WeatherSnapshot;
    mood: MoodId;
    seed: number;
    recentItemIds?: string[];
    recentOutfitSets?: string[][];
    seenSignatures?: Set<string>;
    regenerate?: boolean;
    styleMemory?: StyleMemory;
  },
): { pieces: OutfitPiece[] } {
  const byCategory = partitionWardrobe(params.wardrobe);
  const stylingWardrobe = params.wardrobe.map((item) => ({
    id: item.id,
    name: item.name,
    itemType: item.itemType,
    category: item.category,
  }));
  let bestPieces: OutfitPiece[] = [];
  let bestScore = -Infinity;
  const attemptCount = params.regenerate ? REGENERATE_OUTFIT_CANDIDATE_COUNT : OUTFIT_CANDIDATE_COUNT;
  const bibleContext = {
    mood: params.mood,
    weather: params.weather,
    intent: params.intent,
    resolvedIntent: params.resolvedIntent,
  };
  const diversityOptions = {
    recentOutfitSets: params.recentOutfitSets,
    seenSignatures: params.seenSignatures,
  };

  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    const candidateSeed = params.seed + attempt * 19;
    const pieces = assembleOutfitCandidate(t, byCategory, {
      ...params,
      seed: candidateSeed,
    });
    const bibleScore = scoreOutfitPiecesWithBible(pieces, bibleContext, stylingWardrobe, diversityOptions);
    const coherence = scoreOutfitPieces(pieces, bibleContext);
    const score = bibleScore * 0.8 + coherence * 0.2;
    if (score > bestScore) {
      bestScore = score;
      bestPieces = pieces;
    }
  }

  return { pieces: bestPieces };
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

function outfitPieceName(pieces: OutfitPiece[], role: OutfitPieceRole): string | undefined {
  return pieces.find((piece) => piece.role === role)?.item.name;
}

function fillTemplate(template: string, values: Record<string, string | number | undefined>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value ?? '')),
    template,
  );
}

function buildWardrobeLedCopy(
  t: TranslationKeys,
  pieces: OutfitPiece[],
  weather: WeatherSnapshot | undefined,
): {
  description?: string;
  weatherStyling?: string;
  whyThisWorks?: string;
} {
  if (pieces.length === 0) return {};

  const primary =
    outfitPieceName(pieces, 'top') ??
    outfitPieceName(pieces, 'dress') ??
    pieces[0]?.item.name;
  const secondary =
    outfitPieceName(pieces, 'bottom') ??
    outfitPieceName(pieces, 'outerwear') ??
    outfitPieceName(pieces, 'bag') ??
    primary;
  const shoes = outfitPieceName(pieces, 'shoes') ?? t.completeLook.shoes.toLowerCase();
  const layer = outfitPieceName(pieces, 'outerwear') ?? t.completeLook.outerwear.toLowerCase();
  const finish =
    outfitPieceName(pieces, 'bag') ??
    outfitPieceName(pieces, 'accessory') ??
    outfitPieceName(pieces, 'jewelry') ??
    shoes;

  const condition = weather ? t.weather.conditions[weather.condition] : undefined;
  const weatherStyling = weather
    ? fillTemplate(
        weather.temperature >= 22 && !weather.needsOuterwear
          ? t.outfit.wardrobeWeatherWarm
          : t.outfit.wardrobeWeatherCool,
        {
          primary,
          secondary,
          temp: weather.temperature,
          condition,
          layer,
        },
      )
    : undefined;

  return {
    description: fillTemplate(t.outfit.wardrobeDescription, { primary, secondary, shoes }),
    weatherStyling,
    whyThisWorks: fillTemplate(t.outfit.wardrobeStylingNote, { finish }),
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
    recentItemIds?: string[];
    recentOutfitSets?: string[][];
    seenSignatures?: Set<string>;
    regenerate?: boolean;
  },
): CuratedLook {
  const { intent, wardrobe, weather, variant = 'default', styleMemory, moodOverride } = params;
  const resolvedIntent = analyzeIntent(intent);
  const parsed = parseIntent(intent);
  const eventContext = inferEventContext(intent, t, weather, parsed.occasion);
  const venueBias = getVenueMoodBias(intent);

  let mood = moodOverride ?? resolvedIntent.moodHint ?? parsed.mood;
  if (venueBias && !moodOverride) mood = venueBias;
  if (styleMemory && !moodOverride) {
    const topMood = (Object.entries(styleMemory.moodFrequency) as [MoodId, number][])
      .sort((a, b) => b[1] - a[1])[0];
    if (topMood && topMood[1] >= 3 && !venueBias) mood = topMood[0];
  }

  const effectiveMood = variant === 'default' ? mood : VARIANT_MOOD[variant];
  const label = buildPersonalizedOccasion(intent, t);
  const seed =
    params.seed ??
    hashSeed(
      `${intent}-${effectiveMood}-${variant}-${weather?.temperature ?? 0}-${params.regenerate ? Date.now() : 0}`,
    );

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
  const completeOutfit = buildCompleteOutfit(t, {
    intent,
    resolvedIntent,
    wardrobe: stylingWardrobe,
    weather,
    mood: effectiveMood,
    seed,
    styleMemory,
    recentItemIds: params.recentItemIds,
    recentOutfitSets: params.recentOutfitSets,
    seenSignatures: params.seenSignatures,
    regenerate: params.regenerate,
  });
  const wardrobeHint =
    stylingWardrobe.length === 1 ? t.home.wardrobeHintSingle : undefined;
  const itemIds = completeOutfit.pieces.map((piece) => piece.item.id);
  let { image, usesWardrobeImage } = resolveLookImage(
    stylingWardrobe,
    effectiveMood,
    weather,
    seed,
  );
  if (completeOutfit.pieces.length > 0) {
    image = completeOutfit.pieces[0].item.imageUri;
    usesWardrobeImage = true;
  }
  const outfitCoherence = scoreOutfitPieces(completeOutfit.pieces, {
    mood: effectiveMood,
    weather,
    intent,
    resolvedIntent,
  });
  const luxuryScores = computeLuxuryScores(effectiveMood, seed, weather, eventContext, outfitCoherence);
  const eleganceScore = luxuryScores.elegance;
  const editorialReasoning = buildEditorialReasoning(t, effectiveMood, seed, weather, eventContext);
  const wardrobeCopy = buildWardrobeLedCopy(t, completeOutfit.pieces, weather);
  const bibleProfiles = completeOutfit.pieces.map((piece) => analyzeWardrobeItem(piece.item));
  const bibleExplanation = buildBibleOutfitExplanation(bibleProfiles, intent, weather, resolvedIntent);
  const whyThisWorks = bibleExplanation.whyThisWorks || [
    editorialReasoning.colorHarmony,
    editorialReasoning.silhouetteBalance,
  ].join(' ');

  let description = wardrobeCopy.description ?? pick(descriptions, seed + 1);
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

  let weatherStyling: string | undefined = wardrobeCopy.weatherStyling;
  if (weather && !weatherStyling) {
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

  const title = buildPersonalizedTitle({
    t,
    intent,
    mood: effectiveMood,
    weather,
    pieces: completeOutfit.pieces,
    seed,
    styleMemory,
  });

  return {
    id: `look-${seed}-${Date.now()}`,
    title,
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
    whyThisWorks: wardrobeCopy.whyThisWorks ?? whyThisWorks,
    editorialReasoning,
    completeOutfit: completeOutfit.pieces,
    eventContext,
    intent,
  };
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
