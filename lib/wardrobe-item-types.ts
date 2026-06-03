import type { WardrobeCategoryId, WardrobeItemTypeId } from '@/i18n/types';
import type { WardrobeItem } from '@/lib/outfit-engine';

/** Detailed types grouped for the add-piece picker (order preserved). */
export const WARDROBE_TYPE_GROUPS: ReadonlyArray<{
  category: WardrobeCategoryId;
  types: readonly WardrobeItemTypeId[];
}> = [
  {
    category: 'upper',
    types: ['tisort', 'gomlek', 'kazak', 'sweatshirt', 'hoodie'],
  },
  {
    category: 'outerwear',
    types: ['ceket', 'mont', 'trenchcoat', 'kaban'],
  },
  {
    category: 'bottom',
    types: ['pantolon', 'jean', 'sort', 'tayt', 'etek'],
  },
  {
    category: 'dress',
    types: ['elbise', 'takim'],
  },
  {
    category: 'shoes',
    types: ['ayakkabi', 'bot', 'topuklu'],
  },
  {
    category: 'bag',
    types: ['canta'],
  },
  {
    category: 'accessory',
    types: ['saat', 'kemer', 'sapka', 'gozluk', 'aksesuar'],
  },
];

const TYPE_TO_CATEGORY: Record<WardrobeItemTypeId, WardrobeCategoryId> = {
  tisort: 'upper',
  gomlek: 'upper',
  kazak: 'upper',
  sweatshirt: 'upper',
  hoodie: 'upper',
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
  takim: 'dress',
  ayakkabi: 'shoes',
  bot: 'shoes',
  topuklu: 'shoes',
  canta: 'bag',
  saat: 'accessory',
  kemer: 'accessory',
  sapka: 'accessory',
  gozluk: 'accessory',
  aksesuar: 'accessory',
};

const LEGACY_CATEGORY_TO_TYPE: Record<string, WardrobeItemTypeId> = {
  dresses: 'elbise',
  blazers: 'ceket',
  shoes: 'ayakkabi',
  bags: 'canta',
  accessories: 'aksesuar',
  jewelry: 'saat',
};

const LEGACY_CATEGORY_TO_ENGINE: Record<string, WardrobeCategoryId> = {
  dresses: 'dress',
  blazers: 'outerwear',
  shoes: 'shoes',
  bags: 'bag',
  accessories: 'accessory',
  jewelry: 'accessory',
};

export function getCategoryForItemType(itemType: WardrobeItemTypeId): WardrobeCategoryId {
  return TYPE_TO_CATEGORY[itemType];
}

export function normalizeWardrobeItem(item: WardrobeItem): WardrobeItem {
  const legacyCategory = item.category as string;
  let itemType = item.itemType;
  let category = item.category;

  if (!itemType) {
    if (LEGACY_CATEGORY_TO_TYPE[legacyCategory]) {
      itemType = LEGACY_CATEGORY_TO_TYPE[legacyCategory];
    } else if (TYPE_TO_CATEGORY[legacyCategory as WardrobeItemTypeId]) {
      itemType = legacyCategory as WardrobeItemTypeId;
    } else {
      itemType = 'aksesuar';
    }
  }

  if (LEGACY_CATEGORY_TO_ENGINE[legacyCategory]) {
    category = LEGACY_CATEGORY_TO_ENGINE[legacyCategory];
  } else if (!TYPE_TO_CATEGORY[category as WardrobeItemTypeId]) {
    category = getCategoryForItemType(itemType);
  }

  const imageUri = item.originalImageUri ?? item.imageUri;

  return {
    ...item,
    itemType,
    category,
    originalImageUri: imageUri,
    imageUri,
  };
}

export function normalizeWardrobeItems(items: WardrobeItem[]): WardrobeItem[] {
  return items.map(normalizeWardrobeItem);
}

export const WARDROBE_ENGINE_CATEGORIES: WardrobeCategoryId[] = [
  'upper',
  'outerwear',
  'bottom',
  'dress',
  'shoes',
  'bag',
  'accessory',
];
