import { Platform } from 'react-native';

import {
  clearStoredPushToken,
  readStoredPushToken,
  writeStoredPushToken,
} from '@/lib/push-token-storage';
import { registerPushNotifications } from '@/services/notifications';

function devLog(message: string) {
  if (__DEV__) console.log(`[push] ${message}`);
}

/**
 * Supabase currently has no push token table.
 * Tokens are stored locally per authenticated user until a migration is added.
 */
export async function syncPushTokenToServer(_userId: string, _token: string): Promise<void> {
  devLog('server sync skipped: push token schema not deployed');
}

export async function unregisterPushTokenFromServer(_userId: string): Promise<void> {
  devLog('server unregister skipped: push token schema not deployed');
}

export async function registerAndStorePushToken(userId: string): Promise<string | null> {
  const result = await registerPushNotifications();
  if (!result.token) return null;

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const existing = await readStoredPushToken(userId);

  if (existing?.token === result.token) {
    devLog('token unchanged');
    return result.token;
  }

  await writeStoredPushToken(userId, {
    token: result.token,
    platform,
    updatedAt: Date.now(),
  });

  await syncPushTokenToServer(userId, result.token);
  return result.token;
}

export async function clearPushTokenForUser(userId: string): Promise<void> {
  await unregisterPushTokenFromServer(userId);
  await clearStoredPushToken(userId);
}
