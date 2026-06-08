import { Platform } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

import {
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_PRODUCT_IDS,
  getRevenueCatIosApiKey,
  isRevenueCatConfigured,
} from '@/lib/revenuecat-config';
import type { PurchasePlan } from '@/services/payments';

export type RevenueCatPaywallPackages = {
  weekly: PurchasesPackage | null;
  monthly: PurchasesPackage | null;
};

let configured = false;

function devLog(message: string) {
  if (__DEV__) console.log(`[revenuecat] ${message}`);
}

export function isPremiumFromCustomerInfo(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  const active = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
  if (active?.isActive) return true;

  // Fallback: match any active entitlement (handles identifier renames in RC dashboard).
  return Object.values(info.entitlements.active).some((entitlement) => entitlement.isActive);
}

export function activePlanFromCustomerInfo(info: CustomerInfo | null | undefined): PurchasePlan | null {
  if (!isPremiumFromCustomerInfo(info) || !info) return null;

  const entitlement = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
  const productId = entitlement?.productIdentifier;

  if (productId === REVENUECAT_PRODUCT_IDS.weekly) return 'weekly';
  if (productId === REVENUECAT_PRODUCT_IDS.monthly) return 'monthly';

  return 'monthly';
}

function findPackageByProductId(
  offerings: PurchasesOfferings | null,
  productId: string,
): PurchasesPackage | null {
  if (!offerings) return null;

  const pools: PurchasesPackage[] = [
    ...(offerings.current?.availablePackages ?? []),
    ...Object.values(offerings.all).flatMap((offering) => offering.availablePackages),
  ];

  for (const pkg of pools) {
    if (pkg.product.identifier === productId) return pkg;
  }

  return null;
}

export function extractPaywallPackages(offerings: PurchasesOfferings | null): RevenueCatPaywallPackages {
  return {
    weekly: findPackageByProductId(offerings, REVENUECAT_PRODUCT_IDS.weekly),
    monthly: findPackageByProductId(offerings, REVENUECAT_PRODUCT_IDS.monthly),
  };
}

export async function configureRevenueCat(): Promise<boolean> {
  if (configured || Platform.OS !== 'ios') return configured;

  const apiKey = getRevenueCatIosApiKey();
  if (!apiKey) {
    devLog('skipped configure: missing EXPO_PUBLIC_REVENUECAT_IOS_KEY');
    return false;
  }

  Purchases.configure({ apiKey });
  configured = true;
  devLog('configured');
  return true;
}

export async function logInRevenueCat(appUserId: string): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    const { customerInfo } = await Purchases.logIn(appUserId);
    return customerInfo;
  } catch (error) {
    devLog(`logIn failed: ${String(error)}`);
    return null;
  }
}

export async function logOutRevenueCat(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // Anonymous RC user is fine after sign-out.
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    devLog(`getCustomerInfo failed: ${String(error)}`);
    return null;
  }
}

export async function fetchOfferings(): Promise<PurchasesOfferings | null> {
  if (!configured) return null;
  try {
    return await Purchases.getOfferings();
  } catch (error) {
    devLog(`getOfferings failed: ${String(error)}`);
    return null;
  }
}

export type PurchaseFlowResult =
  | { ok: true; customerInfo: CustomerInfo }
  | { ok: false; cancelled: boolean; message?: string };

export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseFlowResult> {
  if (!configured) {
    return { ok: false, cancelled: false, message: 'Purchases are not configured.' };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: true, customerInfo };
  } catch (error: unknown) {
    const rcError = error as { code?: string; message?: string; userCancelled?: boolean };
    const cancelled =
      rcError.userCancelled === true ||
      rcError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;

    return {
      ok: false,
      cancelled,
      message: rcError.message ?? 'Purchase failed.',
    };
  }
}

export async function restoreRevenueCatPurchases(): Promise<{
  restored: boolean;
  customerInfo: CustomerInfo | null;
}> {
  if (!configured) {
    return { restored: false, customerInfo: null };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return {
      restored: isPremiumFromCustomerInfo(customerInfo),
      customerInfo,
    };
  } catch (error) {
    devLog(`restore failed: ${String(error)}`);
    return { restored: false, customerInfo: null };
  }
}

export function revenueCatReady(): boolean {
  return configured && isRevenueCatConfigured();
}
