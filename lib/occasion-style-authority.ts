import type { WardrobeItemTypeId } from '@/i18n/types';
import type { OutfitPiece } from '@/lib/outfit-engine';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import { getEffectiveStyleProfile } from '@/lib/wardrobe-style-profile';
import type { WardrobeItem } from '@/lib/outfit-engine';
import type { WeatherSnapshot } from '@/lib/weather';

export type OccasionAssemblyRole =
  | 'top'
  | 'bottom'
  | 'one_piece'
  | 'shoes'
  | 'bag'
  | 'outerwear'
  | 'accessory';

/** Hard weather threshold — items visually unsuitable above this are excluded. */
export const HOT_WEATHER_HARD_C = 30;

const VACATION_STYLE_TAGS = new Set(['vacation', 'sporty', 'streetwear']);
const VACATION_USE_CASES = new Set(['beach', 'vacation', 'sport', 'walking']);

type OccasionAuthorityRules = {
  /** Hard-reject these profile categories for the given role (or any slot). */
  forbiddenCategories: Partial<Record<OccasionAssemblyRole | 'any', readonly string[]>>;
  /** Hard-reject these item types for the given role (or any slot). */
  forbiddenItemTypes?: Partial<Record<OccasionAssemblyRole | 'any', readonly WardrobeItemTypeId[]>>;
  /** Hard-reject items carrying these style tags. */
  forbiddenStyleTags?: readonly string[];
  /** Hard-reject items tagged for these use cases. */
  forbiddenUseCases?: readonly string[];
  /** Hard-reject sporty sneakers (sneaker + sporty/sport use case). */
  forbidSportSneakers?: boolean;
  /** Hard-reject all sneakers at this occasion. */
  forbidAllSneakers?: boolean;
};

const WEDDING_FORBIDDEN: OccasionAuthorityRules = {
  forbiddenCategories: {
    any: ['sandal', 'sneaker', 'boot', 'loafer', 'sunglasses', 'shorts', 'crop_top', 't_shirt'],
    shoes: ['sandal', 'sneaker', 'boot', 'loafer'],
    accessory: ['sunglasses', 'scarf'],
    bag: [],
  },
  forbiddenItemTypes: {
    any: ['gozluk', 'sapka', 'tisort', 'sort'],
    shoes: ['bot'],
    accessory: ['gozluk', 'sapka'],
  },
  forbiddenStyleTags: ['sporty', 'streetwear', 'vacation'],
  forbiddenUseCases: ['beach', 'vacation', 'sport', 'walking'],
  forbidSportSneakers: true,
  forbidAllSneakers: true,
};

const OFFICE_FORBIDDEN: OccasionAuthorityRules = {
  forbiddenCategories: {
    any: ['sandal', 'shorts', 'crop_top', 't_shirt', 'sunglasses'],
    shoes: ['sandal'],
    accessory: ['sunglasses'],
    top: ['crop_top', 't_shirt'],
  },
  forbiddenItemTypes: {
    any: ['gozluk', 'sapka', 'sort', 'tisort', 'hoodie', 'sweatshirt'],
    shoes: [],
    accessory: ['gozluk', 'sapka'],
  },
  forbiddenStyleTags: ['vacation', 'sporty'],
  forbiddenUseCases: ['beach', 'vacation'],
  forbidSportSneakers: true,
};

const DAILY_FORBIDDEN: OccasionAuthorityRules = {
  forbiddenCategories: {
    any: ['evening_dress', 'office_dress'],
    top: ['blazer'],
    outerwear: ['coat', 'trench'],
  },
  forbiddenItemTypes: {
    any: ['topuklu'],
  },
  forbiddenStyleTags: ['evening'],
  forbiddenUseCases: ['wedding'],
};

const COFFEE_FORBIDDEN: OccasionAuthorityRules = {
  forbiddenCategories: {
    any: ['evening_dress', 'office_dress', 'blazer', 'sunglasses'],
    shoes: ['sandal'],
    accessory: ['sunglasses'],
    top: [],
  },
  forbiddenItemTypes: {
    accessory: ['gozluk'],
  },
  forbiddenStyleTags: ['evening', 'formal'],
  forbiddenUseCases: ['wedding', 'office'],
};

const DINNER_DATE_FORBIDDEN: OccasionAuthorityRules = {
  forbiddenCategories: {
    any: ['sneaker', 'shorts', 'crop_top', 't_shirt', 'sunglasses'],
    shoes: ['sandal', 'sneaker'],
  },
  forbiddenItemTypes: {
    any: ['tisort', 'sort', 'gozluk'],
  },
  forbidSportSneakers: true,
  forbidAllSneakers: true,
};

const OCCASION_AUTHORITY: Partial<Record<SelectedOccasionId, OccasionAuthorityRules>> = {
  wedding: WEDDING_FORBIDDEN,
  office: OFFICE_FORBIDDEN,
  daily: DAILY_FORBIDDEN,
  coffee: COFFEE_FORBIDDEN,
  dinner: DINNER_DATE_FORBIDDEN,
  date: DINNER_DATE_FORBIDDEN,
  beach: {
    forbiddenCategories: {
      any: ['heel', 'blazer', 'office_dress', 'evening_dress', 'boot', 'coat'],
      shoes: ['heel', 'boot', 'loafer'],
    },
    forbiddenItemTypes: { any: ['topuklu', 'ceket', 'kaban'] },
    forbiddenStyleTags: ['office', 'evening'],
    forbiddenUseCases: ['office', 'wedding'],
  },
  vacation: {
    forbiddenCategories: {
      any: ['blazer', 'office_dress', 'evening_dress', 'heel'],
      shoes: ['heel', 'boot'],
    },
    forbiddenStyleTags: ['office', 'evening'],
    forbiddenUseCases: ['office', 'wedding'],
  },
  sport_walk: {
    forbiddenCategories: {
      any: ['heel', 'evening_dress', 'office_dress', 'blazer'],
      shoes: ['heel', 'loafer'],
    },
    forbiddenItemTypes: { any: ['topuklu'] },
  },
  shopping: {
    forbiddenCategories: {
      any: ['evening_dress', 'heel'],
      shoes: ['heel'],
    },
  },
};

const HOT_WEATHER_FORBIDDEN_CATEGORIES = new Set([
  'blazer',
  'coat',
  'jacket',
  'sweater',
  'cardigan',
  'boot',
  'trench',
  'office_dress',
]);

const HOT_WEATHER_CASUAL_FORBIDDEN = new Set([
  ...HOT_WEATHER_FORBIDDEN_CATEGORIES,
  'heel',
  'tailored_trousers',
]);

const CASUAL_OCCASIONS = new Set<SelectedOccasionId>([
  'daily',
  'coffee',
  'shopping',
  'sport_walk',
  'beach',
  'vacation',
]);

function rulesForOccasion(occasion?: SelectedOccasionId): OccasionAuthorityRules | null {
  if (!occasion) return null;
  return OCCASION_AUTHORITY[occasion] ?? null;
}

function isSportSneaker(item: WardrobeItem): boolean {
  const profile = getEffectiveStyleProfile(item);
  if (profile.category !== 'sneaker') return false;
  return (
    profile.styleTags.includes('sporty') ||
    profile.useCases.includes('sport') ||
    profile.useCases.includes('walking')
  );
}

function isVacationItem(item: WardrobeItem): boolean {
  const profile = getEffectiveStyleProfile(item);
  return (
    profile.styleTags.some((tag) => VACATION_STYLE_TAGS.has(tag)) ||
    profile.useCases.some((uc) => VACATION_USE_CASES.has(uc))
  );
}

function categoryForbidden(
  rules: OccasionAuthorityRules,
  role: OccasionAssemblyRole,
  category: string,
): boolean {
  const roleCats = rules.forbiddenCategories[role] ?? [];
  const anyCats = rules.forbiddenCategories.any ?? [];
  return roleCats.includes(category) || anyCats.includes(category);
}

function typeForbidden(
  rules: OccasionAuthorityRules,
  role: OccasionAssemblyRole,
  itemType: WardrobeItemTypeId,
): boolean {
  const roleTypes = rules.forbiddenItemTypes?.[role] ?? [];
  const anyTypes = rules.forbiddenItemTypes?.any ?? [];
  return roleTypes.includes(itemType) || anyTypes.includes(itemType);
}

export function isWeatherHardForbidden(
  item: WardrobeItem,
  weather: WeatherSnapshot | undefined,
  occasion?: SelectedOccasionId,
): boolean {
  if (!weather || weather.temperature < HOT_WEATHER_HARD_C) return false;

  const profile = getEffectiveStyleProfile(item);
  const slot = profile.slot;

  if (weather.isRainy || weather.needsOuterwear) {
    if (slot === 'outerwear') return false;
  } else if (slot === 'outerwear') {
    return true;
  }

  const forbiddenSet =
    occasion && CASUAL_OCCASIONS.has(occasion)
      ? HOT_WEATHER_CASUAL_FORBIDDEN
      : HOT_WEATHER_FORBIDDEN_CATEGORIES;

  if (forbiddenSet.has(profile.category)) return true;

  if (
    occasion &&
    CASUAL_OCCASIONS.has(occasion) &&
    (profile.styleTags.includes('office') || profile.formality === 'office' || profile.formality === 'formal')
  ) {
    return true;
  }

  return false;
}

export function isItemForbiddenForOccasion(
  item: WardrobeItem,
  occasion: SelectedOccasionId | undefined,
  role: OccasionAssemblyRole,
  weather?: WeatherSnapshot,
): boolean {
  if (weather && isWeatherHardForbidden(item, weather, occasion)) return true;

  const rules = rulesForOccasion(occasion);
  if (!rules) return false;

  const profile = getEffectiveStyleProfile(item);

  if (categoryForbidden(rules, role, profile.category)) return true;
  if (typeForbidden(rules, role, item.itemType)) return true;

  if (rules.forbiddenStyleTags?.some((tag) => profile.styleTags.includes(tag as never))) return true;
  if (rules.forbiddenUseCases?.some((uc) => profile.useCases.includes(uc as never))) return true;

  if (rules.forbidAllSneakers && profile.category === 'sneaker') return true;
  if (rules.forbidSportSneakers && isSportSneaker(item)) return true;

  if (occasion === 'office' && isVacationItem(item)) return true;

  if (
    (occasion === 'wedding' || occasion === 'dinner' || occasion === 'date') &&
    profile.category === 'sneaker'
  ) {
    return true;
  }

  if (occasion === 'wedding' && (profile.category === 'sunglasses' || item.itemType === 'gozluk')) {
    return true;
  }

  if (
    (occasion === 'office' || occasion === 'wedding' || occasion === 'dinner' || occasion === 'date') &&
    profile.category === 'sandal'
  ) {
    return true;
  }

  if (occasion === 'wedding' && ['loafer', 'boot'].includes(profile.category)) return true;

  if (
    (occasion === 'daily' || occasion === 'coffee') &&
    ['blazer', 'office_dress', 'tailored_trousers'].includes(profile.category) &&
    profile.styleTags.includes('office')
  ) {
    return true;
  }

  return false;
}

export function filterPoolByOccasionAuthority(
  pool: WardrobeItem[],
  occasion: SelectedOccasionId | undefined,
  role: OccasionAssemblyRole,
  weather?: WeatherSnapshot,
): WardrobeItem[] {
  if (!occasion) return pool;
  return pool.filter((item) => !isItemForbiddenForOccasion(item, occasion, role, weather));
}

export function scoreOccasionAuthorityPreference(
  item: WardrobeItem,
  occasion: SelectedOccasionId,
  role: OccasionAssemblyRole,
): number {
  const profile = getEffectiveStyleProfile(item);
  let score = 0;

  switch (occasion) {
    case 'wedding':
      if (['heel', 'evening_dress', 'midi_dress', 'necklace', 'earrings'].includes(profile.category)) score += 8;
      if (profile.styleTags.includes('elegant') || profile.useCases.includes('wedding')) score += 6;
      if (role === 'bag' && profile.formality !== 'casual' && profile.formality !== 'sporty') score += 5;
      break;
    case 'office':
      if (['blouse', 'shirt', 'tailored_trousers', 'skirt', 'loafer', 'heel', 'flat'].includes(profile.category))
        score += 6;
      if (profile.styleTags.includes('office') || profile.useCases.includes('office')) score += 4;
      if (role === 'bag') score += 3;
      break;
    case 'daily':
      if (['t_shirt', 'crop_top', 'jeans', 'shorts', 'sneaker', 'flat', 'sandal'].includes(profile.category))
        score += 7;
      if (profile.styleTags.includes('casual') || profile.formality === 'casual') score += 5;
      if (['shirt', 'blouse'].includes(profile.category) && profile.formality !== 'office') score += 2;
      if (profile.styleTags.includes('office') || profile.formality === 'office') score -= 10;
      break;
    case 'coffee':
      if (['t_shirt', 'jeans', 'sneaker', 'flat', 'loafer'].includes(profile.category)) score += 6;
      if (profile.styleTags.includes('casual') || profile.styleTags.includes('smart_casual')) score += 5;
      if (profile.styleTags.includes('office')) score -= 8;
      if (['evening_dress', 'heel'].includes(profile.category)) score -= 12;
      break;
    default:
      break;
  }

  return score;
}

export function validateOccasionAuthority(
  pieces: OutfitPiece[],
  occasion?: SelectedOccasionId,
  weather?: WeatherSnapshot,
): { valid: boolean; reason?: string } {
  if (!occasion) return { valid: true };

  for (const piece of pieces) {
    const role = piece.role === 'jewelry' ? 'accessory' : piece.role;
    if (
      isItemForbiddenForOccasion(
        piece.item,
        occasion,
        role as OccasionAssemblyRole,
        weather,
      )
    ) {
      const profile = getEffectiveStyleProfile(piece.item);
      return {
        valid: false,
        reason: `occasion_forbidden:${occasion}:${role}:${profile.category}`,
      };
    }
  }

  return { valid: true };
}

export function getOccasionAuthoritySummary(occasion: SelectedOccasionId): {
  hardForbiddenCategories: string[];
  hardForbiddenTypes: WardrobeItemTypeId[];
  weatherHardAtC: number;
} {
  const rules = OCCASION_AUTHORITY[occasion];
  const cats = new Set<string>();
  const types = new Set<WardrobeItemTypeId>();

  if (rules) {
    for (const list of Object.values(rules.forbiddenCategories)) {
      for (const c of list ?? []) cats.add(c);
    }
    if (rules.forbiddenItemTypes) {
      for (const list of Object.values(rules.forbiddenItemTypes)) {
        for (const t of list ?? []) types.add(t);
      }
    }
  }

  return {
    hardForbiddenCategories: [...cats],
    hardForbiddenTypes: [...types],
    weatherHardAtC: HOT_WEATHER_HARD_C,
  };
}
