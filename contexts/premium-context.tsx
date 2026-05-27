import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
  const [isPremium, setIsPremium] = useState(false);
  const [activePlan, setActivePlan] = useState<PurchasePlan | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PREMIUM_KEY).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { active: boolean; plan: PurchasePlan | null };
          setIsPremium(parsed.active);
          setActivePlan(parsed.plan);
        } catch {
          setIsPremium(false);
        }
      }
      setReady(true);
    });
  }, []);

  const activatePremium = useCallback(async (plan: PurchasePlan) => {
    setIsPremium(true);
    setActivePlan(plan);
    await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify({ active: true, plan }));
  }, []);

  const deactivatePremium = useCallback(async () => {
    setIsPremium(false);
    setActivePlan(null);
    await AsyncStorage.removeItem(PREMIUM_KEY);
  }, []);

  const value = useMemo(
    () => ({ isPremium, ready, activePlan, activatePremium, deactivatePremium }),
    [isPremium, ready, activePlan, activatePremium, deactivatePremium],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
