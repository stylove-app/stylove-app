import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/contexts/auth-context';
import { isQaTestMode } from '@/lib/qa-test-mode';
import { isRevenueCatConfigured } from '@/lib/revenuecat-config';
import type { PurchasePlan } from '@/services/payments';
import {
  activePlanFromCustomerInfo,
  configureRevenueCat,
  extractPaywallPackages,
  fetchOfferings,
  getCustomerInfo,
  isPremiumFromCustomerInfo,
  logInRevenueCat,
  logOutRevenueCat,
  purchasePackage,
  restoreRevenueCatPurchases,
  type PurchaseFlowResult,
} from '@/services/revenuecat';

type PremiumContextValue = {
  isPremium: boolean;
  ready: boolean;
  activePlan: PurchasePlan | null;
  packagesLoading: boolean;
  offeringsAvailable: boolean;
  weeklyPackage: PurchasesPackage | null;
  monthlyPackage: PurchasesPackage | null;
  purchasePlan: (plan: PurchasePlan) => Promise<PurchaseFlowResult>;
  restorePurchases: () => Promise<{ restored: boolean }>;
  refreshOfferings: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

function applyCustomerInfo(
  info: CustomerInfo | null,
  setPremium: (value: boolean) => void,
  setActivePlan: (value: PurchasePlan | null) => void,
) {
  setPremium(isPremiumFromCustomerInfo(info));
  setActivePlan(activePlanFromCustomerInfo(info));
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { userId, ready: authReady } = useAuth();
  const [ready, setReady] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [weeklyPackage, setWeeklyPackage] = useState<PurchasesPackage | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [rcPremium, setRcPremium] = useState(false);
  const [activePlan, setActivePlan] = useState<PurchasePlan | null>(null);
  const linkedUserRef = useRef<string | null>(null);
  const weeklyPackageRef = useRef<PurchasesPackage | null>(null);
  const monthlyPackageRef = useRef<PurchasesPackage | null>(null);

  weeklyPackageRef.current = weeklyPackage;
  monthlyPackageRef.current = monthlyPackage;

  const qaBypass = isQaTestMode() && !isRevenueCatConfigured();
  const isPremium = rcPremium || qaBypass;
  const resolvedActivePlan = qaBypass ? ('monthly' as PurchasePlan) : activePlan;
  const offeringsAvailable = Boolean(weeklyPackage || monthlyPackage);

  const loadOfferings = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const offerings = await fetchOfferings();
      const packages = extractPaywallPackages(offerings);
      setWeeklyPackage(packages.weekly);
      setMonthlyPackage(packages.monthly);
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  const refreshCustomerState = useCallback(async () => {
    const info = await getCustomerInfo();
    applyCustomerInfo(info, setRcPremium, setActivePlan);
    return info;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const configured = await configureRevenueCat();
      if (cancelled) return;

      if (configured) {
        await refreshCustomerState();
        await loadOfferings();
      }

      if (!cancelled) setReady(true);
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [loadOfferings, refreshCustomerState]);

  useEffect(() => {
    if (!authReady || !ready) return;

    const syncUser = async () => {
      if (!isRevenueCatConfigured()) return;

      if (userId) {
        if (linkedUserRef.current === userId) return;
        linkedUserRef.current = userId;
        const info = await logInRevenueCat(userId);
        applyCustomerInfo(info, setRcPremium, setActivePlan);
        await loadOfferings();
        return;
      }

      if (linkedUserRef.current) {
        linkedUserRef.current = null;
        await logOutRevenueCat();
        await refreshCustomerState();
      }
    };

    void syncUser();
  }, [authReady, ready, userId, loadOfferings, refreshCustomerState]);

  const resolvePackageForPlan = useCallback(async (plan: PurchasePlan): Promise<PurchasesPackage | null> => {
    const readPackages = () => ({
      weekly: weeklyPackageRef.current,
      monthly: monthlyPackageRef.current,
    });

    let { weekly, monthly } = readPackages();
    let pkg = plan === 'weekly' ? weekly : monthly;

    console.log('[premium] resolvePackageForPlan', {
      plan,
      fromRef: Boolean(pkg),
      weeklyRef: Boolean(weekly),
      monthlyRef: Boolean(monthly),
    });

    if (pkg) return pkg;

    console.log('[premium] package missing in refs, re-fetching offerings', { plan });
    const offerings = await fetchOfferings();
    const packages = extractPaywallPackages(offerings);
    setWeeklyPackage(packages.weekly);
    setMonthlyPackage(packages.monthly);
    weeklyPackageRef.current = packages.weekly;
    monthlyPackageRef.current = packages.monthly;

    weekly = packages.weekly;
    monthly = packages.monthly;
    pkg = plan === 'weekly' ? weekly : monthly;

    console.log('[premium] resolvePackageForPlan after refresh', {
      plan,
      found: Boolean(pkg),
      packageId: pkg?.identifier,
      productId: pkg?.product.identifier,
    });

    return pkg;
  }, []);

  const purchasePlan = useCallback(
    async (plan: PurchasePlan): Promise<PurchaseFlowResult> => {
      const pkg = await resolvePackageForPlan(plan);
      console.log('[premium] purchasePlan called', {
        plan,
        packageFound: Boolean(pkg),
        packageId: pkg?.identifier,
        productId: pkg?.product.identifier,
      });

      if (!pkg) {
        return { ok: false, cancelled: false, message: 'Subscription package unavailable.' };
      }

      console.log('[premium] purchasePlan invoking RevenueCat', {
        plan,
        packageId: pkg.identifier,
        productId: pkg.product.identifier,
      });

      const result = await purchasePackage(pkg);
      console.log('[premium] purchasePlan result', {
        plan,
        ok: result.ok,
        cancelled: !result.ok && result.cancelled,
        message: !result.ok ? result.message : undefined,
      });

      if (result.ok) {
        applyCustomerInfo(result.customerInfo, setRcPremium, setActivePlan);
      }
      return result;
    },
    [resolvePackageForPlan],
  );

  const restorePurchases = useCallback(async () => {
    const { restored, customerInfo } = await restoreRevenueCatPurchases();
    applyCustomerInfo(customerInfo, setRcPremium, setActivePlan);
    return { restored };
  }, []);

  const value = useMemo(
    () => ({
      isPremium,
      ready,
      activePlan: resolvedActivePlan,
      packagesLoading,
      offeringsAvailable,
      weeklyPackage,
      monthlyPackage,
      purchasePlan,
      restorePurchases,
      refreshOfferings: loadOfferings,
    }),
    [
      isPremium,
      ready,
      resolvedActivePlan,
      packagesLoading,
      offeringsAvailable,
      weeklyPackage,
      monthlyPackage,
      purchasePlan,
      restorePurchases,
      loadOfferings,
    ],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
