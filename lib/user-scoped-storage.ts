import AsyncStorage from '@react-native-async-storage/async-storage';

import { EMPTY_STYLE_MEMORY, type StyleMemory } from '@/lib/style-memory';
import { EMPTY_USER_PROFILE, type UserProfile } from '@/lib/user-profile';
import type { CuratedLook, WardrobeItem } from '@/lib/outfit-engine';
import { normalizeWardrobeItems } from '@/lib/wardrobe-item-types';
import { stripDemoWardrobe } from '@/lib/wardrobe-utils';

/** Local-only scope for guest / pre-auth mode — never synced from signed-in caches. */
export const GUEST_STORAGE_SCOPE = 'guest';

export const LEGACY_WARDROBE_KEY = '@stylove/wardrobe';
export const LEGACY_PROFILE_KEY = '@stylove/user-profile';
export const LEGACY_LOOKS_KEY = '@stylove/looks';
export const LEGACY_STYLE_MEMORY_KEY = '@stylove/style-memory';

export function wardrobeStorageKey(scope: string): string {
  return scope === GUEST_STORAGE_SCOPE
    ? '@stylove/wardrobe/guest'
    : `@stylove/wardrobe/${scope}`;
}

export function profileStorageKey(scope: string): string {
  return scope === GUEST_STORAGE_SCOPE
    ? '@stylove/user-profile/guest'
    : `@stylove/user-profile/${scope}`;
}

export function looksStorageKey(scope: string): string {
  return scope === GUEST_STORAGE_SCOPE ? '@stylove/looks/guest' : `@stylove/looks/${scope}`;
}

export function styleMemoryStorageKey(scope: string): string {
  return scope === GUEST_STORAGE_SCOPE
    ? '@stylove/style-memory/guest'
    : `@stylove/style-memory/${scope}`;
}

export async function readScopedWardrobe(scope: string): Promise<WardrobeItem[]> {
  const key = wardrobeStorageKey(scope);
  const stored = await AsyncStorage.getItem(key);

  if (!stored) return [];
  try {
    return normalizeWardrobeItems(stripDemoWardrobe(JSON.parse(stored) as WardrobeItem[]));
  } catch {
    return [];
  }
}

export async function writeScopedWardrobe(scope: string, items: WardrobeItem[]): Promise<void> {
  const cleaned = normalizeWardrobeItems(stripDemoWardrobe(items));
  await AsyncStorage.setItem(wardrobeStorageKey(scope), JSON.stringify(cleaned));
}

export async function readScopedProfile(scope: string): Promise<UserProfile> {
  const key = profileStorageKey(scope);
  const stored = await AsyncStorage.getItem(key);

  if (!stored) return { ...EMPTY_USER_PROFILE };
  try {
    return { ...EMPTY_USER_PROFILE, ...JSON.parse(stored) };
  } catch {
    return { ...EMPTY_USER_PROFILE };
  }
}

export async function writeScopedProfile(scope: string, profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(profileStorageKey(scope), JSON.stringify(profile));
}

export async function readScopedLooks(scope: string): Promise<CuratedLook[]> {
  const key = looksStorageKey(scope);
  const stored = await AsyncStorage.getItem(key);

  if (!stored) return [];
  try {
    return JSON.parse(stored) as CuratedLook[];
  } catch {
    return [];
  }
}

export async function writeScopedLooks(scope: string, looks: CuratedLook[]): Promise<void> {
  await AsyncStorage.setItem(looksStorageKey(scope), JSON.stringify(looks));
}

export async function readScopedStyleMemory(scope: string): Promise<StyleMemory> {
  const key = styleMemoryStorageKey(scope);
  const stored = await AsyncStorage.getItem(key);

  if (!stored) return { ...EMPTY_STYLE_MEMORY };
  try {
    return { ...EMPTY_STYLE_MEMORY, ...JSON.parse(stored) };
  } catch {
    return { ...EMPTY_STYLE_MEMORY };
  }
}

export async function writeScopedStyleMemory(scope: string, memory: StyleMemory): Promise<void> {
  await AsyncStorage.setItem(styleMemoryStorageKey(scope), JSON.stringify(memory));
}

/** Wipe guest-only caches and legacy global keys (signed-in per-user caches are kept). */
export async function resetGuestLocalCaches(): Promise<void> {
  await AsyncStorage.multiRemove([
    wardrobeStorageKey(GUEST_STORAGE_SCOPE),
    profileStorageKey(GUEST_STORAGE_SCOPE),
    looksStorageKey(GUEST_STORAGE_SCOPE),
    styleMemoryStorageKey(GUEST_STORAGE_SCOPE),
    LEGACY_WARDROBE_KEY,
    LEGACY_PROFILE_KEY,
    LEGACY_LOOKS_KEY,
    LEGACY_STYLE_MEMORY_KEY,
  ]);
}

export async function resetAllLocalCaches(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const styloveCacheKeys = keys.filter(
    (key) =>
      key === LEGACY_WARDROBE_KEY ||
      key === LEGACY_PROFILE_KEY ||
      key === LEGACY_LOOKS_KEY ||
      key === LEGACY_STYLE_MEMORY_KEY ||
      key.startsWith('@stylove/wardrobe/') ||
      key.startsWith('@stylove/user-profile/') ||
      key.startsWith('@stylove/looks/') ||
      key.startsWith('@stylove/style-memory/'),
  );

  if (styloveCacheKeys.length > 0) {
    await AsyncStorage.multiRemove(styloveCacheKeys);
  }
}
