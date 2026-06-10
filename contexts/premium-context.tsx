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
import {
  configureRevenueCat,
  extractMonthlyPackage,
  fetchOfferings,
  getCustomerInfo,
  isPremiumFromCustomerInfo,
  logInRevenueCat,
  logOfferingsDiagnostics,
  logOutRevenueCat,
  purchasePackage,
  restoreRevenueCatPurchases,
  type PurchaseFlowResult,
} from '@/services/revenuecat';

type PremiumContextValue = {
  isPremium: boolean;
  ready: boolean;
  packagesLoading: boolean;
  offeringsAvailable: boolean;
  monthlyPackage: PurchasesPackage | null;
  purchaseMonthly: () => Promise<PurchaseFlowResult>;
  restorePurchases: () => Promise<{ restored: boolean }>;
  refreshOfferings: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

function applyCustomerInfo(
  info: CustomerInfo | null,
  setPremium: (value: boolean) => void,
) {
  setPremium(isPremiumFromCustomerInfo(info));
}

function applyMonthlyPackageSafely(
  next: PurchasesPackage | null,
  setMonthlyPackage: React.Dispatch<React.SetStateAction<PurchasesPackage | null>>,
  monthlyPackageRef: React.MutableRefObject<PurchasesPackage | null>,
) {
  setMonthlyPackage((prev) => {
    const resolved = next ?? prev;
    monthlyPackageRef.current = resolved;
    return resolved;
  });
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { userId, ready: authReady } = useAuth();
  const [ready, setReady] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [rcPremium, setRcPremium] = useState(false);
  const linkedUserRef = useRef<string | null>(null);
  const monthlyPackageRef = useRef<PurchasesPackage | null>(null);

  monthlyPackageRef.current = monthlyPackage;

  const qaBypass = isQaTestMode() && !isRevenueCatConfigured();
  const isPremium = rcPremium || qaBypass;
  const offeringsAvailable = Boolean(monthlyPackage);

  const loadOfferings = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const offerings = await fetchOfferings();
      if (!offerings) {
        console.log('[premium] loadOfferings: fetch returned null, keeping existing package', {
          monthlyRef: Boolean(monthlyPackageRef.current),
        });
        return;
      }

      const monthly = extractMonthlyPackage(offerings);
      applyMonthlyPackageSafely(monthly, setMonthlyPackage, monthlyPackageRef);
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  const refreshCustomerState = useCallback(async () => {
    const info = await getCustomerInfo();
    applyCustomerInfo(info, setRcPremium);
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
        applyCustomerInfo(info, setRcPremium);
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

  const resolveMonthlyPackage = useCallback(async (): Promise<PurchasesPackage | null> => {
    let pkg = monthlyPackageRef.current;

    console.log('[premium] resolveMonthlyPackage', {
      fromRef: Boolean(pkg),
      monthlyRef: Boolean(monthlyPackageRef.current),
    });

    if (pkg) return pkg;

    console.log('[premium] monthly package missing in ref, re-fetching offerings');
    const offerings = await fetchOfferings();
    if (!offerings) {
      console.log('[premium] resolveMonthlyPackage: re-fetch returned null', {
        monthlyRef: Boolean(monthlyPackageRef.current),
      });
      return monthlyPackageRef.current;
    }

    const monthly = extractMonthlyPackage(offerings);
    applyMonthlyPackageSafely(monthly, setMonthlyPackage, monthlyPackageRef);
    pkg = monthly ?? monthlyPackageRef.current;

    console.log('[premium] resolveMonthlyPackage after refresh', {
      found: Boolean(pkg),
      packageId: pkg?.identifier,
      productId: pkg?.product.identifier,
    });

    if (!pkg) {
      logOfferingsDiagnostics(offerings, 'resolveMonthlyPackage:still-missing');
      console.log('[premium] resolveMonthlyPackage unavailable', {
        monthlyRef: Boolean(monthlyPackageRef.current),
      });
    }

    return pkg;
  }, []);

  const purchaseMonthly = useCallback(async (): Promise<PurchaseFlowResult> => {
    const pkg = await resolveMonthlyPackage();
    console.log('[premium] purchaseMonthly called', {
      packageFound: Boolean(pkg),
      packageId: pkg?.identifier,
      productId: pkg?.product.identifier,
    });

    if (!pkg) {
      return { ok: false, cancelled: false, message: 'Subscription package unavailable.' };
    }

    console.log('[premium] purchaseMonthly invoking RevenueCat', {
      packageId: pkg.identifier,
      productId: pkg.product.identifier,
    });

    const result = await purchasePackage(pkg);
    console.log('[premium] purchaseMonthly result', {
      ok: result.ok,
      cancelled: !result.ok && result.cancelled,
      message: !result.ok ? result.message : undefined,
    });

    if (result.ok) {
      applyCustomerInfo(result.customerInfo, setRcPremium);
    }
    return result;
  }, [resolveMonthlyPackage]);

  const restorePurchases = useCallback(async () => {
    const { restored, customerInfo } = await restoreRevenueCatPurchases();
    applyCustomerInfo(customerInfo, setRcPremium);
    return { restored };
  }, []);

  const value = useMemo(
    () => ({
      isPremium,
      ready,
      packagesLoading,
      offeringsAvailable,
      monthlyPackage,
      purchaseMonthly,
      restorePurchases,
      refreshOfferings: loadOfferings,
    }),
    [
      isPremium,
      ready,
      packagesLoading,
      offeringsAvailable,
      monthlyPackage,
      purchaseMonthly,
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
