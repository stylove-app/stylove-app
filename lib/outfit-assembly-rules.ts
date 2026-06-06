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
import {
  filterLayerPiecesForContext,
  isLayerPieceCategory,
  isLayerPieceItem,
  normalizeLayerCategory,
  validateLayerPieceRules,
  validateWardrobeWeatherRules,
} from '@/lib/layer-piece-rules';
import { HOT_WEATHER_HARD_C, validateOccasionAuthority } from '@/lib/occasion-style-authority';
import { scoreEnhancedItemUsageDiversity, scoreRegenerateCoreChange } from '@/lib/outfit-diversity';
import { isQaTestMode } from '@/lib/qa-test-mode';

const FINISHING_SLOTS = new Set<WardrobeSlotId>(['shoes', 'bag', 'accessory', 'jewelry']);
const CORE_TOP_SLOTS = new Set<WardrobeSlotId>(['top']);
const CORE_BOTTOM_SLOTS = new Set<WardrobeSlotId>(['bottom']);
const ONE_PIECE_SLOTS = new Set<WardrobeSlotId>(['dress', 'jumpsuit', 'set']);
const OUTERWEAR_SLOTS = new Set<WardrobeSlotId>(['outerwear']);

const OUTERWEAR_SUBCATEGORIES = new Set(['blazer', 'jacket', 'trenchcoat', 'coat', 'cardigan', 'mont']);
const REAL_TOP_SUBCATEGORIES = new Set([
  't_shirt',
  'blouse',
  'shirt',
  'crop_top',
  'sweater',
]);

const ACCESSORY_ONLY_TYPES = new Set<WardrobeItemTypeId>([
  'saat',
  'kemer',
  'gozluk',
  'sapka',
  'aksesuar',
  'canta',
]);

const HOT_WEATHER_C = HOT_WEATHER_HARD_C;

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
      if (isLayerPieceCategory(normalizeLayerCategory(profile.category))) {
        pools.outerwear.push(item);
      } else {
        pools.tops.push(item);
      }
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
  if (!occasion) return 1;
  switch (occasion) {
    case 'date':
    case 'dinner':
    case 'wedding':
      return 2;
    case 'beach':
    case 'vacation':
      return 1;
    case 'office':
    case 'daily':
    case 'shopping':
    case 'sport_walk':
    case 'travel':
    case 'coffee':
    case 'family_visit':
      return 1;
    default:
      return 1;
  }
}

export function allowsWatchForOccasion(occasion?: SelectedOccasionId, weather?: WeatherSnapshot): boolean {
  if (!occasion) return false;
  if (occasion === 'beach' || occasion === 'vacation') return false;
  if (weather && weather.temperature >= HOT_WEATHER_C) return false;
  if (
    occasion === 'sport_walk' ||
    occasion === 'shopping' ||
    occasion === 'daily' ||
    occasion === 'coffee' ||
    occasion === 'date' ||
    occasion === 'dinner' ||
    occasion === 'wedding'
  ) {
    return false;
  }
  return occasion === 'office' || occasion === 'family_visit' || occasion === 'travel';
}

export function allowsSunglassesForOccasion(
  occasion?: SelectedOccasionId,
  weather?: WeatherSnapshot,
): boolean {
  if (!occasion) return false;
  if (occasion === 'beach' || occasion === 'vacation') return true;
  if (occasion === 'shopping' && weather?.isDay) return true;
  if (weather && weather.temperature >= 22 && weather.isDay && occasion === 'daily') return true;
  return false;
}

export function isWearableOutfit(
  pieces: OutfitPiece[],
  occasion?: SelectedOccasionId,
  weather?: WeatherSnapshot,
): boolean {
  if (pieces.length === 0) return false;
  const structure = validateOutfitStructure(pieces, occasion, weather);
  if (!structure.valid) return false;

  const roles = pieces.map((piece) => piece.role);
  if (roles.includes('dress')) {
    return true;
  }
  return roles.includes('top') && roles.includes('bottom');
}

export function validateOutfitStructure(
  pieces: OutfitPiece[],
  occasion?: SelectedOccasionId,
  weather?: WeatherSnapshot,
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
    if (piece.role === 'top') {
      if (isLayerPieceItem(piece.item)) {
        return { valid: false, reason: `layer_as_primary_top:${piece.item.itemType}` };
      }
      if (!isRealTopItem(piece.item)) {
        return { valid: false, reason: `invalid_top:${piece.item.itemType}` };
      }
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

  const occasionFit = validateOccasionAuthority(pieces, occasion, weather);
  if (!occasionFit.valid) {
    return occasionFit;
  }

  const layerFit = validateLayerPieceRules(pieces, weather);
  if (!layerFit.valid) {
    return layerFit;
  }

  const weatherFit = validateWardrobeWeatherRules(pieces, weather);
  if (!weatherFit.valid) {
    return weatherFit;
  }

  return { valid: true };
}

export function filterOuterwearPoolForLayerRules(
  pool: WardrobeItem[],
  weather?: WeatherSnapshot,
  hasDress?: boolean,
): WardrobeItem[] {
  return filterLayerPiecesForContext(pool, weather, hasDress);
}

export function logInvalidOutfitCandidate(reason: string, attempt: number): void {
  if (!isQaTestMode() && !__DEV__) return;
  console.log(`[Stylove Outfit] Discarded invalid candidate (attempt ${attempt}): ${reason}`);
}

export function scoreItemUsageDiversity(
  item: StylingWardrobeItem,
  recentOutfitSets: string[][],
  recentItemIds: Set<string>,
  slotPoolSize?: number,
): number {
  return scoreEnhancedItemUsageDiversity(item, recentOutfitSets, recentItemIds, {
    slotPoolSize,
  });
}

export function scoreAccessoryPickBias(
  item: StylingWardrobeItem,
  occasion?: SelectedOccasionId,
  allowWatch?: boolean,
  allowSunglasses?: boolean,
): number {
  const profile = getEffectiveStyleProfile(item);
  let score = 0;

  if (item.itemType === 'saat' || profile.category === 'watch') {
    score -= allowWatch ? 10 : 36;
    if (occasion === 'office') score += 2;
  }

  if (item.itemType === 'gozluk' || profile.category === 'sunglasses') {
    score -= allowSunglasses ? 12 : 40;
  }

  if (['necklace', 'earrings', 'bracelet'].includes(profile.category)) {
    if (occasion === 'date' || occasion === 'dinner' || occasion === 'wedding') score += 10;
  }

  if (occasion === 'daily' || occasion === 'coffee' || occasion === 'shopping') {
    if (item.itemType === 'saat' || profile.category === 'watch') score -= 14;
    if (item.itemType === 'gozluk') score -= 18;
  }

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

  const heavyBan = new Set(['blazer', 'coat', 'jacket', 'mont', 'sweater', 'boot', 'heel', 'tailored_trousers', 'cardigan', 'trenchcoat']);
  if (heavyBan.has(profile.category)) score -= 18;
  if (OUTERWEAR_SUBCATEGORIES.has(profile.category)) score -= 16;
  if (profile.slot === 'outerwear') score -= 20;

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
  wardrobeHasAlternatives?: boolean,
): number {
  return scoreRegenerateCoreChange(coreIds, recentCoreSets, regenerate, wardrobeHasAlternatives);
}

export function pickAccessoryCandidates(
  pools: WardrobePools,
  allowWatch: boolean,
  allowSunglasses?: boolean,
): { jewelry: WardrobeItem[]; accessories: WardrobeItem[] } {
  const jewelry = allowWatch ? pools.jewelry : pools.jewelry.filter((i) => i.itemType !== 'saat');
  const accessories = pools.accessories.filter((i) => {
    if (i.itemType === 'saat') return false;
    if (i.itemType === 'gozluk' && !allowSunglasses) return false;
    const profile = getEffectiveStyleProfile(i);
    if (profile.category === 'sunglasses' && !allowSunglasses) return false;
    return true;
  });
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
