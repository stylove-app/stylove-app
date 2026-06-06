import type { TranslationKeys } from '@/i18n/types';
import type { CuratedLook, OutfitPiece, WardrobeItem } from '@/lib/outfit-engine';
import { generateLook } from '@/lib/outfit-engine';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import { resolveSelectedOccasion } from '@/lib/selected-occasion';
import { scoreOutfitHarmonyLayer } from '@/lib/color-harmony-intelligence';
import { hasUserWardrobeMetadata } from '@/lib/wardrobe-metadata-authority';
import { scoreWomenPieceForOccasion } from '@/lib/women-outfit-scoring';
import {
  analyzeWardrobeItem,
  scoreOutfitPieces,
  type StylingWardrobeItem,
} from '@/lib/outfit-styling-intelligence';
import { countOutfitPieceDifference, outfitItemSignature, scoreOutfitPiecesWithBible } from '@/lib/styling-bible';
import { stylingComboSignature } from '@/lib/outfit-diversity';
import {
  filterShoesForWeatherContext,
  filterWardrobeItemsForWeather,
  shoeCategory,
} from '@/lib/layer-piece-rules';
import {
  isWearableOutfit,
  partitionWardrobeBySlot,
  validateOutfitStructure,
} from '@/lib/outfit-assembly-rules';
import type { WeatherSnapshot } from '@/lib/weather';
import type { StyleMemory } from '@/lib/style-memory';
import { isQaTestMode } from '@/lib/qa-test-mode';

const TRAVEL_OCCASION: SelectedOccasionId = 'travel';
const CANDIDATES_PER_DAY = 10;
const MAX_POOL_ATTEMPTS = 40;
const FALLBACK_POOL_ATTEMPTS = 32;
const BEAM_WIDTH = 48;

export type TravelOutfitCandidate = {
  pieces: OutfitPiece[];
  look: CuratedLook;
  qualityScore: number;
  itemSignature: string;
  comboSignature: string;
  topId?: string;
  bottomId?: string;
  dressId?: string;
  shoeId?: string;
  shoeCategory?: string;
  bagId?: string;
  outerwearId?: string;
};

export type TravelWardrobeAlternatives = {
  tops: number;
  bottoms: number;
  dresses: number;
  shoes: number;
  bags: number;
  outerwear: number;
  shoeCategories: number;
};

export type TravelPlannerDebugLog = {
  days: number;
  candidatesPerDay: number[];
  selectedOutfits: number;
  repeatedBags: number;
  repeatedShoes: number;
  repeatedTops: number;
  repeatedDresses: number;
  diversityScore: number;
  fallbackUsed: boolean;
};

type BeamState = {
  candidates: TravelOutfitCandidate[];
  score: number;
};

function toStylingItem(item: WardrobeItem): StylingWardrobeItem {
  return {
    id: item.id,
    name: item.name,
    itemType: item.itemType,
    category: item.category,
  };
}

function pieceIdByRole(pieces: OutfitPiece[], role: OutfitPiece['role']): string | undefined {
  return pieces.find((piece) => piece.role === role)?.item.id;
}

function buildCandidateFromLook(look: CuratedLook, weather?: WeatherSnapshot): TravelOutfitCandidate | null {
  const pieces = look.completeOutfit ?? [];
  if (!isWearableOutfit(pieces, TRAVEL_OCCASION, weather)) return null;

  const resolvedIntent = resolveSelectedOccasion(TRAVEL_OCCASION);
  const itemList = pieces.map((piece) => piece.item);
  const stylingWardrobe = itemList.map(toStylingItem);
  const harmony = scoreOutfitHarmonyLayer({
    items: itemList,
    selectedOccasion: TRAVEL_OCCASION,
    resolvedIntent,
    weather,
  });
  const bibleScore = scoreOutfitPiecesWithBible(
    pieces,
    { mood: look.mood, weather, intent: look.occasion, resolvedIntent },
    stylingWardrobe,
    { recentOutfitSets: [], seenSignatures: new Set<string>() },
  );
  const coherence = scoreOutfitPieces(pieces, {
    mood: look.mood,
    weather,
    intent: look.occasion,
    resolvedIntent,
  });

  let qualityScore = harmony.total * 0.55 + bibleScore * 0.2 + coherence * 0.08;
  for (const piece of pieces) {
    const profile = analyzeWardrobeItem(toStylingItem(piece.item));
    const metadataWeight = hasUserWardrobeMetadata(piece.item) ? 0.14 : 0.06;
    qualityScore += scoreWomenPieceForOccasion(piece.item, profile, TRAVEL_OCCASION) * metadataWeight;
  }

  const shoePiece = pieces.find((piece) => piece.role === 'shoes');
  return {
    pieces,
    look,
    qualityScore,
    itemSignature: outfitItemSignature(pieces.map((piece) => piece.item.id)),
    comboSignature: stylingComboSignature(pieces),
    topId: pieceIdByRole(pieces, 'top'),
    bottomId: pieceIdByRole(pieces, 'bottom'),
    dressId: pieceIdByRole(pieces, 'dress'),
    shoeId: shoePiece?.item.id,
    shoeCategory: shoePiece ? shoeCategory(shoePiece.item) : undefined,
    bagId: pieceIdByRole(pieces, 'bag'),
    outerwearId: pieceIdByRole(pieces, 'outerwear'),
  };
}

function wardrobeAlternativesForWeather(
  wardrobe: WardrobeItem[],
  weather: WeatherSnapshot,
): TravelWardrobeAlternatives {
  const filtered = filterWardrobeItemsForWeather(wardrobe, weather);
  const pools = partitionWardrobeBySlot(filtered);
  const shoes = filterShoesForWeatherContext(pools.shoes, weather);
  const shoeCategories = new Set(shoes.map((shoe) => shoeCategory(shoe)));
  return {
    tops: pools.tops.length,
    bottoms: pools.bottoms.length,
    dresses: pools.onePieces.length,
    shoes: shoes.length,
    bags: pools.bags.length,
    outerwear: pools.outerwear.length,
    shoeCategories: shoeCategories.size,
  };
}

function generateDayCandidatePool(
  t: TranslationKeys,
  params: {
    day: number;
    baseSeed: number;
    wardrobe: WardrobeItem[];
    weather: WeatherSnapshot;
    styleMemory?: StyleMemory;
    travelIntent: string;
    targetCount: number;
  },
): TravelOutfitCandidate[] {
  const seenItemSigs = new Set<string>();
  const seenComboSigs = new Set<string>();
  const pool: TravelOutfitCandidate[] = [];

  for (let attempt = 0; attempt < MAX_POOL_ATTEMPTS && pool.length < params.targetCount; attempt += 1) {
    const look = generateLook(t, {
      intent: params.travelIntent,
      wardrobe: params.wardrobe,
      weather: params.weather,
      seed: params.baseSeed + attempt * 41 + params.day * 13,
      styleMemory: params.styleMemory,
      selectedOccasion: TRAVEL_OCCASION,
      displayOccasion: t.home.occasions.travel.title,
      diversitySource: 'engine',
    });

    const candidate = buildCandidateFromLook(look, params.weather);
    if (!candidate) continue;
    if (seenItemSigs.has(candidate.itemSignature)) continue;
    if (seenComboSigs.has(candidate.comboSignature)) continue;

    seenItemSigs.add(candidate.itemSignature);
    seenComboSigs.add(candidate.comboSignature);
    pool.push(candidate);
  }

  if (pool.length === 0) {
    for (let attempt = 0; attempt < FALLBACK_POOL_ATTEMPTS; attempt += 1) {
      const look = generateLook(t, {
        intent: params.travelIntent,
        wardrobe: params.wardrobe,
        weather: params.weather,
        seed: params.baseSeed + 5003 + attempt * 53,
        styleMemory: params.styleMemory,
        selectedOccasion: TRAVEL_OCCASION,
        displayOccasion: t.home.occasions.travel.title,
        diversitySource: 'engine',
      });

      const candidate = buildCandidateFromLook(look, params.weather);
      if (!candidate) continue;
      if (!seenItemSigs.has(candidate.itemSignature)) {
        seenItemSigs.add(candidate.itemSignature);
      }
      pool.push(candidate);
      break;
    }
  }

  pool.sort((a, b) => b.qualityScore - a.qualityScore);
  return pool;
}

function hasDuplicateExactOutfit(candidates: TravelOutfitCandidate[]): boolean {
  const signatures = new Set<string>();
  for (const candidate of candidates) {
    if (signatures.has(candidate.itemSignature)) return true;
    signatures.add(candidate.itemSignature);
  }
  return false;
}

function hardRejectTravelSet(candidates: TravelOutfitCandidate[], weatherByDay: WeatherSnapshot[]): boolean {
  if (candidates.length === 0) return true;
  if (hasDuplicateExactOutfit(candidates)) return true;

  for (let i = 0; i < candidates.length; i += 1) {
    const validation = validateOutfitStructure(
      candidates[i].pieces,
      TRAVEL_OCCASION,
      weatherByDay[i],
    );
    if (!validation.valid) return true;
    if (!isWearableOutfit(candidates[i].pieces, TRAVEL_OCCASION, weatherByDay[i])) return true;
  }

  return false;
}

function scorePairDiversity(
  prev: TravelOutfitCandidate,
  curr: TravelOutfitCandidate,
  alternatives: TravelWardrobeAlternatives,
  consecutive: boolean,
): number {
  let score = 0;
  const consecutiveMultiplier = consecutive ? 1 : 0.55;

  if (prev.comboSignature === curr.comboSignature) {
    score -= consecutive ? 120 : 80;
  }

  const itemDiff = countOutfitPieceDifference(
    prev.pieces.map((piece) => piece.item.id),
    curr.pieces.map((piece) => piece.item.id),
  );
  if (itemDiff < 2) score -= consecutive ? 72 : 42;
  else if (itemDiff >= 4) score += consecutive ? 10 : 6;
  else if (itemDiff >= 3) score += consecutive ? 6 : 4;

  if (prev.topId && curr.topId && prev.topId === curr.topId) {
    score -= (alternatives.tops >= 2 ? 34 : 12) * consecutiveMultiplier;
  } else if (prev.topId && curr.topId && prev.topId !== curr.topId) {
    score += 8 * consecutiveMultiplier;
  }

  if (prev.dressId && curr.dressId && prev.dressId === curr.dressId) {
    score -= (alternatives.dresses >= 2 ? 38 : 12) * consecutiveMultiplier;
  } else if (prev.dressId && curr.dressId && prev.dressId !== curr.dressId) {
    score += 10 * consecutiveMultiplier;
  }

  if (prev.bottomId && curr.bottomId && prev.bottomId === curr.bottomId) {
    score -= (alternatives.bottoms >= 2 ? 30 : 10) * consecutiveMultiplier;
  } else if (prev.bottomId && curr.bottomId && prev.bottomId !== curr.bottomId) {
    score += 7 * consecutiveMultiplier;
  }

  if (prev.shoeId && curr.shoeId && prev.shoeId === curr.shoeId) {
    score -= (alternatives.shoes >= 2 ? 52 : 14) * consecutiveMultiplier;
  } else if (prev.shoeId && curr.shoeId && prev.shoeId !== curr.shoeId) {
    score += 14 * consecutiveMultiplier;
  }

  if (prev.bagId && curr.bagId && prev.bagId === curr.bagId) {
    score -= (alternatives.bags >= 2 ? 46 : 12) * consecutiveMultiplier;
  } else if (prev.bagId && curr.bagId && prev.bagId !== curr.bagId) {
    score += 12 * consecutiveMultiplier;
  }

  if (prev.outerwearId && curr.outerwearId && prev.outerwearId === curr.outerwearId) {
    score -= (alternatives.outerwear >= 2 ? 22 : 6) * consecutiveMultiplier;
  } else if (prev.outerwearId && curr.outerwearId && prev.outerwearId !== curr.outerwearId) {
    score += 5 * consecutiveMultiplier;
  }

  if (
    prev.shoeCategory &&
    curr.shoeCategory &&
    prev.shoeCategory === curr.shoeCategory &&
    alternatives.shoeCategories >= 2
  ) {
    score -= consecutive ? 36 : 18;
  } else if (
    prev.shoeCategory &&
    curr.shoeCategory &&
    prev.shoeCategory !== curr.shoeCategory &&
    alternatives.shoeCategories >= 2
  ) {
    score += consecutive ? 18 : 10;
  }

  return score;
}

function scoreTravelOutfitSet(
  candidates: TravelOutfitCandidate[],
  alternativesByDay: TravelWardrobeAlternatives[],
): number {
  if (candidates.length === 0) return -Infinity;

  let score = candidates.reduce((sum, candidate) => sum + candidate.qualityScore, 0);

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const alternatives = alternativesByDay[j] ?? alternativesByDay[i];
      score += scorePairDiversity(candidates[i], candidates[j], alternatives, j === i + 1);
    }
  }

  const usedTops = new Set(candidates.map((c) => c.topId).filter(Boolean));
  const usedDresses = new Set(candidates.map((c) => c.dressId).filter(Boolean));
  const usedShoes = new Set(candidates.map((c) => c.shoeId).filter(Boolean));
  const usedBags = new Set(candidates.map((c) => c.bagId).filter(Boolean));
  const maxTops = Math.max(...alternativesByDay.map((alt) => alt.tops), 0);
  const maxDresses = Math.max(...alternativesByDay.map((alt) => alt.dresses), 0);
  const maxShoes = Math.max(...alternativesByDay.map((alt) => alt.shoes), 0);
  const maxBags = Math.max(...alternativesByDay.map((alt) => alt.bags), 0);

  if (maxTops >= 2) score += usedTops.size * 6;
  if (maxDresses >= 2) score += usedDresses.size * 7;
  if (maxShoes >= 2) score += usedShoes.size * 10;
  if (maxBags >= 2) score += usedBags.size * 8;

  const shoeCategories = candidates.map((c) => c.shoeCategory).filter(Boolean) as string[];
  const uniqueShoeCategories = new Set(shoeCategories);
  const maxShoeCategories = Math.max(...alternativesByDay.map((alt) => alt.shoeCategories), 0);
  if (maxShoeCategories >= 2 && uniqueShoeCategories.size >= 2) {
    score += uniqueShoeCategories.size * 12;
  }

  return score;
}

function selectBestTravelSet(
  dayPools: TravelOutfitCandidate[][],
  alternativesByDay: TravelWardrobeAlternatives[],
  weatherByDay: WeatherSnapshot[],
): { selected: TravelOutfitCandidate[]; fallbackUsed: boolean } {
  let beam: BeamState[] = [{ candidates: [], score: 0 }];

  for (let dayIndex = 0; dayIndex < dayPools.length; dayIndex += 1) {
    const pool = dayPools[dayIndex];
    if (pool.length === 0) continue;

    const nextBeam: BeamState[] = [];
    for (const state of beam) {
      for (const candidate of pool) {
        const nextCandidates = [...state.candidates, candidate];
        if (hardRejectTravelSet(nextCandidates, weatherByDay.slice(0, nextCandidates.length))) {
          continue;
        }
        nextBeam.push({
          candidates: nextCandidates,
          score: scoreTravelOutfitSet(nextCandidates, alternativesByDay.slice(0, nextCandidates.length)),
        });
      }
    }

    if (nextBeam.length === 0) {
      const priorStates = beam.length > 0 ? beam : [{ candidates: [], score: 0 }];
      let rescued: BeamState | undefined;
      for (const state of priorStates) {
        for (const candidate of pool) {
          const merged = [...state.candidates, candidate];
          if (hardRejectTravelSet(merged, weatherByDay.slice(0, merged.length))) continue;
          const mergedScore = scoreTravelOutfitSet(merged, alternativesByDay.slice(0, merged.length));
          if (!rescued || mergedScore > rescued.score) {
            rescued = { candidates: merged, score: mergedScore };
          }
        }
      }
      if (rescued) {
        beam = [rescued];
        continue;
      }
    }

    nextBeam.sort((a, b) => b.score - a.score);
    beam = nextBeam.slice(0, BEAM_WIDTH);
  }

  const nonEmptyDays = dayPools.filter((pool) => pool.length > 0).length;
  if (beam.length > 0 && beam[0].candidates.length >= nonEmptyDays && nonEmptyDays > 0) {
    return { selected: beam[0].candidates, fallbackUsed: false };
  }

  const greedy: TravelOutfitCandidate[] = [];
  const usedItemSigs = new Set<string>();
  for (let dayIndex = 0; dayIndex < dayPools.length; dayIndex += 1) {
    const pool = dayPools[dayIndex];
    if (pool.length === 0) continue;

    let best: TravelOutfitCandidate | undefined;
    let bestScore = -Infinity;
    for (const candidate of pool) {
      if (usedItemSigs.has(candidate.itemSignature)) continue;
      const trial = [...greedy, candidate];
      const trialScore = scoreTravelOutfitSet(trial, alternativesByDay.slice(0, trial.length));
      if (trialScore > bestScore) {
        bestScore = trialScore;
        best = candidate;
      }
    }

    if (!best) {
      best = pool.find((candidate) => !usedItemSigs.has(candidate.itemSignature)) ?? pool[0];
    }
    if (best) {
      greedy.push(best);
      usedItemSigs.add(best.itemSignature);
    }
  }

  return { selected: greedy, fallbackUsed: true };
}

function countRoleRepeats(candidates: TravelOutfitCandidate[], role: 'bag' | 'shoe' | 'top' | 'dress'): number {
  const ids: (string | undefined)[] = candidates.map((candidate) => {
    switch (role) {
      case 'bag':
        return candidate.bagId;
      case 'shoe':
        return candidate.shoeId;
      case 'top':
        return candidate.topId;
      case 'dress':
        return candidate.dressId;
      default:
        return undefined;
    }
  });

  const counts = new Map<string, number>();
  for (const id of ids) {
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.values()].filter((count) => count > 1).length;
}

function borrowValidCandidateForDay(
  dayPools: TravelOutfitCandidate[][],
  weather: WeatherSnapshot,
): TravelOutfitCandidate | null {
  for (const pool of dayPools) {
    for (const candidate of pool) {
      if (isWearableOutfit(candidate.pieces, TRAVEL_OCCASION, weather)) {
        return candidate;
      }
    }
  }
  return null;
}

export function logTravelPlannerDebug(log: TravelPlannerDebugLog): void {
  if (!isQaTestMode() && !__DEV__) return;
  console.log('[Stylove Travel Planner]', {
    days: log.days,
    candidatesPerDay: log.candidatesPerDay.join(','),
    selectedOutfits: log.selectedOutfits,
    repeatedBags: log.repeatedBags,
    repeatedShoes: log.repeatedShoes,
    repeatedTops: log.repeatedTops,
    repeatedDresses: log.repeatedDresses,
    diversityScore: log.diversityScore,
    fallbackUsed: log.fallbackUsed,
  });
}

export function planTravelDailyOutfits(
  t: TranslationKeys,
  params: {
    duration: number;
    baseSeed: number;
    wardrobe: WardrobeItem[];
    weatherByDay: WeatherSnapshot[];
    styleMemory?: StyleMemory;
    travelIntent: string;
  },
): {
  selected: TravelOutfitCandidate[];
  candidatesPerDay: number[];
  diversityScore: number;
  fallbackUsed: boolean;
} {
  const dayPools: TravelOutfitCandidate[][] = [];
  const alternativesByDay: TravelWardrobeAlternatives[] = [];

  for (let index = 0; index < params.duration; index += 1) {
    const weather = params.weatherByDay[index % params.weatherByDay.length];
    alternativesByDay.push(wardrobeAlternativesForWeather(params.wardrobe, weather));
    const pool = generateDayCandidatePool(t, {
      day: index + 1,
      baseSeed: params.baseSeed + index * 97,
      wardrobe: params.wardrobe,
      weather,
      styleMemory: params.styleMemory,
      travelIntent: params.travelIntent,
      targetCount: CANDIDATES_PER_DAY,
    });
    if (pool.length === 0) {
      const borrowed = borrowValidCandidateForDay(dayPools, weather);
      dayPools.push(borrowed ? [borrowed] : pool);
    } else {
      dayPools.push(pool);
    }
  }

  let fallbackUsed = false;
  for (let index = 0; index < dayPools.length; index += 1) {
    if (dayPools[index].length === 0) {
      const borrowed = borrowValidCandidateForDay(dayPools, params.weatherByDay[index]);
      if (borrowed) {
        dayPools[index] = [borrowed];
        fallbackUsed = true;
      }
    }
  }

  const selection = selectBestTravelSet(dayPools, alternativesByDay, params.weatherByDay);
  const selected = selection.selected;
  fallbackUsed = fallbackUsed || selection.fallbackUsed;
  const diversityScore = scoreTravelOutfitSet(selected, alternativesByDay.slice(0, selected.length));
  const candidatesPerDay = dayPools.map((pool) => pool.length);

  logTravelPlannerDebug({
    days: params.duration,
    candidatesPerDay,
    selectedOutfits: selected.length,
    repeatedBags: countRoleRepeats(selected, 'bag'),
    repeatedShoes: countRoleRepeats(selected, 'shoe'),
    repeatedTops: countRoleRepeats(selected, 'top'),
    repeatedDresses: countRoleRepeats(selected, 'dress'),
    diversityScore: Math.round(diversityScore),
    fallbackUsed,
  });

  return { selected, candidatesPerDay, diversityScore, fallbackUsed };
}
