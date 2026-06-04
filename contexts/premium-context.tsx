import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { isQaTestMode } from '@/lib/qa-test-mode';
import type { PurchasePlan } from '@/services/payments';

const PREMIUM_KEY = '@stylove/premium-active';

type PremiumContextValue = {
  isPremium: boolean;
  ready: boolean;
  activePlan: PurchasePlan | null;
  activatePremium: (plan: PurchasePlan) => Promise<void>;
  deactivatePremium: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void AsyncStorage.removeItem(PREMIUM_KEY).finally(() => setReady(true));
  }, []);

  const activatePremium = useCallback(async (plan: PurchasePlan) => {
    void plan;
    await AsyncStorage.removeItem(PREMIUM_KEY);
  }, []);

  const deactivatePremium = useCallback(async () => {
    await AsyncStorage.removeItem(PREMIUM_KEY);
  }, []);

  const qaTestMode = isQaTestMode();

  const value = useMemo(
    () => ({
      isPremium: qaTestMode,
      ready,
      activePlan: qaTestMode ? ('monthly' as PurchasePlan) : null,
      activatePremium,
      deactivatePremium,
    }),
    [qaTestMode, ready, activatePremium, deactivatePremium],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
