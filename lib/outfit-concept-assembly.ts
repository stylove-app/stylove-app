import type { TranslationKeys } from '@/i18n/types';
import type { MoodId } from '@/i18n/types';
import type { ResolvedIntent } from '@/lib/intent-engine';
import {
  allowsSunglassesForOccasion,
  allowsWatchForOccasion,
  isRealTopItem,
  maxAccessoriesForOccasion,
  filterOuterwearPoolForLayerRules,
  pickAccessoryCandidates,
  scoreAccessoryPickBias,
  scoreHotWeatherItem,
  scoreItemUsageDiversity,
  type WardrobePools,
} from '@/lib/outfit-assembly-rules';
import {
  conceptAllowsOuterwear,
  isDressRuiningOuterwear,
  logOutfitConceptDebug,
  resolveConceptStructure,
  scoreItemForConcept,
  selectOutfitConcept,
  type OutfitConcept,
  type OutfitStructure,
} from '@/lib/outfit-concept-planner';
import {
  formatPaletteColors,
  paletteRejectionReason,
  planOutfitPalette,
  scoreItemPaletteFit,
  type PlannedPalette,
} from '@/lib/outfit-palette-planner';
import type { OutfitPiece, OutfitPieceRole, WardrobeItem } from '@/lib/outfit-engine';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import {
  analyzeWardrobeItem,
  scorePieceCandidate,
  type ItemStylingProfile,
  type OutfitStylingContext,
  type StylingWardrobeItem,
} from '@/lib/outfit-styling-intelligence';
import { getEffectiveStyleProfile } from '@/lib/wardrobe-style-profile';
import type { StyleMemory } from '@/lib/style-memory';
import type { WeatherSnapshot } from '@/lib/weather';
import {
  filterPoolByOccasionAuthority,
  scoreOccasionAuthorityPreference,
  type OccasionAssemblyRole,
} from '@/lib/occasion-style-authority';
import {
  classifyUseCaseMatch,
  hasUserWardrobeMetadata,
  poolHasDirectUseCaseMatch,
  scoreMetadataProductTypeAlignment,
  scoreUseCaseOccasionMatch,
} from '@/lib/wardrobe-metadata-authority';
import {
  filterWardrobeItemsForWeather,
  isShortsItem,
  scoreFootwearWeatherPreference,
  scoreShoeRegenerateDiversity,
  scoreShortsRegenerateDiversity,
} from '@/lib/layer-piece-rules';
import { scoreWomenPieceForOccasion } from '@/lib/women-outfit-scoring';

export type ConceptAssemblyResult = {
  pieces: OutfitPiece[];
  concept: OutfitConcept;
  structure: OutfitStructure;
  palette: PlannedPalette;
};

type AssemblyParams = {
  t: TranslationKeys;
  pools: WardrobePools;
  intent: string;
  resolvedIntent: ResolvedIntent;
  selectedOccasion?: SelectedOccasionId;
  wardrobe: WardrobeItem[];
  weather?: WeatherSnapshot;
  mood: MoodId;
  seed: number;
  attempt: number;
  recentItemIds?: string[];
  recentOutfitSets?: string[][];
  styleMemory?: StyleMemory;
  regenerate?: boolean;
  previousConceptId?: string;
  previousPaletteMode?: string;
  previousWasOnePiece?: boolean;
  previousComboSignature?: string;
  previousItemIds?: string[];
  previousShoeId?: string;
  previousShoeCategory?: string;
  previousHadShorts?: boolean;
};

function toStylingItem(item: WardrobeItem): StylingWardrobeItem {
  const profile = getEffectiveStyleProfile(item);
  return {
    id: item.id,
    name: item.name,
    itemType: item.itemType,
    category: item.category,
    styleProfile: profile,
  };
}

function stylingBase(params: AssemblyParams): Omit<OutfitStylingContext, 'anchor' | 'selected' | 'preferredTypes'> {
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
    wardrobe: params.wardrobe.map(toStylingItem),
  };
}

function slotPoolSizeForRole(pools: WardrobePools, role: Parameters<typeof scoreItemForConcept>[2]): number {
  switch (role) {
    case 'shoes':
      return pools.shoes.length;
    case 'bag':
      return pools.bags.length;
    case 'accessory':
      return pools.accessories.length + pools.jewelry.length;
    default:
      return 0;
  }
}

function scoreCandidateItem(
  item: WardrobeItem,
  params: AssemblyParams,
  concept: OutfitConcept,
  palette: PlannedPalette,
  role: Parameters<typeof scoreItemForConcept>[2],
  anchor: ItemStylingProfile | null,
  selected: ItemStylingProfile[],
): number {
  const profile = analyzeWardrobeItem(toStylingItem(item));
  let score = scoreItemForConcept(item, concept, role);
  const paletteWeight = role === 'shoes' || role === 'bag' ? 2.2 : 1.5;
  score += scoreItemPaletteFit(item, palette) * paletteWeight;
  score += scoreHotWeatherItem(toStylingItem(item), params.weather, params.selectedOccasion);
  score += scoreItemUsageDiversity(
    toStylingItem(item),
    params.recentOutfitSets ?? [],
    new Set(params.recentItemIds ?? []),
    slotPoolSizeForRole(params.pools, role),
  );
  if (role === 'shoes') {
    score += scoreFootwearWeatherPreference(item, params.weather);
    score += scoreShoeRegenerateDiversity(item, {
      regenerate: params.regenerate,
      previousShoeId: params.previousShoeId,
      previousShoeCategory: params.previousShoeCategory,
      slotPoolSize: params.pools.shoes.length,
    });
  }
  if (role === 'bottom') {
    score += scoreShortsRegenerateDiversity(item, {
      regenerate: params.regenerate,
      previousHadShorts: params.previousHadShorts,
      poolSize: params.pools.bottoms.length,
    });
  }
  if (role === 'accessory' || role === 'bag') {
    score += scoreAccessoryPickBias(
      toStylingItem(item),
      params.selectedOccasion,
      concept.allowWatch && allowsWatchForOccasion(params.selectedOccasion, params.weather),
      allowsSunglassesForOccasion(params.selectedOccasion, params.weather),
    );
  }

  if (params.selectedOccasion) {
    const useCaseScore = scoreUseCaseOccasionMatch(item, params.selectedOccasion);
    const isUser = hasUserWardrobeMetadata(item);
    score += useCaseScore * (isUser ? 1.15 : 0.45);
    score += scoreWomenPieceForOccasion(item, profile, params.selectedOccasion) * (isUser ? 0.25 : 0.5);
    if (!isUser) {
      score += scoreOccasionAuthorityPreference(item, params.selectedOccasion, role) * 0.8;
    }
    const expectedCats =
      role === 'top'
        ? concept.topCategories
        : role === 'bottom'
          ? concept.bottomCategories
          : role === 'one_piece'
            ? concept.onePieceCategories
            : role === 'shoes'
              ? concept.shoeCategories
              : [];
    if (expectedCats.length > 0) {
      score += scoreMetadataProductTypeAlignment(item, expectedCats) * (isUser ? 1.2 : 0.3);
    }
  }

  if (anchor) {
    const formalityDelta = Math.abs(profile.formality - anchor.formality);
    if (formalityDelta <= 0.25) score += 2;
    else if (formalityDelta > 0.45) score -= 3;
  }

  const draftCtx: OutfitStylingContext = {
    ...stylingBase(params),
    anchor,
    selected,
    preferredTypes: [],
    seed: params.seed,
  };
  const heuristicWeight = hasUserWardrobeMetadata(item) ? 0.04 : 0.12;
  score += scorePieceCandidate(profile, draftCtx) * heuristicWeight;

  return score;
}

function rankPool(
  pool: WardrobeItem[],
  params: AssemblyParams,
  concept: OutfitConcept,
  palette: PlannedPalette,
  role: Parameters<typeof scoreItemForConcept>[2],
  anchor: ItemStylingProfile | null,
  selected: ItemStylingProfile[],
): WardrobeItem[] {
  const authorityRole = role as OccasionAssemblyRole;
  let eligible = filterPoolByOccasionAuthority(
    pool,
    params.selectedOccasion,
    authorityRole,
    params.weather,
  );
  eligible = filterWardrobeItemsForWeather(eligible, params.weather);
  if (role === 'bottom' && params.regenerate && params.previousHadShorts) {
    const nonShorts = eligible.filter((item) => !isShortsItem(item));
    if (nonShorts.length > 0) {
      eligible = nonShorts;
    }
  }

  let rankedPool = eligible;
  if (params.selectedOccasion && poolHasDirectUseCaseMatch(eligible, params.selectedOccasion)) {
    const direct = eligible.filter(
      (item) =>
        classifyUseCaseMatch(
          getEffectiveStyleProfile(item).useCases,
          params.selectedOccasion!,
        ) === 'direct',
    );
    const related = eligible.filter(
      (item) =>
        classifyUseCaseMatch(
          getEffectiveStyleProfile(item).useCases,
          params.selectedOccasion!,
        ) === 'related',
    );
    rankedPool = [...direct, ...related, ...eligible.filter((i) => !direct.includes(i) && !related.includes(i))];
  }

  const offset = params.seed % Math.max(1, rankedPool.length);
  const rotated = [...rankedPool.slice(offset), ...rankedPool.slice(0, offset)];
  return [...rotated]
    .map((item, index) => ({
      item,
      score: scoreCandidateItem(item, params, concept, palette, role, anchor, selected) - index * 0.03,
    }))
    .sort((a, b) => b.score - a.score)
    .map((e) => e.item);
}

function pickFromPool(
  pool: WardrobeItem[],
  params: AssemblyParams,
  concept: OutfitConcept,
  palette: PlannedPalette,
  role: Parameters<typeof scoreItemForConcept>[2],
  anchor: ItemStylingProfile | null,
  selected: ItemStylingProfile[],
): WardrobeItem | undefined {
  const ranked = rankPool(pool, params, concept, palette, role, anchor, selected);
  return ranked[0];
}

type FinishingPair = { shoes: WardrobeItem; bag?: WardrobeItem; score: number };

function pickFinishingPair(
  pools: WardrobePools,
  params: AssemblyParams,
  concept: OutfitConcept,
  palette: PlannedPalette,
  anchor: ItemStylingProfile,
  selected: ItemStylingProfile[],
  coreItems: WardrobeItem[],
): FinishingPair | null {
  const shoeCandidates = rankPool(pools.shoes, params, concept, palette, 'shoes', anchor, selected).slice(0, 6);
  const bagCandidates = concept.preferBag
    ? rankPool(pools.bags, params, concept, palette, 'bag', anchor, selected).slice(0, 5)
    : [];

  let best: FinishingPair | null = null;

  for (const shoes of shoeCandidates) {
    const shoeProfile = analyzeWardrobeItem(toStylingItem(shoes));
    const withShoe = [...selected, shoeProfile];
    const coreWithShoe: WardrobeItem[] = [...coreItems, shoes];

    if (bagCandidates.length === 0) {
      const reject = paletteRejectionReason(coreWithShoe, palette);
      const score =
        scoreCandidateItem(shoes, params, concept, palette, 'shoes', anchor, selected) +
        (reject ? -30 : 8);
      if (!best || score > best.score) {
        best = { shoes, score };
      }
      continue;
    }

    for (const bag of bagCandidates) {
      const bagProfile = analyzeWardrobeItem(toStylingItem(bag));
      const combined: WardrobeItem[] = [...coreWithShoe, bag];
      const reject = paletteRejectionReason(combined, palette);
      let score =
        scoreCandidateItem(shoes, params, concept, palette, 'shoes', anchor, selected) +
        scoreCandidateItem(bag, params, concept, palette, 'bag', anchor, withShoe);
      if (reject) score -= 35;
      else score += 10;
      const shoeBagFormality = Math.abs(shoeProfile.formality - bagProfile.formality);
      if (shoeBagFormality <= 0.3) score += 4;

      if (!best || score > best.score) {
        best = { shoes, bag, score };
      }
    }
  }

  return best;
}

function pickLimitedAccessoriesForConcept(
  pools: WardrobePools,
  params: AssemblyParams,
  concept: OutfitConcept,
  palette: PlannedPalette,
  anchor: ItemStylingProfile,
  selected: ItemStylingProfile[],
  maxCount: number,
  allowWatch: boolean,
): { jewelry?: WardrobeItem; accessory?: WardrobeItem } {
  if (maxCount <= 0) return {};
  const allowSunglasses = allowsSunglassesForOccasion(params.selectedOccasion, params.weather);
  const { jewelry: jewelryPool, accessories: accessoryPool } = pickAccessoryCandidates(
    pools,
    allowWatch,
    allowSunglasses,
  );

  const elegantOccasion =
    params.selectedOccasion === 'date' ||
    params.selectedOccasion === 'dinner' ||
    params.selectedOccasion === 'wedding';
  const jewelryFirst = jewelryPool.filter(
    (item) => item.itemType !== 'saat' && getEffectiveStyleProfile(item).category !== 'watch',
  );
  const combined = elegantOccasion
    ? [...jewelryFirst, ...accessoryPool, ...jewelryPool.filter((i) => i.itemType === 'saat')]
    : [...accessoryPool, ...jewelryFirst];
  if (combined.length === 0) return {};

  const ranked = rankPool(combined, params, concept, palette, 'accessory', anchor, selected);
  const first = ranked[0];
  if (!first) return {};

  const profile = getEffectiveStyleProfile(first);
  const isJewelry =
    first.itemType !== 'gozluk' &&
    profile.category !== 'sunglasses' &&
    (profile.slot === 'jewelry' || ['necklace', 'earrings', 'bracelet', 'watch'].includes(profile.category));
  const result: { jewelry?: WardrobeItem; accessory?: WardrobeItem } = isJewelry
    ? { jewelry: first }
    : { accessory: first };

  if (maxCount < 2) return result;
  const second = ranked.find((item) => item.id !== first.id);
  if (!second) return result;
  const secondProfile = getEffectiveStyleProfile(second);
  const secondIsJewelry =
    second.itemType !== 'gozluk' &&
    secondProfile.category !== 'sunglasses' &&
    (secondProfile.slot === 'jewelry' || ['necklace', 'earrings', 'bracelet', 'watch'].includes(secondProfile.category));
  if (secondIsJewelry) result.jewelry = second;
  else result.accessory = second;
  return result;
}

function piece(
  t: TranslationKeys,
  item: WardrobeItem,
  role: OutfitPieceRole,
  labelKey: 'top' | 'bottom' | 'dress' | 'shoes' | 'outerwear' | 'bag' | 'accessories' | 'jewelry',
): OutfitPiece {
  return {
    id: `${item.id}-${role}`,
    role,
    label: t.completeLook[labelKey],
    item,
  };
}

export function assembleOutfitWithConcept(
  params: AssemblyParams,
): ConceptAssemblyResult | null {
  const concept = selectOutfitConcept({
    occasion: params.selectedOccasion,
    weather: params.weather,
    seed: params.seed,
    attempt: params.attempt,
    regenerate: params.regenerate,
    previousConceptId: params.previousConceptId,
  });

  const structure = resolveConceptStructure(concept, params.pools, params.seed + params.attempt, {
    regenerate: params.regenerate,
    previousWasOnePiece: params.previousWasOnePiece,
  });
  const corePool = [
    ...params.pools.tops,
    ...params.pools.bottoms,
    ...params.pools.onePieces,
    ...params.wardrobe,
  ];
  const palette = planOutfitPalette({
    wardrobe: params.wardrobe,
    corePool,
    concept,
    seed: params.seed + params.attempt * 3,
    occasion: params.selectedOccasion,
    weather: params.weather,
    regenerate: params.regenerate,
    previousPaletteMode: params.previousPaletteMode as PlannedPalette['mode'] | undefined,
    paletteAttempt: params.regenerate ? params.attempt + 1 : 0,
  });

  const selected: ItemStylingProfile[] = [];
  const pieces: OutfitPiece[] = [];
  let rejectedReason: string | undefined;

  const allowWatch =
    concept.allowWatch && allowsWatchForOccasion(params.selectedOccasion, params.weather);
  const maxAccessories = maxAccessoriesForOccasion(params.selectedOccasion);

  if (structure === 'one_piece') {
    const onePiece = pickFromPool(
      params.pools.onePieces,
      params,
      concept,
      palette,
      'one_piece',
      null,
      selected,
    );
    if (!onePiece) {
      rejectedReason = 'no_one_piece_for_concept';
      logOutfitConceptDebug({
        occasion: params.selectedOccasion,
        weatherTemp: params.weather?.temperature,
        chosenConcept: concept.id,
        structure,
        paletteMode: palette.mode,
        paletteColors: formatPaletteColors(palette),
        coreItems: 'none',
        finishingItems: 'none',
        rejectedReason,
      });
      return null;
    }

    selected.push(analyzeWardrobeItem(toStylingItem(onePiece)));
    pieces.push(piece(params.t, onePiece, 'dress', 'dress'));
  } else {
    const topPool = params.pools.tops.filter(isRealTopItem);
    const top = pickFromPool(topPool, params, concept, palette, 'top', null, selected);
    if (!top) {
      rejectedReason = 'no_top_for_concept';
      logOutfitConceptDebug({
        occasion: params.selectedOccasion,
        weatherTemp: params.weather?.temperature,
        chosenConcept: concept.id,
        structure,
        paletteMode: palette.mode,
        paletteColors: formatPaletteColors(palette),
        coreItems: 'none',
        finishingItems: 'none',
        rejectedReason,
      });
      return null;
    }

    const anchor = analyzeWardrobeItem(toStylingItem(top));
    selected.push(anchor);
    pieces.push(piece(params.t, top, 'top', 'top'));

    const bottom = pickFromPool(params.pools.bottoms, params, concept, palette, 'bottom', anchor, selected);
    if (!bottom) {
      rejectedReason = 'no_bottom_for_concept';
      logOutfitConceptDebug({
        occasion: params.selectedOccasion,
        weatherTemp: params.weather?.temperature,
        chosenConcept: concept.id,
        structure,
        paletteMode: palette.mode,
        paletteColors: formatPaletteColors(palette),
        coreItems: top.name,
        finishingItems: 'none',
        rejectedReason,
      });
      return null;
    }
    selected.push(analyzeWardrobeItem(toStylingItem(bottom)));
    pieces.push(piece(params.t, bottom, 'bottom', 'bottom'));
  }

  const anchor = selected[0];
  const coreItems = pieces.map((p) => p.item);
  const paletteCheck = paletteRejectionReason(coreItems, palette);
  if (paletteCheck) {
    rejectedReason = paletteCheck;
  }

  const finishing = pickFinishingPair(params.pools, params, concept, palette, anchor, selected, coreItems);
  if (!finishing) {
    rejectedReason = rejectedReason ?? 'no_finishing_pair';
    logOutfitConceptDebug({
      occasion: params.selectedOccasion,
      weatherTemp: params.weather?.temperature,
      chosenConcept: concept.id,
      structure,
      paletteMode: palette.mode,
      paletteColors: formatPaletteColors(palette),
      coreItems: coreItems.map((i) => i.name).join(', '),
      finishingItems: 'none',
      rejectedReason,
    });
    return null;
  }

  selected.push(analyzeWardrobeItem(toStylingItem(finishing.shoes)));
  pieces.push(piece(params.t, finishing.shoes, 'shoes', 'shoes'));
  if (finishing.bag) {
    selected.push(analyzeWardrobeItem(toStylingItem(finishing.bag)));
    pieces.push(piece(params.t, finishing.bag, 'bag', 'bag'));
  }

  const hasRealTop = pieces.some((p) => p.role === 'top');
  const isDressPath = pieces.some((p) => p.role === 'dress');

  if (
    conceptAllowsOuterwear(concept, params.weather, params.intent, hasRealTop) &&
    !isDressPath
  ) {
    const isDressPath = pieces.some((p) => p.role === 'dress');
    const outerPool = filterOuterwearPoolForLayerRules(
      params.pools.outerwear.filter((item) => !isDressRuiningOuterwear(item, params.weather)),
      params.weather,
      isDressPath,
    );
    const outer = pickFromPool(outerPool, params, concept, palette, 'outerwear', anchor, selected);
    if (outer) {
      const profile = getEffectiveStyleProfile(outer);
      const heavy =
        ['blazer', 'coat', 'jacket'].includes(profile.category) &&
        params.weather &&
        params.weather.temperature >= 24 &&
        !params.weather.isRainy;
      if (!heavy || concept.allowOuterwear === 'smart') {
        selected.push(analyzeWardrobeItem(toStylingItem(outer)));
        pieces.push(piece(params.t, outer, 'outerwear', 'outerwear'));
      }
    }
  }

  const finishingItems = pickLimitedAccessoriesForConcept(
    params.pools,
    params,
    concept,
    palette,
    anchor,
    selected,
    maxAccessories,
    allowWatch,
  );
  if (finishingItems.accessory) {
    pieces.push(piece(params.t, finishingItems.accessory, 'accessory', 'accessories'));
  }
  if (finishingItems.jewelry) {
    pieces.push(piece(params.t, finishingItems.jewelry, 'jewelry', 'jewelry'));
  }

  const finalPaletteReject = paletteRejectionReason(
    pieces.map((p) => p.item),
    palette,
  );
  if (finalPaletteReject && !rejectedReason) {
    rejectedReason = finalPaletteReject;
  }

  logOutfitConceptDebug({
    occasion: params.selectedOccasion,
    weatherTemp: params.weather?.temperature,
    chosenConcept: concept.id,
    structure,
    paletteMode: palette.mode,
    paletteColors: formatPaletteColors(palette),
    coreItems: pieces
      .filter((p) => p.role === 'top' || p.role === 'bottom' || p.role === 'dress')
      .map((p) => p.item.name)
      .join(', '),
    finishingItems: pieces
      .filter((p) => p.role === 'shoes' || p.role === 'bag' || p.role === 'accessory' || p.role === 'jewelry')
      .map((p) => p.item.name)
      .join(', '),
    rejectedReason,
  });

  if (rejectedReason) {
    return null;
  }

  return { pieces, concept, structure, palette };
}
