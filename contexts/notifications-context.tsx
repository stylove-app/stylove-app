import { router } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAppNavigation } from '@/contexts/app-navigation-context';
import { useAuth } from '@/contexts/auth-context';
import { getDefaultRouteForPushKind } from '@/lib/notifications/copy';
import type { PushPermissionStatus, StylovePushPayload } from '@/lib/notifications/types';
import {
  hasAskedPushPermission,
  markPushPermissionAsked,
} from '@/lib/push-token-storage';
import {
  addNotificationResponseListener,
  configureNotificationHandler,
  getPushPermissionStatus,
  requestPushPermissionSafely,
} from '@/services/notifications';
import {
  clearPushTokenForUser,
  registerAndStorePushToken,
} from '@/services/push-token-registry';

type NotificationsContextValue = {
  ready: boolean;
  permissionStatus: PushPermissionStatus;
  pushToken: string | null;
  isSupported: boolean;
  isRequestingPermission: boolean;
  requestPermission: () => Promise<PushPermissionStatus>;
  refreshRegistration: () => Promise<string | null>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { ready: authReady, userId, isRegistered } = useAuth();
  const { requestNavigation } = useAppNavigation();

  const [ready, setReady] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('undetermined');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const lastUserIdRef = useRef<string | null>(null);

  const isSupported = permissionStatus !== 'unsupported';

  useEffect(() => {
    configureNotificationHandler();
    void getPushPermissionStatus().then((status) => {
      setPermissionStatus(status);
      setReady(true);
    });
  }, []);

  const handlePushPayload = useCallback(
    (payload: StylovePushPayload) => {
      const route = payload.route ?? getDefaultRouteForPushKind(payload.kind);
      switch (route) {
        case 'home':
          requestNavigation('home-aura');
          router.push('/(tabs)');
          break;
        case 'looks':
          requestNavigation('looks');
          router.push('/(tabs)/looks');
          break;
        case 'travel':
          router.push('/(tabs)/travel');
          break;
        case 'wardrobe':
          router.push('/(tabs)/wardrobe');
          break;
        case 'weekly-summary':
          router.push('/weekly-summary');
          break;
        default:
          break;
      }
    },
    [requestNavigation],
  );

  useEffect(() => {
    const remove = addNotificationResponseListener(handlePushPayload);
    return remove;
  }, [handlePushPayload]);

  const refreshRegistration = useCallback(async () => {
    if (!userId || !isRegistered) return null;

    const token = await registerAndStorePushToken(userId);
    setPushToken(token);
    setPermissionStatus(await getPushPermissionStatus());
    return token;
  }, [userId, isRegistered]);

  const requestPermission = useCallback(async () => {
    if (!userId || !isRegistered) return 'unsupported' as PushPermissionStatus;

    setIsRequestingPermission(true);
    try {
      await markPushPermissionAsked(userId);
      const status = await requestPushPermissionSafely();
      setPermissionStatus(status);

      if (status === 'granted') {
        const token = await refreshRegistration();
        return token ? 'granted' : status;
      }

      return status;
    } finally {
      setIsRequestingPermission(false);
    }
  }, [userId, isRegistered, refreshRegistration]);

  useEffect(() => {
    if (!authReady || !ready) return;

    if (!userId || !isRegistered) {
      const previousUserId = lastUserIdRef.current;
      if (previousUserId) {
        void clearPushTokenForUser(previousUserId);
      }
      lastUserIdRef.current = null;
      setPushToken(null);
      return;
    }

    lastUserIdRef.current = userId;

    void (async () => {
      const status = await getPushPermissionStatus();
      setPermissionStatus(status);

      if (status === 'granted') {
        const token = await registerAndStorePushToken(userId);
        setPushToken(token);
        return;
      }

      const asked = await hasAskedPushPermission(userId);
      if (!asked && status === 'undetermined') {
        return;
      }
    })();
  }, [authReady, ready, userId, isRegistered]);

  const value = useMemo(
    () => ({
      ready,
      permissionStatus,
      pushToken,
      isSupported,
      isRequestingPermission,
      requestPermission,
      refreshRegistration,
    }),
    [ready, permissionStatus, pushToken, isSupported, isRequestingPermission, requestPermission, refreshRegistration],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
