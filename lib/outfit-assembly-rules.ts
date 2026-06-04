import type { OutfitPiece, WardrobeItem } from '@/lib/outfit-engine';
import type { StylingWardrobeItem } from '@/lib/outfit-styling-intelligence';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import type { WardrobeItemTypeId } from '@/i18n/types';
import type { WeatherSnapshot } from '@/lib/weather';
import {
  getEffectiveStyleProfile,
  isOnePieceItem,
  type WardrobeSlotId,
  type WardrobeStyleProfile,
} from '@/lib/wardrobe-style-profile';
import { isQaTestMode } from '@/lib/qa-test-mode';

const FINISHING_SLOTS = new Set<WardrobeSlotId>(['shoes', 'bag', 'accessory', 'jewelry']);
const CORE_TOP_SLOTS = new Set<WardrobeSlotId>(['top']);
const CORE_BOTTOM_SLOTS = new Set<WardrobeSlotId>(['bottom']);
const ONE_PIECE_SLOTS = new Set<WardrobeSlotId>(['dress', 'jumpsuit', 'set']);
const OUTERWEAR_SLOTS = new Set<WardrobeSlotId>(['outerwear']);

const OUTERWEAR_SUBCATEGORIES = new Set(['blazer', 'jacket', 'coat']);
const REAL_TOP_SUBCATEGORIES = new Set([
  't_shirt',
  'blouse',
  'shirt',
  'crop_top',
  'sweater',
  'cardigan',
]);

const ACCESSORY_ONLY_TYPES = new Set<WardrobeItemTypeId>([
  'saat',
  'kemer',
  'gozluk',
  'sapka',
  'aksesuar',
  'canta',
]);

const HOT_WEATHER_C = 29;

export type WardrobePools = {
  tops: WardrobeItem[];
  bottoms: WardrobeItem[];
  onePieces: WardrobeItem[];
  outerwear: WardrobeItem[];
  shoes: WardrobeItem[];
  bags: WardrobeItem[];
  jewelry: WardrobeItem[];
  accessories: WardrobeItem[];
};

export function getItemSlot(item: StylingWardrobeItem): WardrobeSlotId {
  return getEffectiveStyleProfile(item).slot;
}

export function partitionWardrobeBySlot(wardrobe: WardrobeItem[]): WardrobePools {
  const pools: WardrobePools = {
    tops: [],
    bottoms: [],
    onePieces: [],
    outerwear: [],
    shoes: [],
    bags: [],
    jewelry: [],
    accessories: [],
  };

  for (const item of wardrobe) {
    const profile = getEffectiveStyleProfile(item);
    const slot = profile.slot;
    if (ONE_PIECE_SLOTS.has(slot)) {
      pools.onePieces.push(item);
    } else if (CORE_TOP_SLOTS.has(slot)) {
      pools.tops.push(item);
    } else if (CORE_BOTTOM_SLOTS.has(slot)) {
      pools.bottoms.push(item);
    } else if (OUTERWEAR_SLOTS.has(slot)) {
      pools.outerwear.push(item);
    } else if (slot === 'shoes') {
      pools.shoes.push(item);
    } else if (slot === 'bag') {
      pools.bags.push(item);
    } else if (slot === 'jewelry') {
      pools.jewelry.push(item);
    } else if (slot === 'accessory') {
      pools.accessories.push(item);
    }
  }

  return pools;
}

export function isRealTopItem(item: StylingWardrobeItem): boolean {
  const profile = getEffectiveStyleProfile(item);
  if (!CORE_TOP_SLOTS.has(profile.slot)) return false;
  if (ACCESSORY_ONLY_TYPES.has(item.itemType)) return false;
  return REAL_TOP_SUBCATEGORIES.has(profile.category) || profile.slot === 'top';
}

export function isOuterwearLayer(item: StylingWardrobeItem): boolean {
  const profile = getEffectiveStyleProfile(item);
  return OUTERWEAR_SLOTS.has(profile.slot) || OUTERWEAR_SUBCATEGORIES.has(profile.category);
}

export function isFinishingItem(item: StylingWardrobeItem): boolean {
  const slot = getItemSlot(item);
  return FINISHING_SLOTS.has(slot);
}

export type CorePieceRoles = 'top' | 'bottom' | 'dress';

export function corePieceIdsFromOutfit(pieces: OutfitPiece[]): string[] {
  return pieces
    .filter((p) => p.role === 'top' || p.role === 'bottom' || p.role === 'dress')
    .map((p) => p.item.id);
}

export function coreOverlapRatio(current: string[], prior: string[]): number {
  if (current.length === 0 || prior.length === 0) return 0;
  const priorSet = new Set(prior);
  const shared = current.filter((id) => priorSet.has(id)).length;
  return shared / Math.max(current.length, prior.length);
}

export function maxAccessoriesForOccasion(occasion?: SelectedOccasionId): number {
  if (!occasion) return 2;
  switch (occasion) {
    case 'office':
    case 'daily':
    case 'shopping':
    case 'sport_walk':
    case 'travel':
      return 1;
    case 'date':
    case 'dinner':
    case 'wedding':
      return 2;
    case 'beach':
    case 'vacation':
      return 2;
    case 'coffee':
    case 'family_visit':
      return 1;
    default:
      return 1;
  }
}

export function allowsWatchForOccasion(occasion?: SelectedOccasionId, weather?: WeatherSnapshot): boolean {
  if (!occasion) return true;
  if (occasion === 'beach' || occasion === 'vacation') return false;
  if (weather && weather.temperature >= HOT_WEATHER_C) return false;
  if (occasion === 'sport_walk' || occasion === 'shopping') return false;
  return true;
}

export function validateOutfitStructure(
  pieces: OutfitPiece[],
  occasion?: SelectedOccasionId,
): { valid: boolean; reason?: string } {
  const ids = pieces.map((p) => p.item.id);
  if (new Set(ids).size !== ids.length) {
    return { valid: false, reason: 'duplicate_item' };
  }

  const roles = pieces.map((p) => p.role);
  const hasTop = roles.includes('top');
  const hasBottom = roles.includes('bottom');
  const hasDress = roles.includes('dress');
  const hasOuterwear = roles.includes('outerwear');

  for (const piece of pieces) {
    const slot = getItemSlot(piece.item);
    if (piece.role === 'top' && !isRealTopItem(piece.item)) {
      return { valid: false, reason: `invalid_top:${piece.item.itemType}` };
    }
    if (piece.role === 'bottom' && !CORE_BOTTOM_SLOTS.has(slot)) {
      return { valid: false, reason: `invalid_bottom:${piece.item.itemType}` };
    }
    if (piece.role === 'dress' && !ONE_PIECE_SLOTS.has(slot) && !isOnePieceItem(piece.item)) {
      return { valid: false, reason: `invalid_dress:${piece.item.itemType}` };
    }
    if (
      (piece.role === 'top' || piece.role === 'bottom' || piece.role === 'dress') &&
      isFinishingItem(piece.item)
    ) {
      return { valid: false, reason: `finishing_as_core:${piece.item.itemType}` };
    }
  }

  if (hasDress && (hasTop || hasBottom)) {
    return { valid: false, reason: 'dress_with_separates' };
  }

  if (hasDress) {
    // one-piece path: top/bottom already rejected above
  } else if (!hasTop || !hasBottom) {
    return { valid: false, reason: 'missing_top_or_bottom' };
  }

  if (hasOuterwear && !hasDress && !hasTop) {
    return { valid: false, reason: 'outerwear_without_top' };
  }

  const finishingCount =
    (roles.includes('accessory') ? 1 : 0) +
    (roles.includes('jewelry') ? 1 : 0) +
    (roles.includes('bag') ? 1 : 0);
  const maxFinishing = maxAccessoriesForOccasion(occasion) + 1;
  if (finishingCount > maxFinishing + 1) {
    return { valid: false, reason: 'too_many_finishing' };
  }

  const accessoryRoles = pieces.filter((p) => p.role === 'accessory' || p.role === 'jewelry');
  if (accessoryRoles.length > maxAccessoriesForOccasion(occasion)) {
    return { valid: false, reason: 'accessory_limit' };
  }

  if (!roles.includes('shoes') && pieces.length > 0) {
    return { valid: false, reason: 'missing_shoes' };
  }

  return { valid: true };
}

export function logInvalidOutfitCandidate(reason: string, attempt: number): void {
  if (!isQaTestMode() && !__DEV__) return;
  console.log(`[Stylove Outfit] Discarded invalid candidate (attempt ${attempt}): ${reason}`);
}

export function scoreItemUsageDiversity(
  item: StylingWardrobeItem,
  recentOutfitSets: string[][],
  recentItemIds: Set<string>,
): number {
  let score = 0;
  const id = item.id;
  const slot = getItemSlot(item);

  const recentUses = recentOutfitSets.slice(-3).filter((set) => set.includes(id)).length;
  if (recentItemIds.has(id)) score -= 12;
  if (recentUses >= 2) score -= 14;
  else if (recentUses === 1) score -= 6;

  if (slot === 'bag') {
    const bagUsesLast3 = recentOutfitSets.slice(-3).filter((set) =>
      set.some((pieceId) => {
        return pieceId === id;
      }),
    ).length;
    if (bagUsesLast3 >= 1) score -= 10;
  }

  const profile = getEffectiveStyleProfile(item);
  if (profile.category === 'watch' || item.itemType === 'saat') {
    const watchInLast2 = recentOutfitSets.slice(-2).some((set) =>
      set.some((pieceId) => pieceId === id),
    );
    if (watchInLast2) score -= 18;
  }

  const usesEver = recentOutfitSets.flat().filter((x) => x === id).length;
  if (usesEver === 0) score += 4;

  return score;
}

export function scoreHotWeatherItem(
  item: StylingWardrobeItem,
  weather?: WeatherSnapshot,
  occasion?: SelectedOccasionId,
): number {
  if (!weather || weather.temperature < HOT_WEATHER_C) return 0;
  const profile = getEffectiveStyleProfile(item);
  let score = 0;

  const lightBoost = new Set([
    't_shirt',
    'blouse',
    'shirt',
    'crop_top',
    'summer_dress',
    'shorts',
    'skirt',
    'sandal',
    'sneaker',
    'flat',
    'linen',
  ]);
  if (lightBoost.has(profile.category)) score += 8;
  if (profile.season === 'summer') score += 3;

  const heavyBan = new Set(['blazer', 'coat', 'jacket', 'sweater', 'boot', 'heel', 'tailored_trousers']);
  if (heavyBan.has(profile.category)) score -= 12;
  if (OUTERWEAR_SUBCATEGORIES.has(profile.category)) score -= 10;

  if (occasion === 'beach' || occasion === 'vacation' || occasion === 'shopping' || occasion === 'sport_walk') {
    if (profile.category === 'heel') score -= 14;
    if (profile.category === 'evening_dress') score -= 8;
  }

  const casualOccasions = new Set<SelectedOccasionId>(['daily', 'coffee', 'shopping', 'sport_walk']);
  if (occasion && casualOccasions.has(occasion)) {
    const officeLean = new Set(['blazer', 'tailored_trousers', 'office_dress', 'heel', 'coat', 'trench']);
    if (officeLean.has(profile.category)) score -= 14;
    if (profile.styleTags.includes('office') || profile.formality === 'office') score -= 10;
    if (profile.formality === 'formal' || profile.formality === 'elegant') score -= 6;
    if (OUTERWEAR_SUBCATEGORIES.has(profile.category) && (!weather || weather.temperature >= 22)) {
      score -= 12;
    }
  }

  return score;
}

export function scoreRegenerateCoreDiversity(
  coreIds: string[],
  recentCoreSets: string[][],
  regenerate?: boolean,
): number {
  if (!regenerate || recentCoreSets.length === 0 || coreIds.length === 0) return 0;
  const lastCore = recentCoreSets[recentCoreSets.length - 1];
  if (!lastCore?.length) return 0;

  const overlap = coreOverlapRatio(coreIds, lastCore);
  if (overlap >= 0.5) return -35;
  if (overlap >= 0.34) return -18;
  if (overlap === 0) return 6;
  return 2;
}

export function pickAccessoryCandidates(
  pools: WardrobePools,
  allowWatch: boolean,
): { jewelry: WardrobeItem[]; accessories: WardrobeItem[] } {
  const jewelry = allowWatch ? pools.jewelry : pools.jewelry.filter((i) => i.itemType !== 'saat');
  const accessories = pools.accessories.filter((i) => i.itemType !== 'saat');
  return { jewelry, accessories };
}

export function shouldPreferOnePiece(
  pools: WardrobePools,
  seed: number,
  occasion?: SelectedOccasionId,
): boolean {
  if (pools.onePieces.length === 0) return false;
  if (pools.tops.length === 0 && pools.bottoms.length === 0) return true;
  if (occasion === 'wedding' || occasion === 'dinner' || occasion === 'date') {
    return pools.onePieces.length > 0 && seed % 3 !== 0;
  }
  if (occasion === 'beach' || occasion === 'vacation') return seed % 2 === 0;
  return pools.onePieces.length > 0 && seed % 3 === 0;
}
