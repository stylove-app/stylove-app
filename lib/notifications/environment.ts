import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type PushSupportReason =
  | 'supported'
  | 'web'
  | 'simulator'
  | 'expo_go_android'
  | 'missing_project_id';

export function getEasProjectId(): string | null {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.easProjectId;

  return typeof projectId === 'string' && projectId.length > 0 ? projectId : null;
}

export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export function getPushSupportReason(): PushSupportReason {
  if (Platform.OS === 'web') return 'web';
  if (!Device.isDevice) return 'simulator';
  if (isExpoGo() && Platform.OS === 'android') return 'expo_go_android';
  if (!getEasProjectId()) return 'missing_project_id';
  return 'supported';
}

export function isPushSupported(): boolean {
  const reason = getPushSupportReason();
  return reason === 'supported' || reason === 'missing_project_id';
}

export function canRequestExpoPushToken(): boolean {
  return getPushSupportReason() === 'supported';
}
