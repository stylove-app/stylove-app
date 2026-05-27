import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { PremiumPrivilegeId } from '@/lib/premium-privileges';

export type NotificationNavTarget =
  | 'home-aura'
  | 'looks'
  | 'profile-fragrance'
  | 'profile-about';

type AppNavigationContextValue = {
  pendingTarget: NotificationNavTarget | null;
  pendingPrivilegeId: PremiumPrivilegeId | null;
  requestNavigation: (target: NotificationNavTarget) => void;
  clearPendingNavigation: () => void;
};

const AppNavigationContext = createContext<AppNavigationContextValue | null>(null);

const PRIVILEGE_BY_TARGET: Partial<Record<NotificationNavTarget, PremiumPrivilegeId>> = {
  'profile-fragrance': 'fragrance',
};

export function AppNavigationProvider({ children }: { children: React.ReactNode }) {
  const [pendingTarget, setPendingTarget] = useState<NotificationNavTarget | null>(null);

  const requestNavigation = useCallback((target: NotificationNavTarget) => {
    setPendingTarget(target);
  }, []);

  const clearPendingNavigation = useCallback(() => {
    setPendingTarget(null);
  }, []);

  const pendingPrivilegeId = pendingTarget ? (PRIVILEGE_BY_TARGET[pendingTarget] ?? null) : null;

  const value = useMemo(
    () => ({
      pendingTarget,
      pendingPrivilegeId,
      requestNavigation,
      clearPendingNavigation,
    }),
    [pendingTarget, pendingPrivilegeId, requestNavigation, clearPendingNavigation],
  );

  return <AppNavigationContext.Provider value={value}>{children}</AppNavigationContext.Provider>;
}

export function useAppNavigation() {
  const ctx = useContext(AppNavigationContext);
  if (!ctx) throw new Error('useAppNavigation must be used within AppNavigationProvider');
  return ctx;
}
