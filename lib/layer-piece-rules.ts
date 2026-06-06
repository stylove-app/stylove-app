import type { OutfitPiece } from '@/lib/outfit-engine';
import type { WardrobeItem } from '@/lib/outfit-engine';
import { getEffectiveStyleProfile } from '@/lib/wardrobe-style-profile';
import type { WeatherSnapshot } from '@/lib/weather';

export type LayerPieceCategory =
  | 'blazer'
  | 'jacket'
  | 'trenchcoat'
  | 'coat'
  | 'cardigan'
  | 'mont';

export const LAYER_PIECE_CATEGORIES = new Set<LayerPieceCategory>([
  'blazer',
  'jacket',
  'trenchcoat',
  'coat',
  'cardigan',
  'mont',
]);

export const BASE_TOP_CATEGORIES = new Set([
  't_shirt',
  'shirt',
  'blouse',
  'crop_top',
  'sweater',
]);

/** Normal / cool band — light layers only. */
export const COOL_WEATHER_MIN_C = 13;
export const COOL_WEATHER_MAX_C = 18;

/** Cold band — heavy layers, sweater, boots. */
export const COLD_WEATHER_MAX_C = 15;

/** Warm — no heavy garments above this. */
export const WARM_WEATHER_MIN_C = 18;

export const SHORTS_MIN_TEMP_C = 30;
export const LAYER_DRESS_EXCEPTION_TEMP_C = 18;

const LIGHT_OUTERWEAR = new Set(['cardigan', 'blazer', 'jacket']);
const HEAVY_OUTERWEAR = new Set(['trenchcoat', 'coat', 'mont']);

const WARM_BANNED_CATEGORIES = new Set([
  'cardigan',
  'blazer',
  'jacket',
  'trenchcoat',
  'coat',
  'mont',
  'boot',
  'sweater',
]);

export function normalizeLayerCategory(category: string): string {
  if (category === 'denim_jacket') return 'jacket';
  return category;
}

export function isLayerPieceCategory(category: string): category is LayerPieceCategory {
  return LAYER_PIECE_CATEGORIES.has(normalizeLayerCategory(category) as LayerPieceCategory);
}

export function isLayerPieceItem(item: WardrobeItem): boolean {
  const profile = getEffectiveStyleProfile(item);
  if (isLayerPieceCategory(profile.category)) return true;
  if (profile.slot === 'outerwear' && (item.itemType === 'trenchcoat' || item.itemType === 'mont')) {
    return true;
  }
  return false;
}

export function isBaseTopCategory(category: string): boolean {
  return BASE_TOP_CATEGORIES.has(category);
}

export function isShortsCategory(category: string): boolean {
  return category === 'shorts';
}

export function isShortsItem(item: WardrobeItem): boolean {
  return isShortsCategory(getEffectiveStyleProfile(item).category);
}

export function shoeCategory(item: WardrobeItem): string {
  return getEffectiveStyleProfile(item).category;
}

export function isBootItem(item: WardrobeItem): boolean {
  const profile = getEffectiveStyleProfile(item);
  return profile.category === 'boot' || item.itemType === 'bot';
}

function isRainyOrSnowy(weather: WeatherSnapshot): boolean {
  return (
    weather.isRainy ||
    weather.condition === 'snow' ||
    ['rain', 'drizzle', 'snow'].includes(weather.condition)
  );
}

export function itemAllowedForWeather(item: WardrobeItem, weather?: WeatherSnapshot): boolean {
  if (!weather) return true;

  const profile = getEffectiveStyleProfile(item);
  const category = normalizeLayerCategory(profile.category);
  const temp = weather.temperature;
  const rainy = isRainyOrSnowy(weather);

  if (isShortsCategory(category)) {
    return temp >= SHORTS_MIN_TEMP_C && !rainy;
  }

  if (isBootItem(item)) {
    return temp <= COLD_WEATHER_MAX_C;
  }

  if (category === 'sweater') {
    if (temp > WARM_WEATHER_MIN_C) return false;
    return temp <= COLD_WEATHER_MAX_C;
  }

  if (HEAVY_OUTERWEAR.has(category)) {
    if (temp > WARM_WEATHER_MIN_C) return false;
    return temp <= COLD_WEATHER_MAX_C;
  }

  if (LIGHT_OUTERWEAR.has(category)) {
    if (temp > COOL_WEATHER_MAX_C || temp < COOL_WEATHER_MIN_C) return false;
    return true;
  }

  if (temp > WARM_WEATHER_MIN_C && WARM_BANNED_CATEGORIES.has(category)) {
    return false;
  }

  return true;
}

export function layerAllowedWithDress(weather?: WeatherSnapshot): boolean {
  if (!weather) return false;
  return isRainyOrSnowy(weather) || weather.temperature < LAYER_DRESS_EXCEPTION_TEMP_C;
}

export function layerPieceAllowedInContext(
  item: WardrobeItem,
  weather?: WeatherSnapshot,
  hasDress?: boolean,
): boolean {
  if (!isLayerPieceItem(item)) return true;
  if (!itemAllowedForWeather(item, weather)) return false;
  if (hasDress && !layerAllowedWithDress(weather)) return false;
  return true;
}

export function shoeAllowedInContext(item: WardrobeItem, weather?: WeatherSnapshot): boolean {
  return itemAllowedForWeather(item, weather);
}

export function filterLayerPiecesForContext(
  items: WardrobeItem[],
  weather?: WeatherSnapshot,
  hasDress?: boolean,
): WardrobeItem[] {
  return items.filter((item) => layerPieceAllowedInContext(item, weather, hasDress));
}

export function filterShoesForWeatherContext(
  items: WardrobeItem[],
  weather?: WeatherSnapshot,
): WardrobeItem[] {
  return items.filter((item) => shoeAllowedInContext(item, weather));
}

export function filterWardrobeItemsForWeather(
  items: WardrobeItem[],
  weather?: WeatherSnapshot,
): WardrobeItem[] {
  return items.filter((item) => itemAllowedForWeather(item, weather));
}

export function scoreFootwearWeatherPreference(
  item: WardrobeItem,
  weather?: WeatherSnapshot,
): number {
  if (!weather || !isBootItem(item)) return 0;

  if (weather.temperature > COLD_WEATHER_MAX_C) return -40;

  let score = 6;
  if (weather.temperature <= COLD_WEATHER_MAX_C && isRainyOrSnowy(weather)) {
    score += 10;
  }
  return score;
}

export function scoreShoeRegenerateDiversity(
  item: WardrobeItem,
  options?: {
    regenerate?: boolean;
    previousShoeId?: string;
    previousShoeCategory?: string;
    slotPoolSize?: number;
  },
): number {
  if (!options?.regenerate) return 0;
  let score = 0;
  const category = shoeCategory(item);
  const poolScale = options.slotPoolSize;

  if (options.previousShoeId && item.id === options.previousShoeId) {
    score -= poolScale && poolScale <= 2 ? 22 : 34;
    if (category === 'boot') score -= 12;
  } else if (
    options.previousShoeCategory &&
    category === options.previousShoeCategory
  ) {
    score -= poolScale && poolScale <= 2 ? 10 : 18;
    if (category === 'boot') score -= 8;
  }

  return score;
}

export function scoreShortsRegenerateDiversity(
  item: WardrobeItem,
  options?: {
    regenerate?: boolean;
    previousHadShorts?: boolean;
    poolSize?: number;
  },
): number {
  if (!options?.regenerate || !options.previousHadShorts || !isShortsItem(item)) return 0;
  const poolScale = options.poolSize;
  return poolScale && poolScale <= 2 ? -28 : -40;
}

function pieceLayerCategory(piece: OutfitPiece): LayerPieceCategory | null {
  const category = normalizeLayerCategory(getEffectiveStyleProfile(piece.item).category);
  return isLayerPieceCategory(category) ? category : null;
}

export function validateLayerPieceRules(
  pieces: OutfitPiece[],
  weather?: WeatherSnapshot,
): { valid: boolean; reason?: string } {
  const layerPieces = pieces.filter((piece) => pieceLayerCategory(piece) != null);
  if (layerPieces.length === 0) return { valid: true };

  const hasDress = pieces.some((piece) => piece.role === 'dress');
  if (hasDress && !layerAllowedWithDress(weather)) {
    return { valid: false, reason: 'layer_forbidden_with_dress' };
  }

  const baseTopCount = pieces.filter(
    (piece) =>
      piece.role === 'top' && isBaseTopCategory(getEffectiveStyleProfile(piece.item).category),
  ).length;

  const layerAsPrimaryTop = pieces.some(
    (piece) => piece.role === 'top' && pieceLayerCategory(piece) != null,
  );

  if (layerAsPrimaryTop) {
    return { valid: false, reason: 'layer_as_primary_top' };
  }

  if (baseTopCount === 0) {
    if (hasDress && layerAllowedWithDress(weather)) {
      return { valid: true };
    }
    return { valid: false, reason: 'layer_without_base_top' };
  }

  return { valid: true };
}

export function validateWardrobeWeatherRules(
  pieces: OutfitPiece[],
  weather?: WeatherSnapshot,
): { valid: boolean; reason?: string } {
  if (!weather) return { valid: true };

  for (const piece of pieces) {
    if (!itemAllowedForWeather(piece.item, weather)) {
      const category = getEffectiveStyleProfile(piece.item).category;
      if (isShortsCategory(category)) return { valid: false, reason: 'shorts_forbidden_weather' };
      if (isBootItem(piece.item)) return { valid: false, reason: 'boot_forbidden_warm_weather' };
      if (category === 'sweater') return { valid: false, reason: 'sweater_forbidden_warm_weather' };
      if (isLayerPieceCategory(category)) return { valid: false, reason: 'layer_forbidden_weather' };
      return { valid: false, reason: `weather_forbidden:${category}` };
    }
  }

  return { valid: true };
}

/** @deprecated Use validateWardrobeWeatherRules */
export function validateFootwearWeatherRules(
  pieces: OutfitPiece[],
  weather?: WeatherSnapshot,
): { valid: boolean; reason?: string } {
  if (!weather) return { valid: true };
  const hotBoot = pieces.find(
    (piece) => piece.role === 'shoes' && isBootItem(piece.item) && !itemAllowedForWeather(piece.item, weather),
  );
  if (hotBoot) return { valid: false, reason: 'boot_forbidden_warm_weather' };
  return { valid: true };
}
