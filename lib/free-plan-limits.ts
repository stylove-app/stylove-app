import AsyncStorage from '@react-native-async-storage/async-storage';

export const FREE_WARDROBE_ITEM_LIMIT = 6;
export const FREE_DAILY_OUTFIT_LIMIT = 1;

const USAGE_KEY_PREFIX = '@stylove/usage/outfits';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function usageStorageKey(scope: string): string {
  return `${USAGE_KEY_PREFIX}/${scope}/${todayKey()}`;
}

export async function getDailyOutfitUsage(scope: string): Promise<number> {
  const stored = await AsyncStorage.getItem(usageStorageKey(scope));
  const parsed = stored ? Number.parseInt(stored, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function canGenerateFreeOutfit(scope: string): Promise<boolean> {
  return (await getDailyOutfitUsage(scope)) < FREE_DAILY_OUTFIT_LIMIT;
}

export async function recordFreeOutfitGeneration(scope: string): Promise<void> {
  const current = await getDailyOutfitUsage(scope);
  await AsyncStorage.setItem(usageStorageKey(scope), String(current + 1));
}

export function freePlanUsageKeyPrefix(): string {
  return USAGE_KEY_PREFIX;
}
