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
import { WARDROBE_ENGINE_CATEGORIES } from '@/lib/wardrobe-item-types';

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
  completeOutfit?: OutfitPiece[];
  missingOutfitPieces?: string[];
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

const NEUTRAL_TONES = new Set(['black', 'white', 'cream', 'ivory', 'beige', 'camel', 'gray', 'navy']);

const TONE_PATTERNS: { tone: string; patterns: RegExp[] }[] = [
  { tone: 'black', patterns: [/\bblack\b/i, /\bsiyah\b/i] },
  { tone: 'white', patterns: [/\bwhite\b/i, /\bbeyaz\b/i] },
  { tone: 'cream', patterns: [/\bcream\b/i, /\bkrem\b/i, /\bivory\b/i, /\bfildisi\b/i, /\bfildişi\b/i] },
  { tone: 'burgundy', patterns: [/\bburgundy\b/i, /\bbordo\b/i, /\bwine\b/i, /\bşarap\b/i] },
  { tone: 'beige', patterns: [/\bbeige\b/i, /\bbej\b/i, /\btaupe\b/i, /\bvizon\b/i] },
  { tone: 'camel', patterns: [/\bcamel\b/i, /\bkahve\b/i, /\btaba\b/i] },
  { tone: 'gray', patterns: [/\bgray\b/i, /\bgrey\b/i, /\bgri\b/i, /\bantrasit\b/i] },
  { tone: 'navy', patterns: [/\bnavy\b/i, /\blacivert\b/i] },
  { tone: 'blue', patterns: [/\bblue\b/i, /\bmavi\b/i] },
  { tone: 'pink', patterns: [/\bpink\b/i, /\bpembe\b/i, /\bblush\b/i] },
  { tone: 'green', patterns: [/\bgreen\b/i, /\byeşil\b/i, /\byesil\b/i] },
  { tone: 'gold', patterns: [/\bgold\b/i, /\baltın\b/i, /\baltin\b/i] },
  { tone: 'silver', patterns: [/\bsilver\b/i, /\bgümüş\b/i, /\bgumus\b/i] },
];

const COLD_INTENT_PATTERN =
  /\b(cold|winter|snow|rain|rainy|evening|night|outdoor|outside|soğuk|soguk|kış|kis|kar|yağmur|yagmur|akşam|aksam|gece|dışarı|disari)\b/i;
const COMFORT_FOOTWEAR_INTENT_PATTERN =
  /\b(city walk|walk|travel|airport|explore|sightseeing|seyahat|yürüyüş|yuruyus|gezmek|keşif|kesif|havalimanı|havalimani)\b/i;

function detectTone(item: WardrobeItem): string | null {
  const source = `${item.name} ${item.itemType}`.trim();
  return TONE_PATTERNS.find((entry) => entry.patterns.some((pattern) => pattern.test(source)))?.tone ?? null;
}

function toneScore(item: WardrobeItem, anchorTone: string | null): number {
  const tone = detectTone(item);
  if (!tone || !anchorTone) return 1;
  if (tone === anchorTone) return 4;
  if (NEUTRAL_TONES.has(tone) || NEUTRAL_TONES.has(anchorTone)) return 3;
  return 0;
}

function rotateBySeed<T>(items: T[], seed: number): T[] {
  if (items.length <= 1) return items;
  const offset = seed % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function choosePiece(
  items: WardrobeItem[],
  seed: number,
  anchorTone: string | null,
  preferredTypes: WardrobeItem['itemType'][] = [],
): WardrobeItem | undefined {
  return rotateBySeed(items, seed)
    .map((item, index) => {
      const typeScore = preferredTypes.includes(item.itemType) ? 3 : 0;
      return { item, score: toneScore(item, anchorTone) + typeScore - index * 0.01 };
    })
    .sort((a, b) => b.score - a.score)[0]?.item;
}

function needsOuterwear(intent: string, weather: WeatherSnapshot | undefined): boolean {
  if (!weather) return COLD_INTENT_PATTERN.test(intent);
  if (!weather.needsOuterwear && weather.temperature >= 22 && !weather.isRainy) return false;
  if (weather.needsOuterwear) return true;
  if (COLD_INTENT_PATTERN.test(intent)) return true;
  if (weather.temperature <= 18) return true;
  return ['rain', 'drizzle', 'snow', 'fog', 'thunderstorm'].includes(weather.condition);
}

function buildCompleteOutfit(
  t: TranslationKeys,
  params: {
    intent: string;
    wardrobe: WardrobeItem[];
    weather?: WeatherSnapshot;
    mood: MoodId;
    seed: number;
  },
): { pieces: OutfitPiece[]; missing: string[] } {
  const byCategory = WARDROBE_ENGINE_CATEGORIES.reduce<Record<WardrobeCategoryId, WardrobeItem[]>>(
    (acc, category) => {
      acc[category] = params.wardrobe.filter((item) => item.category === category);
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
  const pieces: OutfitPiece[] = [];
  const missing: string[] = [];
  const preferElegant = params.mood === 'elegant' || params.mood === 'oldMoney' || params.mood === 'seductive';
  const preferMinimal = params.mood === 'minimal';

  const top = choosePiece(
    byCategory.upper,
    params.seed + 1,
    null,
    preferElegant || preferMinimal ? ['gomlek', 'kazak'] : ['tisort', 'gomlek'],
  );
  const anchorTone = top ? detectTone(top) : null;
  const bottom = choosePiece(
    byCategory.bottom,
    params.seed + 2,
    anchorTone,
    preferElegant || preferMinimal ? ['pantolon', 'etek'] : ['jean', 'pantolon'],
  );
  const dress = !top || !bottom ? choosePiece(byCategory.dress, params.seed + 3, anchorTone) : undefined;
  const shoes = choosePiece(
    byCategory.shoes,
    params.seed + 4,
    anchorTone,
    COMFORT_FOOTWEAR_INTENT_PATTERN.test(params.intent)
      ? ['ayakkabi', 'bot']
      : preferElegant
        ? ['topuklu', 'bot']
        : ['ayakkabi', 'bot'],
  );
  const shouldLayer = needsOuterwear(params.intent, params.weather);
  const outerwear = shouldLayer
    ? choosePiece(byCategory.outerwear, params.seed + 5, anchorTone, ['trenchcoat', 'ceket', 'kaban', 'mont'])
    : undefined;
  const bag = choosePiece(byCategory.bag, params.seed + 6, anchorTone);
  const accessoryItems = byCategory.accessory;
  const jewelry = choosePiece(
    accessoryItems.filter((item) => item.itemType === 'saat' || item.itemType === 'aksesuar'),
    params.seed + 7,
    anchorTone,
    ['saat', 'aksesuar'],
  );
  const accessory = choosePiece(
    accessoryItems.filter((item) => item.id !== jewelry?.id),
    params.seed + 8,
    anchorTone,
    ['kemer', 'gozluk', 'sapka'],
  );

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

  if (!top && !dress) missing.push(t.completeLook.missingTopCompletion);
  if (!bottom && !dress) missing.push(t.completeLook.missingBottomCompletion);
  if (!shoes) missing.push(t.completeLook.missingShoeCompletion);
  if (shouldLayer && !outerwear) missing.push(t.completeLook.missingOuterwearCompletion);
  if (!bag) missing.push(t.completeLook.missingBagCompletion);
  if (!accessory && !jewelry) missing.push(t.completeLook.missingJewelryCompletion);

  return { pieces, missing };
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
  const completeOutfit = buildCompleteOutfit(t, {
    intent,
    wardrobe: stylingWardrobe,
    weather,
    mood: effectiveMood,
    seed,
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
    missingPieces: stylingWardrobe.length > 0 ? [] : missingPieces,
    completeOutfit: completeOutfit.pieces,
    missingOutfitPieces: completeOutfit.missing,
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
