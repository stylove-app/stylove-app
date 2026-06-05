import type { WardrobeCategoryId, WardrobeItemTypeId } from '@/i18n/types';
import type { WardrobeItem } from '@/lib/outfit-engine';

export type WardrobeSlotId =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'jumpsuit'
  | 'set'
  | 'outerwear'
  | 'shoes'
  | 'bag'
  | 'accessory'
  | 'jewelry';

export type WardrobeFormalityTag =
  | 'casual'
  | 'smart_casual'
  | 'office'
  | 'elegant'
  | 'formal'
  | 'sporty';

export type WardrobeStyleProfile = {
  genderMode: 'women';
  slot: WardrobeSlotId;
  category: string;
  color: string;
  colorFamily: string;
  styleTags: string[];
  useCases: string[];
  season: string;
  formality: WardrobeFormalityTag;
  isOnePiece: boolean;
  isStatementPiece: boolean;
};

export type WardrobeColorId =
  | 'black'
  | 'white'
  | 'cream'
  | 'beige'
  | 'camel'
  | 'gray'
  | 'navy'
  | 'blue'
  | 'denim_blue'
  | 'brown'
  | 'burgundy'
  | 'red'
  | 'pink'
  | 'dusty_rose'
  | 'lavender'
  | 'purple'
  | 'green'
  | 'sage'
  | 'olive'
  | 'emerald'
  | 'yellow'
  | 'orange'
  | 'gold'
  | 'silver'
  | 'multicolor';

export type WardrobeStyleTagId =
  | 'casual'
  | 'smart_casual'
  | 'office'
  | 'elegant'
  | 'evening'
  | 'vacation'
  | 'sporty'
  | 'minimal'
  | 'classic'
  | 'romantic'
  | 'streetwear';

export type WardrobeSeasonId = 'summer' | 'winter' | 'spring_autumn' | 'all_season';

export type WardrobeUseCaseId =
  | 'daily'
  | 'office'
  | 'coffee'
  | 'dinner'
  | 'date'
  | 'wedding'
  | 'vacation'
  | 'beach'
  | 'shopping'
  | 'walking'
  | 'sport';

export const WARDROBE_SLOT_ORDER: WardrobeSlotId[] = [
  'top',
  'bottom',
  'dress',
  'jumpsuit',
  'set',
  'outerwear',
  'shoes',
  'bag',
  'accessory',
  'jewelry',
];

export const WARDROBE_COLOR_IDS: WardrobeColorId[] = [
  'black',
  'white',
  'cream',
  'beige',
  'camel',
  'gray',
  'navy',
  'blue',
  'denim_blue',
  'brown',
  'burgundy',
  'red',
  'pink',
  'dusty_rose',
  'lavender',
  'purple',
  'green',
  'sage',
  'olive',
  'emerald',
  'yellow',
  'orange',
  'gold',
  'silver',
  'multicolor',
];

export const WARDROBE_STYLE_TAG_IDS: WardrobeStyleTagId[] = [
  'casual',
  'smart_casual',
  'office',
  'elegant',
  'evening',
  'vacation',
  'sporty',
  'minimal',
  'classic',
  'romantic',
  'streetwear',
];

export const WARDROBE_SEASON_IDS: WardrobeSeasonId[] = [
  'summer',
  'winter',
  'spring_autumn',
  'all_season',
];

export const WARDROBE_USE_CASE_IDS: WardrobeUseCaseId[] = [
  'daily',
  'office',
  'coffee',
  'dinner',
  'date',
  'wedding',
  'vacation',
  'beach',
  'shopping',
  'walking',
  'sport',
];

/** Home-aligned usage places shown on the upload/profile form (multi-select). */
export const WARDROBE_UPLOAD_USE_CASE_ORDER: WardrobeUseCaseId[] = [
  'daily',
  'office',
  'coffee',
  'shopping',
  'date',
  'dinner',
  'wedding',
  'beach',
];

export const WARDROBE_SUBCATEGORIES: Record<WardrobeSlotId, readonly string[]> = {
  top: [
    't_shirt',
    'blouse',
    'shirt',
    'crop_top',
    'sweater',
    'cardigan',
  ],
  bottom: [
    'jeans',
    'tailored_trousers',
    'wide_leg_trousers',
    'skirt',
    'shorts',
  ],
  dress: [
    'day_dress',
    'midi_dress',
    'mini_dress',
    'evening_dress',
    'office_dress',
    'summer_dress',
  ],
  jumpsuit: ['jumpsuit'],
  set: ['matching_set'],
  outerwear: ['blazer', 'jacket', 'coat'],
  shoes: ['sneaker', 'heel', 'loafer', 'boot', 'sandal', 'flat'],
  bag: ['bag'],
  accessory: ['belt', 'sunglasses', 'scarf', 'accessory'],
  jewelry: ['watch', 'necklace', 'earrings'],
};

/** Flat product-type list for upload form (single-select). */
export const WARDROBE_UPLOAD_PRODUCT_ORDER: readonly string[] = [
  't_shirt',
  'shirt',
  'blouse',
  'crop_top',
  'sweater',
  'cardigan',
  'jeans',
  'tailored_trousers',
  'skirt',
  'shorts',
  'midi_dress',
  'matching_set',
  'sneaker',
  'loafer',
  'heel',
  'sandal',
  'boot',
  'bag',
  'belt',
  'watch',
  'sunglasses',
  'earrings',
  'necklace',
];

const SUBCATEGORY_TO_SLOT: Record<string, WardrobeSlotId> = Object.fromEntries(
  Object.entries(WARDROBE_SUBCATEGORIES).flatMap(([slot, subs]) =>
    subs.map((sub) => [sub, slot as WardrobeSlotId]),
  ),
) as Record<string, WardrobeSlotId>;

export function slotForSubcategory(subcategory: string): WardrobeSlotId {
  return SUBCATEGORY_TO_SLOT[subcategory] ?? 'accessory';
}

const ONE_PIECE_SLOTS = new Set<WardrobeSlotId>(['dress', 'jumpsuit', 'set']);

const COLOR_FAMILY: Record<WardrobeColorId, string> = {
  black: 'neutral',
  white: 'neutral',
  cream: 'neutral',
  beige: 'neutral',
  camel: 'neutral',
  gray: 'neutral',
  navy: 'neutral',
  blue: 'blue',
  denim_blue: 'blue',
  brown: 'brown',
  burgundy: 'red',
  red: 'red',
  pink: 'pink',
  dusty_rose: 'pink',
  lavender: 'purple',
  purple: 'purple',
  green: 'green',
  sage: 'green',
  olive: 'green',
  emerald: 'green',
  yellow: 'yellow',
  orange: 'orange',
  gold: 'gold',
  silver: 'silver',
  multicolor: 'multicolor',
};

const SUBCATEGORY_TO_ITEM_TYPE: Record<string, WardrobeItemTypeId> = {
  t_shirt: 'tisort',
  blouse: 'gomlek',
  shirt: 'gomlek',
  crop_top: 'tisort',
  sweater: 'kazak',
  cardigan: 'kazak',
  blazer: 'ceket',
  jacket: 'ceket',
  coat: 'kaban',
  jeans: 'jean',
  tailored_trousers: 'pantolon',
  wide_leg_trousers: 'pantolon',
  skirt: 'etek',
  shorts: 'sort',
  day_dress: 'elbise',
  midi_dress: 'elbise',
  mini_dress: 'elbise',
  evening_dress: 'elbise',
  office_dress: 'elbise',
  summer_dress: 'elbise',
  jumpsuit: 'elbise',
  matching_set: 'takim',
  sneaker: 'ayakkabi',
  heel: 'topuklu',
  loafer: 'ayakkabi',
  boot: 'bot',
  sandal: 'ayakkabi',
  flat: 'ayakkabi',
  bag: 'canta',
  watch: 'saat',
  necklace: 'aksesuar',
  earrings: 'aksesuar',
  belt: 'kemer',
  sunglasses: 'gozluk',
  scarf: 'aksesuar',
  accessory: 'aksesuar',
};

const SLOT_TO_ENGINE_CATEGORY: Record<WardrobeSlotId, WardrobeCategoryId> = {
  top: 'upper',
  bottom: 'bottom',
  dress: 'dress',
  jumpsuit: 'dress',
  set: 'dress',
  outerwear: 'outerwear',
  shoes: 'shoes',
  bag: 'bag',
  accessory: 'accessory',
  jewelry: 'accessory',
};

const FORMALITY_SCORE: Record<WardrobeFormalityTag, number> = {
  casual: 0.35,
  smart_casual: 0.55,
  office: 0.78,
  elegant: 0.88,
  formal: 0.92,
  sporty: 0.2,
};

export function slotIsOnePiece(slot: WardrobeSlotId): boolean {
  return ONE_PIECE_SLOTS.has(slot);
}

export function engineCategoryForSlot(slot: WardrobeSlotId): WardrobeCategoryId {
  return SLOT_TO_ENGINE_CATEGORY[slot];
}

export function itemTypeForSubcategory(subcategory: string): WardrobeItemTypeId {
  return SUBCATEGORY_TO_ITEM_TYPE[subcategory] ?? 'aksesuar';
}

export function formalityScore(tag: WardrobeFormalityTag): number {
  return FORMALITY_SCORE[tag];
}

export type BuildStyleProfileInput = {
  slot: WardrobeSlotId;
  subcategory: string;
  color: WardrobeColorId;
  styleTags: WardrobeStyleTagId[];
  season: WardrobeSeasonId;
  useCases: WardrobeUseCaseId[];
  formality: WardrobeFormalityTag;
  isStatementPiece?: boolean;
};

export function buildStyleProfile(input: BuildStyleProfileInput): WardrobeStyleProfile {
  const isOnePiece = slotIsOnePiece(input.slot);
  return {
    genderMode: 'women',
    slot: input.slot,
    category: input.subcategory,
    color: input.color,
    colorFamily: COLOR_FAMILY[input.color],
    styleTags: [...input.styleTags],
    useCases: [...input.useCases],
    season: input.season,
    formality: input.formality,
    isOnePiece,
    isStatementPiece: input.isStatementPiece ?? false,
  };
}

const SPORTY_SUBCATEGORIES = new Set(['sneaker', 'shorts', 'crop_top', 't_shirt']);
const ELEGANT_SUBCATEGORIES = new Set(['heel', 'evening_dress', 'necklace', 'earrings']);
const OFFICE_SUBCATEGORIES = new Set(['shirt', 'blouse', 'tailored_trousers', 'office_dress', 'loafer']);
const SUMMER_LEAN_SUBCATEGORIES = new Set(['sandal', 'shorts', 'crop_top', 't_shirt', 'summer_dress']);

/** Derives hidden style_profile fields from product type + usage places (upload form). */
export function deriveUploadStyleDefaults(
  subcategory: string,
  useCases: WardrobeUseCaseId[],
): Pick<BuildStyleProfileInput, 'styleTags' | 'season' | 'formality'> {
  const tags = new Set<WardrobeStyleTagId>();

  for (const useCase of useCases) {
    switch (useCase) {
      case 'daily':
      case 'shopping':
        tags.add('casual');
        break;
      case 'office':
        tags.add('office');
        break;
      case 'coffee':
        tags.add('smart_casual');
        break;
      case 'date':
        tags.add('romantic');
        tags.add('elegant');
        break;
      case 'dinner':
      case 'wedding':
        tags.add('evening');
        tags.add('elegant');
        break;
      case 'beach':
        tags.add('vacation');
        break;
      default:
        break;
    }
  }

  if (tags.size === 0) tags.add('casual');

  let formality: WardrobeFormalityTag = 'smart_casual';
  if (SPORTY_SUBCATEGORIES.has(subcategory)) {
    formality = useCases.includes('office') ? 'smart_casual' : 'casual';
  } else if (ELEGANT_SUBCATEGORIES.has(subcategory)) {
    formality = 'elegant';
  } else if (OFFICE_SUBCATEGORIES.has(subcategory) && useCases.includes('office')) {
    formality = 'office';
  } else if (useCases.includes('wedding') || useCases.includes('dinner')) {
    formality = 'elegant';
  } else if (useCases.includes('office')) {
    formality = 'office';
  } else if (useCases.includes('daily') || useCases.includes('beach') || useCases.includes('shopping')) {
    formality = 'casual';
  }

  const season: WardrobeSeasonId = SUMMER_LEAN_SUBCATEGORIES.has(subcategory)
    ? 'summer'
    : subcategory === 'sweater' || subcategory === 'boot'
      ? 'spring_autumn'
      : 'all_season';

  return { styleTags: [...tags], season, formality };
}

export type BuildStyleProfileFromUploadInput = {
  subcategory: string;
  color: WardrobeColorId;
  useCases: WardrobeUseCaseId[];
};

export function buildStyleProfileFromUpload(input: BuildStyleProfileFromUploadInput): WardrobeStyleProfile {
  const slot = slotForSubcategory(input.subcategory);
  const derived = deriveUploadStyleDefaults(input.subcategory, input.useCases);
  return buildStyleProfile({
    slot,
    subcategory: input.subcategory,
    color: input.color,
    styleTags: derived.styleTags,
    season: derived.season,
    useCases: input.useCases,
    formality: derived.formality,
    isStatementPiece: false,
  });
}

export function deriveItemTypeFromProfile(profile: WardrobeStyleProfile): WardrobeItemTypeId {
  return itemTypeForSubcategory(profile.category);
}

export function deriveEngineCategoryFromProfile(profile: WardrobeStyleProfile): WardrobeCategoryId {
  return engineCategoryForSlot(profile.slot);
}

const LEGACY_ITEM_TYPE_SLOT: Partial<Record<WardrobeItemTypeId, WardrobeSlotId>> = {
  tisort: 'top',
  gomlek: 'top',
  kazak: 'top',
  sweatshirt: 'top',
  hoodie: 'top',
  ceket: 'outerwear',
  mont: 'outerwear',
  trenchcoat: 'outerwear',
  kaban: 'outerwear',
  pantolon: 'bottom',
  jean: 'bottom',
  sort: 'bottom',
  tayt: 'bottom',
  etek: 'bottom',
  elbise: 'dress',
  takim: 'set',
  ayakkabi: 'shoes',
  bot: 'shoes',
  topuklu: 'shoes',
  canta: 'bag',
  saat: 'jewelry',
  kemer: 'accessory',
  sapka: 'accessory',
  gozluk: 'accessory',
  aksesuar: 'accessory',
};

const LEGACY_SUBCATEGORY: Partial<Record<WardrobeItemTypeId, string>> = {
  tisort: 't_shirt',
  gomlek: 'blouse',
  kazak: 'sweater',
  pantolon: 'tailored_trousers',
  jean: 'jeans',
  etek: 'skirt',
  elbise: 'midi_dress',
  takim: 'matching_set',
  ayakkabi: 'flat',
  topuklu: 'heel',
  bot: 'boot',
};

export type StyleProfileSourceItem = {
  itemType: WardrobeItem['itemType'];
  name: string;
  styleProfile?: WardrobeStyleProfile;
};

/** Fallback when DB/local item has no style_profile (legacy uploads). */
export function fallbackStyleProfileFromItem(item: StyleProfileSourceItem): WardrobeStyleProfile {
  if (item.styleProfile?.genderMode === 'women') {
    return item.styleProfile;
  }

  const slot = LEGACY_ITEM_TYPE_SLOT[item.itemType] ?? 'top';
  const subcategory = LEGACY_SUBCATEGORY[item.itemType] ?? 'accessory';
  const formality: WardrobeFormalityTag =
    item.itemType === 'elbise' || item.itemType === 'topuklu'
      ? 'elegant'
      : item.itemType === 'pantolon' || item.itemType === 'gomlek'
        ? 'office'
        : item.itemType === 'jean' || item.itemType === 'tisort'
          ? 'casual'
          : 'smart_casual';

  return buildStyleProfile({
    slot,
    subcategory,
    color: 'black',
    styleTags: [formality === 'casual' ? 'casual' : 'smart_casual'],
    season: 'all_season',
    useCases: ['daily'],
    formality,
    isStatementPiece: false,
  });
}

export function getEffectiveStyleProfile(item: StyleProfileSourceItem): WardrobeStyleProfile {
  if (item.styleProfile?.genderMode === 'women') {
    return item.styleProfile;
  }
  return fallbackStyleProfileFromItem(item);
}

export function isOnePieceItem(item: WardrobeItem): boolean {
  return getEffectiveStyleProfile(item).isOnePiece;
}
