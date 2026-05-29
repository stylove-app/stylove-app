import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  canRequestExpoPushToken,
  getEasProjectId,
  getPushSupportReason,
  isPushSupported,
} from '@/lib/notifications/environment';
import type {
  PushPermissionStatus,
  PushRegistrationResult,
  PushSendResult,
  StylovePushKind,
  StylovePushPayload,
} from '@/lib/notifications/types';
import { buildPushPayload } from '@/lib/notifications/types';

let handlerConfigured = false;
let androidChannelConfigured = false;

function devLog(message: string) {
  if (__DEV__) console.log(`[push] ${message}`);
}

export function configureNotificationHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || androidChannelConfigured) return;
  androidChannelConfigured = true;

  await Notifications.setNotificationChannelAsync('stylove-default', {
    name: 'Stylove',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180, 120, 180],
    lightColor: '#4A121C',
  });
}

function mapPermissionStatus(status: Notifications.PermissionStatus): PushPermissionStatus {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (!isPushSupported()) return 'unsupported';
  const settings = await Notifications.getPermissionsAsync();
  return mapPermissionStatus(settings.status);
}

export async function requestPushPermissionSafely(): Promise<PushPermissionStatus> {
  if (!isPushSupported()) {
    devLog(`permission skipped: ${getPushSupportReason()}`);
    return 'unsupported';
  }

  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.status === Notifications.PermissionStatus.GRANTED) {
    return 'granted';
  }

  if (current.status === Notifications.PermissionStatus.DENIED) {
    return 'denied';
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: false,
    },
  });

  return mapPermissionStatus(requested.status);
}

export async function getExpoPushTokenSafe(): Promise<string | null> {
  if (!canRequestExpoPushToken()) {
    devLog(`token skipped: ${getPushSupportReason()}`);
    return null;
  }

  const projectId = getEasProjectId();
  if (!projectId) {
    devLog('token skipped: missing EAS project id');
    return null;
  }

  await ensureAndroidChannel();

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    devLog('token acquired');
    return token.data;
  } catch (error) {
    devLog(`token failed: ${error instanceof Error ? error.message : 'unknown'}`);
    return null;
  }
}

export async function registerPushNotifications(): Promise<PushRegistrationResult> {
  if (!isPushSupported()) {
    return {
      status: 'unsupported',
      token: null,
      reason: getPushSupportReason(),
    };
  }

  if (!Device.isDevice) {
    return {
      status: 'unsupported',
      token: null,
      reason: 'simulator',
    };
  }

  const status = await requestPushPermissionSafely();
  if (status !== 'granted') {
    return { status, token: null, reason: status };
  }

  const token = await getExpoPushTokenSafe();
  return {
    status,
    token,
    reason: token ? undefined : getPushSupportReason(),
  };
}

export function addNotificationResponseListener(
  listener: (payload: StylovePushPayload) => void,
) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    const payload =
      data && typeof data === 'object'
        ? buildPushPayloadFromRecord(data as Record<string, unknown>)
        : null;
    if (payload) listener(payload);
  });

  return () => subscription.remove();
}

function buildPushPayloadFromRecord(data: Record<string, unknown>): StylovePushPayload | null {
  if (typeof data.kind !== 'string') return null;
  const kind = data.kind as StylovePushKind;
  return buildPushPayload(kind, {
    route: typeof data.route === 'string' ? (data.route as StylovePushPayload['route']) : undefined,
    lookId: typeof data.lookId === 'string' ? data.lookId : undefined,
    planId: typeof data.planId === 'string' ? data.planId : undefined,
  });
}

export async function sendPushNotification(_payload: {
  kind: StylovePushKind;
  expoPushToken: string;
  data?: StylovePushPayload;
}): Promise<PushSendResult> {
  devLog('send skipped: delivery not enabled yet');
  return { sent: false, reason: 'push_delivery_not_enabled' };
}

export function getPushRuntimeInfo() {
  return {
    appOwnership: Constants.appOwnership ?? 'unknown',
    platform: Platform.OS,
    isDevice: Device.isDevice,
    supportReason: getPushSupportReason(),
    projectIdPresent: Boolean(getEasProjectId()),
  };
}
