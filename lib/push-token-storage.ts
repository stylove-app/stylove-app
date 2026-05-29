import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_PREFIX = '@stylove/push-token/';
const PUSH_PERMISSION_PREFIX = '@stylove/push-permission-asked/';

export type StoredPushToken = {
  token: string;
  platform: 'ios' | 'android';
  updatedAt: number;
};

export function pushTokenStorageKey(userId: string): string {
  return `${PUSH_TOKEN_PREFIX}${userId}`;
}

export function pushPermissionAskedKey(userId: string): string {
  return `${PUSH_PERMISSION_PREFIX}${userId}`;
}

export async function readStoredPushToken(userId: string): Promise<StoredPushToken | null> {
  const raw = await AsyncStorage.getItem(pushTokenStorageKey(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredPushToken;
    if (typeof parsed.token !== 'string' || !parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeStoredPushToken(userId: string, token: StoredPushToken): Promise<void> {
  await AsyncStorage.setItem(pushTokenStorageKey(userId), JSON.stringify(token));
}

export async function clearStoredPushToken(userId: string): Promise<void> {
  await AsyncStorage.removeItem(pushTokenStorageKey(userId));
}

export async function hasAskedPushPermission(userId: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(pushPermissionAskedKey(userId));
  return value === '1';
}

export async function markPushPermissionAsked(userId: string): Promise<void> {
  await AsyncStorage.setItem(pushPermissionAskedKey(userId), '1');
}

export async function clearPushPermissionAsked(userId: string): Promise<void> {
  await AsyncStorage.removeItem(pushPermissionAskedKey(userId));
}

export async function clearAllPushLocalState(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const pushKeys = keys.filter(
    (key) => key.startsWith(PUSH_TOKEN_PREFIX) || key.startsWith(PUSH_PERMISSION_PREFIX),
  );
  if (pushKeys.length > 0) {
    await AsyncStorage.multiRemove(pushKeys);
  }
}
