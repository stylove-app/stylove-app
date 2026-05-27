import type { WardrobeItem } from '@/lib/outfit-engine';
import { normalizeWardrobeItem } from '@/lib/wardrobe-item-types';

/** Canonical demo piece names from the old DEFAULT_WARDROBE seed. */
export const DEMO_WARDROBE_NAMES = [
  'Silk Evening Dress',
  'Tailored Blazer',
  'Leather Pumps',
  'Structured Tote',
  'Gold Cuff',
] as const;

const DEMO_NAME_SET = new Set<string>(DEMO_WARDROBE_NAMES.map((n) => n.toLowerCase()));

/** Demo seed pieces — never used for styling, travel, or wardrobe UI. */
export function isDemoWardrobeItem(item: WardrobeItem): boolean {
  const normalized = normalizeWardrobeItem({
    ...item,
    processingStatus: item.processingStatus ?? 'done',
    originalImageUri: item.originalImageUri ?? item.imageUri,
  });
  if (normalized.id.startsWith('default-') || normalized.id.startsWith('item-')) return true;
  if (DEMO_NAME_SET.has(normalized.name.trim().toLowerCase())) return true;
  if (normalized.imageUri.includes('images.unsplash.com')) return true;
  return false;
}

/** User-uploaded pieces only (home, looks, travel engines + wardrobe UI). */
export function getStylingWardrobe(items: WardrobeItem[]): WardrobeItem[] {
  return items.filter((item) => !isDemoWardrobeItem(item));
}

export function stripDemoWardrobe(items: WardrobeItem[]): WardrobeItem[] {
  return getStylingWardrobe(items);
}
