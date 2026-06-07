import type { WardrobeItem } from '@/lib/outfit-engine';
import { filterShoesForWeatherContext } from '@/lib/layer-piece-rules';
import { getEffectiveStyleProfile } from '@/lib/wardrobe-style-profile';
import type { WeatherSnapshot } from '@/lib/weather';

export const TRAVEL_VALID_SHOE_CATEGORIES = ['sneaker', 'flat', 'loafer', 'boot'] as const;

export type TravelValidShoeCategory = (typeof TRAVEL_VALID_SHOE_CATEGORIES)[number];

export function isTravelValidShoeCategory(category: string): category is TravelValidShoeCategory {
  return (TRAVEL_VALID_SHOE_CATEGORIES as readonly string[]).includes(category);
}

export function isTravelPracticalShoe(item: WardrobeItem): boolean {
  const category = getEffectiveStyleProfile(item).category;
  return isTravelValidShoeCategory(category);
}

export function filterTravelValidShoes(
  shoes: WardrobeItem[],
  weather?: WeatherSnapshot,
): WardrobeItem[] {
  return filterShoesForWeatherContext(shoes, weather).filter((item) => {
    if (!isTravelPracticalShoe(item)) return false;
    const category = getEffectiveStyleProfile(item).category;
    if (category === 'sandal' || category === 'heel') return false;
    if (item.itemType === 'topuklu') return false;
    return true;
  });
}
