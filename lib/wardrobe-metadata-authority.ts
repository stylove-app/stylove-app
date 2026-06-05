import type { SelectedOccasionId } from '@/lib/selected-occasion';
import type { WardrobeItem } from '@/lib/outfit-engine';
import {
  deriveItemTypeFromProfile,
  getEffectiveStyleProfile,
  itemTypeForSubcategory,
  type StyleProfileSourceItem,
  type WardrobeUseCaseId,
} from '@/lib/wardrobe-style-profile';

/** Home occasion → wardrobe use_case id (user upload vocabulary). */
export const OCCASION_TO_USE_CASE: Partial<Record<SelectedOccasionId, WardrobeUseCaseId>> = {
  daily: 'daily',
  office: 'office',
  coffee: 'coffee',
  shopping: 'shopping',
  date: 'date',
  dinner: 'dinner',
  wedding: 'wedding',
  beach: 'beach',
};

/** Controlled fallback when no direct use_case match exists in the wardrobe. */
export const RELATED_USE_CASE_FALLBACK: Partial<Record<SelectedOccasionId, WardrobeUseCaseId[]>> = {
  office: ['date', 'dinner'],
  date: ['dinner', 'coffee'],
  coffee: ['daily', 'shopping'],
  shopping: ['daily'],
  wedding: ['dinner'],
  beach: ['daily'],
  daily: ['coffee', 'shopping'],
  dinner: ['date', 'wedding', 'office'],
};

/** Never treat these use_cases as acceptable fallback for the occasion. */
export const INCOMPATIBLE_USE_CASES_BY_OCCASION: Partial<
  Record<SelectedOccasionId, readonly WardrobeUseCaseId[]>
> = {
  wedding: ['beach', 'shopping', 'sport', 'walking', 'vacation'],
  office: ['beach', 'vacation', 'sport', 'walking'],
  beach: ['office', 'wedding', 'dinner'],
  dinner: ['beach', 'sport', 'walking'],
  date: ['beach', 'sport', 'walking'],
};

export type UseCaseMatchTier = 'direct' | 'related' | 'neutral' | 'incompatible';

const SCORE_DIRECT_MATCH = 34;
const SCORE_RELATED_MATCH = 12;
const SCORE_NEUTRAL = -16;
const SCORE_INCOMPATIBLE = -38;

const SCORE_LEGACY_DIRECT = 8;
const SCORE_LEGACY_RELATED = 3;
const SCORE_LEGACY_NEUTRAL = -4;
const SCORE_LEGACY_INCOMPATIBLE = -12;

/** True when the item has persisted user/profile metadata (not runtime legacy synthesis). */
export function hasUserWardrobeMetadata(item: StyleProfileSourceItem): boolean {
  const profile = item.styleProfile;
  return Boolean(profile?.genderMode === 'women' && profile.useCases.length > 0);
}

export function occasionTargetUseCase(occasion: SelectedOccasionId): WardrobeUseCaseId | null {
  return (OCCASION_TO_USE_CASE as Partial<Record<SelectedOccasionId, WardrobeUseCaseId>>)[occasion] ?? null;
}

export function classifyUseCaseMatch(
  useCases: readonly string[],
  occasion: SelectedOccasionId,
): UseCaseMatchTier {
  const target = occasionTargetUseCase(occasion);
  if (!target) return 'neutral';

  const set = new Set(useCases);
  if (set.has(target)) return 'direct';

  const incompatible = INCOMPATIBLE_USE_CASES_BY_OCCASION[occasion] ?? [];
  if (incompatible.some((uc) => set.has(uc))) return 'incompatible';

  const related = RELATED_USE_CASE_FALLBACK[occasion as keyof typeof RELATED_USE_CASE_FALLBACK] ?? [];
  if (related.some((uc) => set.has(uc))) return 'related';

  return 'neutral';
}

export function scoreUseCaseOccasionMatch(
  item: StyleProfileSourceItem,
  occasion: SelectedOccasionId | undefined,
): number {
  if (!occasion) return 0;

  const profile = getEffectiveStyleProfile(item);
  const tier = classifyUseCaseMatch(profile.useCases, occasion);
  const isUser = hasUserWardrobeMetadata(item);

  if (isUser) {
    switch (tier) {
      case 'direct':
        return SCORE_DIRECT_MATCH;
      case 'related':
        return SCORE_RELATED_MATCH;
      case 'incompatible':
        return SCORE_INCOMPATIBLE;
      default:
        return SCORE_NEUTRAL;
    }
  }

  switch (tier) {
    case 'direct':
      return SCORE_LEGACY_DIRECT;
    case 'related':
      return SCORE_LEGACY_RELATED;
    case 'incompatible':
      return SCORE_LEGACY_INCOMPATIBLE;
    default:
      return SCORE_LEGACY_NEUTRAL;
  }
}

/** Authoritative product category from user upload metadata. */
export function authoritativeProductCategory(item: StyleProfileSourceItem): string {
  const profile = getEffectiveStyleProfile(item);
  return profile.category;
}

/** Authoritative color id from user upload metadata. */
export function authoritativeProductColor(item: StyleProfileSourceItem): string {
  const profile = getEffectiveStyleProfile(item);
  return profile.color;
}

/**
 * Authoritative engine item type — derived from stored product_type (category), not image/name.
 */
export function authoritativeItemType(item: StyleProfileSourceItem): WardrobeItem['itemType'] {
  const profile = getEffectiveStyleProfile(item);
  if (hasUserWardrobeMetadata(item)) {
    return itemTypeForSubcategory(profile.category);
  }
  return deriveItemTypeFromProfile(profile);
}

export function poolHasDirectUseCaseMatch(
  pool: WardrobeItem[],
  occasion: SelectedOccasionId | undefined,
): boolean {
  if (!occasion) return false;
  return pool.some((item) => classifyUseCaseMatch(getEffectiveStyleProfile(item).useCases, occasion) === 'direct');
}

export function scoreMetadataProductTypeAlignment(
  item: StyleProfileSourceItem,
  expectedCategories: readonly string[],
): number {
  if (!hasUserWardrobeMetadata(item)) return 0;
  const cat = authoritativeProductCategory(item);
  if (expectedCategories.includes(cat)) return 6;
  return -4;
}
