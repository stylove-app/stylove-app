import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type NotificationNavTarget = 'home-aura' | 'looks' | 'profile-about';

type AppNavigationContextValue = {
  pendingTarget: NotificationNavTarget | null;
  requestNavigation: (target: NotificationNavTarget) => void;
  clearPendingNavigation: () => void;
};

const AppNavigationContext = createContext<AppNavigationContextValue | null>(null);

export function AppNavigationProvider({ children }: { children: React.ReactNode }) {
  const [pendingTarget, setPendingTarget] = useState<NotificationNavTarget | null>(null);

  const requestNavigation = useCallback((target: NotificationNavTarget) => {
    setPendingTarget(target);
  }, []);

  const clearPendingNavigation = useCallback(() => {
    setPendingTarget(null);
  }, []);

  const value = useMemo(
    () => ({
      pendingTarget,
      requestNavigation,
      clearPendingNavigation,
    }),
    [pendingTarget, requestNavigation, clearPendingNavigation],
  );

  return <AppNavigationContext.Provider value={value}>{children}</AppNavigationContext.Provider>;
}

export function useAppNavigation() {
  const ctx = useContext(AppNavigationContext);
  if (!ctx) throw new Error('useAppNavigation must be used within AppNavigationProvider');
  return ctx;
}
