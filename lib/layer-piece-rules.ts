import type { OutfitPiece } from '@/lib/outfit-engine';
import type { WardrobeItem } from '@/lib/outfit-engine';
import { getEffectiveStyleProfile } from '@/lib/wardrobe-style-profile';
import type { WeatherSnapshot } from '@/lib/weather';

export type LayerPieceCategory = 'blazer' | 'jacket' | 'trenchcoat' | 'coat' | 'cardigan';

export const LAYER_PIECE_CATEGORIES = new Set<LayerPieceCategory>([
  'blazer',
  'jacket',
  'trenchcoat',
  'coat',
  'cardigan',
]);

export const BASE_TOP_CATEGORIES = new Set([
  't_shirt',
  'shirt',
  'blouse',
  'crop_top',
  'sweater',
]);

export const LAYER_FORBIDDEN_TEMP_C = 25;
export const LAYER_DRESS_EXCEPTION_TEMP_C = 18;
export const BOOT_FORBIDDEN_TEMP_C = 25;
export const BOOT_PREFERRED_TEMP_C = 13;

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
  if (profile.slot === 'outerwear' && item.itemType === 'trenchcoat') return true;
  return false;
}

export function isBaseTopCategory(category: string): boolean {
  return BASE_TOP_CATEGORIES.has(category);
}

export function shoeCategory(item: WardrobeItem): string {
  return getEffectiveStyleProfile(item).category;
}

export function isBootItem(item: WardrobeItem): boolean {
  const profile = getEffectiveStyleProfile(item);
  return profile.category === 'boot' || item.itemType === 'bot';
}

export function layerForbiddenAtTemperature(temperature: number): boolean {
  return temperature >= LAYER_FORBIDDEN_TEMP_C;
}

export function bootForbiddenAtTemperature(temperature: number): boolean {
  return temperature >= BOOT_FORBIDDEN_TEMP_C;
}

export function layerAllowedWithDress(weather?: WeatherSnapshot): boolean {
  if (!weather) return false;
  const rainy =
    weather.isRainy || ['rain', 'drizzle', 'snow'].includes(weather.condition);
  return rainy || weather.temperature < LAYER_DRESS_EXCEPTION_TEMP_C;
}

export function layerPieceAllowedInContext(
  item: WardrobeItem,
  weather?: WeatherSnapshot,
  hasDress?: boolean,
): boolean {
  if (!isLayerPieceItem(item)) return true;
  if (weather && layerForbiddenAtTemperature(weather.temperature)) return false;
  if (hasDress && !layerAllowedWithDress(weather)) return false;
  return true;
}

export function shoeAllowedInContext(item: WardrobeItem, weather?: WeatherSnapshot): boolean {
  if (!isBootItem(item)) return true;
  if (!weather) return true;
  return !bootForbiddenAtTemperature(weather.temperature);
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

export function scoreFootwearWeatherPreference(
  item: WardrobeItem,
  weather?: WeatherSnapshot,
): number {
  if (!weather) return 0;
  if (isBootItem(item)) {
    if (bootForbiddenAtTemperature(weather.temperature)) return -40;
    if (weather.temperature < BOOT_PREFERRED_TEMP_C) return 10;
  }
  return 0;
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

  if (weather && layerForbiddenAtTemperature(weather.temperature)) {
    return { valid: false, reason: 'layer_forbidden_hot_weather' };
  }

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

export function validateFootwearWeatherRules(
  pieces: OutfitPiece[],
  weather?: WeatherSnapshot,
): { valid: boolean; reason?: string } {
  if (!weather || !bootForbiddenAtTemperature(weather.temperature)) {
    return { valid: true };
  }

  const hotBoot = pieces.find(
    (piece) => piece.role === 'shoes' && isBootItem(piece.item),
  );
  if (hotBoot) {
    return { valid: false, reason: 'boot_forbidden_hot_weather' };
  }

  return { valid: true };
}
