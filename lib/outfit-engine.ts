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
import type { WardrobeStyleProfile } from '@/lib/wardrobe-style-profile';
import {
  deriveEngineCategoryFromProfile,
  getEffectiveStyleProfile,
} from '@/lib/wardrobe-style-profile';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import { resolveSelectedOccasion } from '@/lib/selected-occasion';
import { hasUserWardrobeMetadata } from '@/lib/wardrobe-metadata-authority';
import { scoreWomenPieceForOccasion } from '@/lib/women-outfit-scoring';
import {
  buildHarmonyOutfitExplanation,
  logOutfitHarmonyDebug,
  scoreOutfitHarmonyLayer,
} from '@/lib/color-harmony-intelligence';
import type { TranslationKeys } from '@/i18n/types';
import type { WeatherSnapshot } from '@/lib/weather';
import { weatherMoodBoost } from '@/lib/weather';
import { getStylingWardrobe } from '@/lib/wardrobe-utils';
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
  type StylingWardrobeItem,
} from '@/lib/outfit-styling-intelligence';
import {
  buildBibleOutfitExplanation,
  preferredTypesForOccasion,
  scoreOutfitPiecesWithBible,
} from '@/lib/styling-bible';
import {
  computeChangedCorePercent,
  isHomeRegenerateFlow,
  logStyloveDiversity,
  regenerateCorePieceIds,
  repeatedItemIds,
  scoreOutfitComboRepeat,
  scoreRegenerateCoreDiversityV2,
  stylingComboSignature,
  wardrobeHasRegenerateAlternatives,
} from '@/lib/outfit-diversity';
import { filterShoesForWeatherContext, filterWardrobeItemsForWeather } from '@/lib/layer-piece-rules';
import {
  allowsSunglassesForOccasion,
  allowsWatchForOccasion,
  corePieceIdsFromOutfit,
  filterOuterwearPoolForLayerRules,
  isRealTopItem,
  logInvalidOutfitCandidate,
  maxAccessoriesForOccasion,
  partitionWardrobeBySlot,
  pickAccessoryCandidates,
  scoreRegenerateCoreDiversity,
  shouldPreferOnePiece,
  isWearableOutfit,
  validateOutfitStructure,
  type WardrobePools,
} from '@/lib/outfit-assembly-rules';
import {
  buildOutfitDecisionReport,
  isOutfitDecisionDebugEnabled,
  logOutfitCandidateRejection,
  logOutfitDecisionReport,
} from '@/lib/outfit-decision-debug';
import { assembleOutfitWithConcept } from '@/lib/outfit-concept-assembly';
import { paletteRejectionReason, type PlannedPalette } from '@/lib/outfit-palette-planner';

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
  styleProfile?: WardrobeStyleProfile;
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
  /** Internal: last styling concept used for regenerate rotation. */
  stylingConceptId?: string;
  /** Internal: palette mode used for regenerate rotation. */
  paletteMode?: string;
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

function stylingContextBase(
  params: {
    intent: string;
    resolvedIntent?: ResolvedIntent;
    weather?: WeatherSnapshot;
    mood: MoodId;
    seed: number;
    recentItemIds?: string[];
    recentOutfitSets?: string[][];
    selectedOccasion?: SelectedOccasionId;
    styleMemory?: StyleMemory;
    wardrobe: WardrobeItem[];
  },
): Omit<OutfitStylingContext, 'anchor' | 'selected' | 'preferredTypes'> {
  return {
    mood: params.mood,
    intent: params.intent,
    resolvedIntent: params.resolvedIntent,
    weather: params.weather,
    recentItemIds: new Set(params.recentItemIds ?? []),
    recentOutfitSets: params.recentOutfitSets,
    selectedOccasion: params.selectedOccasion,
    styleMemory: params.styleMemory,
    seed: params.seed,
    wardrobe: params.wardrobe.map(toStylingWardrobeItem),
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

function toStylingWardrobeItem(item: WardrobeItem): import('@/lib/outfit-styling-intelligence').StylingWardrobeItem {
  const profile = getEffectiveStyleProfile(item);
  return {
    id: item.id,
    name: item.name,
    itemType: item.itemType,
    category: deriveEngineCategoryFromProfile(profile),
    styleProfile: profile,
  };
}

function resolvePickedItem(
  pool: WardrobeItem[],
  picked: StylingWardrobeItem | undefined,
): WardrobeItem | undefined {
  return picked ? pool.find((item) => item.id === picked.id) : undefined;
}

function shouldAddOuterwear(intent: string, weather?: WeatherSnapshot): boolean {
  if (!needsOuterwearForContext(intent, weather)) return false;
  if (weather && weather.temperature >= 29 && !weather.isRainy) return false;
  return true;
}

function pickLimitedAccessories(
  pools: WardrobePools,
  base: Omit<OutfitStylingContext, 'anchor' | 'selected' | 'preferredTypes'>,
  anchor: ItemStylingProfile,
  selected: ItemStylingProfile[],
  params: {
    mood: MoodId;
    intent: string;
    seed: number;
    maxCount: number;
    allowWatch: boolean;
  },
): { jewelry?: WardrobeItem; accessory?: WardrobeItem } {
  if (params.maxCount <= 0) return {};
  const { jewelry: jewelryPool, accessories: accessoryPool } = pickAccessoryCandidates(
    pools,
    params.allowWatch,
    allowsSunglassesForOccasion(base.selectedOccasion, base.weather),
  );
  const combined = [...jewelryPool, ...accessoryPool];
  if (combined.length === 0) return {};

  const first = pickBestPiece(combined.map(toStylingWardrobeItem), {
    ...base,
    anchor,
    selected,
    preferredTypes: preferredTypesForSlot(params.mood, params.intent, 'jewelry'),
    seed: params.seed,
  });
  if (!first) return {};

  const firstItem = combined.find((item) => item.id === first.id);
  if (!firstItem) return {};

  const role: OutfitPieceRole = firstItem.itemType === 'saat' ? 'jewelry' : 'accessory';
  const result: { jewelry?: WardrobeItem; accessory?: WardrobeItem } =
    role === 'jewelry' ? { jewelry: firstItem } : { accessory: firstItem };

  if (params.maxCount < 2) return result;

  const secondPool = combined.filter((item) => item.id !== firstItem.id);
  const second = pickBestPiece(secondPool.map(toStylingWardrobeItem), {
    ...base,
    anchor,
    selected: [...selected, analyzeWardrobeItem(toStylingWardrobeItem(firstItem))],
    preferredTypes: preferredTypesForSlot(params.mood, params.intent, 'accessory'),
    seed: params.seed + 1,
  });
  const secondItem = second ? secondPool.find((item) => item.id === second.id) : undefined;
  if (!secondItem) return result;

  if (secondItem.itemType === 'saat') result.jewelry = secondItem;
  else result.accessory = secondItem;
  return result;
}

function assembleOutfitCandidate(
  t: TranslationKeys,
  pools: WardrobePools,
  params: {
    intent: string;
    resolvedIntent: ResolvedIntent;
    selectedOccasion?: SelectedOccasionId;
    wardrobe: WardrobeItem[];
    weather?: WeatherSnapshot;
    mood: MoodId;
    seed: number;
    recentItemIds?: string[];
    recentOutfitSets?: string[][];
    styleMemory?: StyleMemory;
  },
): OutfitPiece[] {
  const base = stylingContextBase(params);
  const selected: ItemStylingProfile[] = [];
  const occasionId = params.selectedOccasion;
  const allowWatch = allowsWatchForOccasion(occasionId, params.weather);
  const maxAccessories = maxAccessoriesForOccasion(occasionId);

  const tryOnePiece =
    pools.onePieces.length > 0 &&
    (shouldPreferOnePiece(pools, params.seed, occasionId) ||
      (pools.tops.filter(isRealTopItem).length === 0 && pools.bottoms.length === 0));

  if (tryOnePiece) {
    const onePieceStyling = pickBestPiece(pools.onePieces.map(toStylingWardrobeItem), {
      ...base,
      anchor: null,
      selected,
      preferredTypes: biblePreferredTypes(
        params.resolvedIntent,
        params.wardrobe,
        'dress',
        params.mood,
        'dress',
      ),
      seed: params.seed + 1,
    });
    const onePiece = onePieceStyling
      ? pools.onePieces.find((item) => item.id === onePieceStyling.id)
      : undefined;
    if (!onePiece) return [];

    selected.push(analyzeWardrobeItem(toStylingWardrobeItem(onePiece)));
    const anchor = selected[0];

    const dressShoePool = filterShoesForWeatherContext(pools.shoes, params.weather);
    const shoesPick = pickBestPiece(dressShoePool.map(toStylingWardrobeItem), {
      ...base,
      anchor,
      selected,
      preferredTypes: biblePreferredTypes(params.resolvedIntent, params.wardrobe, 'shoes', params.mood, 'shoes'),
      seed: params.seed + 4,
    });
    const shoes = resolvePickedItem(dressShoePool, shoesPick);
    if (!shoes) return [];
    selected.push(analyzeWardrobeItem(toStylingWardrobeItem(shoes)));

    const dressOuterwearPool = filterOuterwearPoolForLayerRules(
      pools.outerwear,
      params.weather,
      true,
    );
    const outerwearPick = shouldAddOuterwear(params.intent, params.weather)
      ? pickBestPiece(dressOuterwearPool.map(toStylingWardrobeItem), {
          ...base,
          anchor,
          selected,
          preferredTypes: biblePreferredTypes(
            params.resolvedIntent,
            params.wardrobe,
            'outerwear',
            params.mood,
            'outerwear',
          ),
          seed: params.seed + 5,
        })
      : undefined;
    const outerwear = resolvePickedItem(dressOuterwearPool, outerwearPick);
    if (outerwear) selected.push(analyzeWardrobeItem(toStylingWardrobeItem(outerwear)));

    const bagPick = pickBestPiece(pools.bags.map(toStylingWardrobeItem), {
      ...base,
      anchor,
      selected,
      preferredTypes: preferredTypesForSlot(params.mood, params.intent, 'bag'),
      seed: params.seed + 6,
    });
    const bag = resolvePickedItem(pools.bags, bagPick);
    if (bag) selected.push(analyzeWardrobeItem(toStylingWardrobeItem(bag)));

    const finishing = pickLimitedAccessories(pools, base, anchor, selected, {
      mood: params.mood,
      intent: params.intent,
      seed: params.seed + 7,
      maxCount: maxAccessories,
      allowWatch,
    });

    const pieces: OutfitPiece[] = [
      {
        id: `${onePiece.id}-dress`,
        role: 'dress',
        label: t.completeLook.dress,
        item: onePiece,
      },
      { id: `${shoes.id}-shoes`, role: 'shoes', label: t.completeLook.shoes, item: shoes },
    ];
    if (outerwear) {
      pieces.push({
        id: `${outerwear.id}-outerwear`,
        role: 'outerwear',
        label: t.completeLook.outerwear,
        item: outerwear,
      });
    }
    if (bag) pieces.push({ id: `${bag.id}-bag`, role: 'bag', label: t.completeLook.bag, item: bag });
    if (finishing.accessory) {
      pieces.push({
        id: `${finishing.accessory.id}-accessory`,
        role: 'accessory',
        label: t.completeLook.accessories,
        item: finishing.accessory,
      });
    }
    if (finishing.jewelry) {
      pieces.push({
        id: `${finishing.jewelry.id}-jewelry`,
        role: 'jewelry',
        label: t.completeLook.jewelry,
        item: finishing.jewelry,
      });
    }
    return pieces;
  }

  const topPool = filterWardrobeItemsForWeather(pools.tops.filter(isRealTopItem), params.weather);
  const topStyling = pickBestPiece(topPool.map(toStylingWardrobeItem), {
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
  const top = topStyling ? topPool.find((item) => item.id === topStyling.id) : undefined;
  if (!top) return [];

  const anchor = analyzeWardrobeItem(toStylingWardrobeItem(top));
  selected.push(anchor);

  const bottomPool = filterWardrobeItemsForWeather(pools.bottoms, params.weather);
  const bottomPick = pickBestPiece(bottomPool.map(toStylingWardrobeItem), {
    ...base,
    anchor,
    selected,
    preferredTypes: biblePreferredTypes(params.resolvedIntent, params.wardrobe, 'bottom', params.mood, 'bottom'),
    seed: params.seed + 2,
  });
  const bottom = resolvePickedItem(bottomPool, bottomPick);
  if (!bottom) return [];

  selected.push(analyzeWardrobeItem(toStylingWardrobeItem(bottom)));

  const separatesShoePool = filterShoesForWeatherContext(pools.shoes, params.weather);
  const shoesPick = pickBestPiece(separatesShoePool.map(toStylingWardrobeItem), {
    ...base,
    anchor,
    selected,
    preferredTypes: biblePreferredTypes(params.resolvedIntent, params.wardrobe, 'shoes', params.mood, 'shoes'),
    seed: params.seed + 4,
  });
  const shoes = resolvePickedItem(separatesShoePool, shoesPick);
  if (!shoes) return [];

  selected.push(analyzeWardrobeItem(toStylingWardrobeItem(shoes)));

  const separatesOuterwearPool = filterOuterwearPoolForLayerRules(
    pools.outerwear,
    params.weather,
    false,
  );
  const outerwearPick = shouldAddOuterwear(params.intent, params.weather)
    ? pickBestPiece(separatesOuterwearPool.map(toStylingWardrobeItem), {
        ...base,
        anchor,
        selected,
        preferredTypes: biblePreferredTypes(
          params.resolvedIntent,
          params.wardrobe,
          'outerwear',
          params.mood,
          'outerwear',
        ),
        seed: params.seed + 5,
      })
    : undefined;
  const outerwear = resolvePickedItem(separatesOuterwearPool, outerwearPick);
  if (outerwear) selected.push(analyzeWardrobeItem(toStylingWardrobeItem(outerwear)));

  const bagPick = pickBestPiece(pools.bags.map(toStylingWardrobeItem), {
    ...base,
    anchor,
    selected,
    preferredTypes: preferredTypesForSlot(params.mood, params.intent, 'bag'),
    seed: params.seed + 6,
  });
  const bag = resolvePickedItem(pools.bags, bagPick);
  if (bag) selected.push(analyzeWardrobeItem(toStylingWardrobeItem(bag)));

  const finishing = pickLimitedAccessories(pools, base, anchor, selected, {
    mood: params.mood,
    intent: params.intent,
    seed: params.seed + 7,
    maxCount: maxAccessories,
    allowWatch,
  });

  const pieces: OutfitPiece[] = [
    { id: `${top.id}-top`, role: 'top', label: t.completeLook.top, item: top },
    { id: `${bottom.id}-bottom`, role: 'bottom', label: t.completeLook.bottom, item: bottom },
    { id: `${shoes.id}-shoes`, role: 'shoes', label: t.completeLook.shoes, item: shoes },
  ];
  if (outerwear) {
    pieces.push({
      id: `${outerwear.id}-outerwear`,
      role: 'outerwear',
      label: t.completeLook.outerwear,
      item: outerwear,
    });
  }
  if (bag) pieces.push({ id: `${bag.id}-bag`, role: 'bag', label: t.completeLook.bag, item: bag });
  if (finishing.accessory) {
    pieces.push({
      id: `${finishing.accessory.id}-accessory`,
      role: 'accessory',
      label: t.completeLook.accessories,
      item: finishing.accessory,
    });
  }
  if (finishing.jewelry) {
    pieces.push({
      id: `${finishing.jewelry.id}-jewelry`,
      role: 'jewelry',
      label: t.completeLook.jewelry,
      item: finishing.jewelry,
    });
  }

  return pieces;
}

function buildCompleteOutfit(
  t: TranslationKeys,
  params: {
    intent: string;
    resolvedIntent: ResolvedIntent;
    selectedOccasion?: SelectedOccasionId;
    wardrobe: WardrobeItem[];
    weather?: WeatherSnapshot;
    mood: MoodId;
    seed: number;
    recentItemIds?: string[];
    recentOutfitSets?: string[][];
    recentCoreSets?: string[][];
    seenSignatures?: Set<string>;
    regenerate?: boolean;
    styleMemory?: StyleMemory;
    previousConceptId?: string;
    previousPaletteMode?: string;
    previousComboSignature?: string;
    previousItemIds?: string[];
    previousWasOnePiece?: boolean;
    previousShoeId?: string;
    previousShoeCategory?: string;
    previousHadShorts?: boolean;
    previousOutfitPieces?: OutfitPiece[];
    diversitySource?: 'home' | 'replace' | 'looks' | 'engine';
  },
): { pieces: OutfitPiece[]; stylingConceptId?: string; paletteMode?: string } {
  const pools = partitionWardrobeBySlot(params.wardrobe);
  const stylingWardrobe = params.wardrobe.map((item) => ({
    id: item.id,
    name: item.name,
    itemType: item.itemType,
    category: item.category,
  }));
  let bestPieces: OutfitPiece[] = [];
  let bestConceptId: string | undefined;
  let bestPaletteMode: string | undefined;
  let bestDiversityPenalty = 0;
  let bestScore = -Infinity;
  const previousCore = params.recentCoreSets?.[params.recentCoreSets.length - 1] ?? [];
  const wardrobeHasCoreAlternatives = wardrobeHasRegenerateAlternatives(pools);
  const attemptCount = params.regenerate ? REGENERATE_OUTFIT_CANDIDATE_COUNT : OUTFIT_CANDIDATE_COUNT;
  const bibleContext = {
    mood: params.mood,
    weather: params.weather,
    intent: params.intent,
    resolvedIntent: params.resolvedIntent,
  };
  const diversityOptions = {
    recentOutfitSets: params.recentOutfitSets,
    recentCoreSets: params.recentCoreSets,
    seenSignatures: params.seenSignatures,
  };

  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    const candidateSeed = params.seed + attempt * 19;
    const conceptResult = assembleOutfitWithConcept({
      t,
      pools,
      intent: params.intent,
      resolvedIntent: params.resolvedIntent,
      selectedOccasion: params.selectedOccasion,
      wardrobe: params.wardrobe,
      weather: params.weather,
      mood: params.mood,
      seed: candidateSeed,
      attempt,
      recentItemIds: params.recentItemIds,
      recentOutfitSets: params.recentOutfitSets,
      styleMemory: params.styleMemory,
      regenerate: params.regenerate,
      previousConceptId: params.previousConceptId,
      previousPaletteMode: params.previousPaletteMode,
      previousWasOnePiece: params.previousWasOnePiece,
      previousComboSignature: params.previousComboSignature,
      previousItemIds: params.previousItemIds,
      previousShoeId: params.previousShoeId,
      previousShoeCategory: params.previousShoeCategory,
      previousHadShorts: params.previousHadShorts,
    });

    const pieces =
      conceptResult && conceptResult.pieces.length > 0
        ? conceptResult.pieces
        : assembleOutfitCandidate(t, pools, {
            ...params,
            seed: candidateSeed,
          });

    const validation = validateOutfitStructure(pieces, params.selectedOccasion, params.weather);
    if (!validation.valid) {
      logInvalidOutfitCandidate(validation.reason ?? 'unknown', attempt);
      logOutfitCandidateRejection({
        attempt,
        reason: validation.reason ?? 'unknown',
        pieceCount: pieces.length,
      });
      continue;
    }

    const itemList = pieces.map((p) => p.item);
    const harmony = scoreOutfitHarmonyLayer({
      items: itemList,
      selectedOccasion: params.selectedOccasion,
      resolvedIntent: params.resolvedIntent,
      weather: params.weather,
    });
    logOutfitHarmonyDebug(harmony);

    const bibleScore = scoreOutfitPiecesWithBible(pieces, bibleContext, stylingWardrobe, diversityOptions);
    const coherence = scoreOutfitPieces(pieces, bibleContext);
    let score = harmony.total * 0.55 + bibleScore * 0.2 + coherence * 0.08;
    if (conceptResult && conceptResult.pieces.length > 0) {
      score += 14;
      if (!paletteRejectionReasonFromPieces(pieces, conceptResult.palette)) {
        score += 6;
      }
    }
    if (params.selectedOccasion) {
      for (const piece of pieces) {
        const profile = analyzeWardrobeItem(toStylingWardrobeItem(piece.item));
        const metadataWeight = hasUserWardrobeMetadata(piece.item) ? 0.14 : 0.06;
        score += scoreWomenPieceForOccasion(piece.item, profile, params.selectedOccasion) * metadataWeight;
      }
    }
    const comboPenalty = scoreOutfitComboRepeat(pieces, params.recentOutfitSets ?? [], {
      regenerate: params.regenerate,
      previousComboSignature: params.previousComboSignature,
      previousItemIds: params.previousItemIds,
      slotPoolSizes: { bags: pools.bags.length, shoes: pools.shoes.length },
    });
    score += comboPenalty;

    if (isHomeRegenerateFlow(params.regenerate, params.diversitySource)) {
      score += scoreRegenerateCoreDiversityV2({
        pieces,
        regenerate: params.regenerate,
        diversitySource: params.diversitySource,
        previousOutfitPieces: params.previousOutfitPieces,
        wardrobeHasAlternatives: wardrobeHasCoreAlternatives,
      });
    } else {
      score += scoreRegenerateCoreDiversity(
        corePieceIdsFromOutfit(pieces),
        params.recentCoreSets ?? params.recentOutfitSets ?? [],
        params.regenerate,
        wardrobeHasCoreAlternatives,
      );
    }

    if (params.regenerate && params.previousComboSignature) {
      const candidateSig = stylingComboSignature(pieces);
      if (candidateSig === params.previousComboSignature) {
        score -= 40;
      }
    }

    const diversityPenalty = comboPenalty;
    if (score > bestScore) {
      bestScore = score;
      bestPieces = pieces;
      bestConceptId = conceptResult?.concept.id;
      bestPaletteMode = conceptResult?.palette.mode;
      bestDiversityPenalty = diversityPenalty;
    }
  }

  if (isOutfitDecisionDebugEnabled()) {
    const report = buildOutfitDecisionReport({
      path: 'local_engine',
      pieces: bestPieces,
      occasion: params.selectedOccasion,
      weather: params.weather,
      recentOutfitSets: params.recentOutfitSets,
      recentCoreSets: params.recentCoreSets,
      seenSignatures: params.seenSignatures,
      stylingWardrobe,
      extraNotes: [
        bestPieces.length === 0
          ? 'WARNING: no valid candidate survived validation — UI may show empty or fallback pieces'
          : `attempts=${attemptCount} bestScore=${bestScore.toFixed(2)}`,
        `poolSizes tops=${pools.tops.length} bottoms=${pools.bottoms.length} onePieces=${pools.onePieces.length} outerwear=${pools.outerwear.length}`,
      ],
    });
    logOutfitDecisionReport(report);
  }

  if (bestPieces.length > 0) {
    const newItemIds = bestPieces.map((p) => p.item.id);
    const newCore = params.previousOutfitPieces?.length
      ? regenerateCorePieceIds(bestPieces)
      : corePieceIdsFromOutfit(bestPieces);
    const previousCoreForLog = params.previousOutfitPieces?.length
      ? regenerateCorePieceIds(params.previousOutfitPieces)
      : previousCore;
    logStyloveDiversity({
      source: params.diversitySource ?? 'engine',
      occasion: params.selectedOccasion,
      regenerate: Boolean(params.regenerate),
      previousItemIds: params.previousItemIds ?? [],
      newItemIds,
      repeatedItemIds: repeatedItemIds(params.previousItemIds ?? [], newItemIds),
      changedCorePercent: computeChangedCorePercent(newCore, previousCoreForLog),
      conceptChanged: Boolean(params.previousConceptId && bestConceptId !== params.previousConceptId),
      paletteChanged: Boolean(params.previousPaletteMode && bestPaletteMode !== params.previousPaletteMode),
      diversityPenaltyApplied: bestDiversityPenalty,
      previousConceptId: params.previousConceptId,
      newConceptId: bestConceptId,
      previousPaletteMode: params.previousPaletteMode,
      newPaletteMode: bestPaletteMode,
    });
  }

  if (
    bestPieces.length > 0 &&
    !isWearableOutfit(bestPieces, params.selectedOccasion, params.weather)
  ) {
    bestPieces = [];
    bestConceptId = undefined;
    bestPaletteMode = undefined;
  }

  return { pieces: bestPieces, stylingConceptId: bestConceptId, paletteMode: bestPaletteMode };
}

function paletteRejectionReasonFromPieces(pieces: OutfitPiece[], palette: PlannedPalette): string | null {
  return paletteRejectionReason(
    pieces.map((p) => p.item),
    palette,
  );
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
  occasion?: SelectedOccasionId,
): {
  description?: string;
  weatherStyling?: string;
  whyThisWorks?: string;
} {
  if (pieces.length === 0) return {};
  const structure = validateOutfitStructure(pieces, occasion, weather);
  if (!structure.valid) return {};

  const primary =
    outfitPieceName(pieces, 'top') ??
    outfitPieceName(pieces, 'dress') ??
    undefined;
  const secondary = outfitPieceName(pieces, 'bottom') ?? outfitPieceName(pieces, 'dress') ?? primary;
  if (!primary || !secondary) return {};
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
    recentCoreSets?: string[][];
    seenSignatures?: Set<string>;
    regenerate?: boolean;
    selectedOccasion?: SelectedOccasionId;
    displayOccasion?: string;
    previousStylingConceptId?: string;
    previousPaletteMode?: string;
    previousItemIds?: string[];
    previousComboSignature?: string;
    previousWasOnePiece?: boolean;
    previousShoeId?: string;
    previousShoeCategory?: string;
    previousHadShorts?: boolean;
    previousOutfitPieces?: OutfitPiece[];
    diversitySource?: 'home' | 'replace' | 'looks' | 'engine';
  },
): CuratedLook {
  const { intent, wardrobe, weather, variant = 'default', styleMemory, moodOverride, selectedOccasion } = params;
  const resolvedIntent = selectedOccasion
    ? resolveSelectedOccasion(selectedOccasion)
    : analyzeIntent(intent);
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
  const label =
    params.displayOccasion ??
    (params.selectedOccasion
      ? t.home.occasions[params.selectedOccasion].title
      : buildPersonalizedOccasion(intent, t));
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
  const { pieces: outfitPieces, stylingConceptId, paletteMode } = buildCompleteOutfit(t, {
    intent,
    resolvedIntent,
    selectedOccasion,
    wardrobe: stylingWardrobe,
    weather,
    mood: effectiveMood,
    seed,
    styleMemory,
    recentItemIds: params.recentItemIds,
    recentOutfitSets: params.recentOutfitSets,
    recentCoreSets: params.recentCoreSets,
    seenSignatures: params.seenSignatures,
    regenerate: params.regenerate,
    previousConceptId: params.previousStylingConceptId,
    previousPaletteMode: params.previousPaletteMode,
    previousComboSignature: params.previousComboSignature,
    previousItemIds: params.previousItemIds,
    previousWasOnePiece: params.previousWasOnePiece,
    previousShoeId: params.previousShoeId,
    previousShoeCategory: params.previousShoeCategory,
    previousHadShorts: params.previousHadShorts,
    previousOutfitPieces: params.previousOutfitPieces,
    diversitySource: params.diversitySource,
  });
  const wardrobeHint =
    stylingWardrobe.length === 1 ? t.home.wardrobeHintSingle : undefined;
  const itemIds = outfitPieces.map((piece) => piece.item.id);
  let { image, usesWardrobeImage } = resolveLookImage(
    stylingWardrobe,
    effectiveMood,
    weather,
    seed,
  );
  if (outfitPieces.length > 0) {
    image = outfitPieces[0].item.imageUri;
    usesWardrobeImage = true;
  }
  const outfitCoherence = scoreOutfitPieces(outfitPieces, {
    mood: effectiveMood,
    weather,
    intent,
    resolvedIntent,
  });
  const luxuryScores = computeLuxuryScores(effectiveMood, seed, weather, eventContext, outfitCoherence);
  const eleganceScore = luxuryScores.elegance;
  const editorialReasoning = buildEditorialReasoning(t, effectiveMood, seed, weather, eventContext);
  const wardrobeCopy = buildWardrobeLedCopy(t, outfitPieces, weather, selectedOccasion);

  if (isOutfitDecisionDebugEnabled()) {
    logOutfitDecisionReport(
      buildOutfitDecisionReport({
        path: 'local_engine',
        pieces: outfitPieces,
        occasion: selectedOccasion,
        weather,
        recentOutfitSets: params.recentOutfitSets,
        recentCoreSets: params.recentCoreSets,
        seenSignatures: params.seenSignatures,
        stylingWardrobe: stylingWardrobe.map((item) => ({
          id: item.id,
          name: item.name,
          itemType: item.itemType,
          category: item.category,
        })),
        extraNotes: ['generateLook local assembly complete (OpenAI may merge copy only)'],
      }),
    );
  }
  const bibleProfiles = outfitPieces.map((piece) =>
    analyzeWardrobeItem(toStylingWardrobeItem(piece.item)),
  );
  const harmonyBreakdown = scoreOutfitHarmonyLayer({
    items: outfitPieces.map((p) => p.item),
    selectedOccasion,
    resolvedIntent,
    weather,
  });
  logOutfitHarmonyDebug(harmonyBreakdown);

  const harmonyExplanation = buildHarmonyOutfitExplanation(
    outfitPieces.map((p) => p.item),
    harmonyBreakdown,
    {
      selectedOccasion,
      weather,
      occasionLabel: label,
    },
  );
  const bibleExplanation = buildBibleOutfitExplanation(bibleProfiles, intent, weather, resolvedIntent);
  const whyThisWorks = harmonyExplanation.whyThisWorks || bibleExplanation.whyThisWorks || [
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
    pieces: outfitPieces,
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
    completeOutfit: outfitPieces,
    eventContext,
    intent,
    stylingConceptId,
    paletteMode,
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
