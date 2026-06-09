import { Platform } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

import {
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_PACKAGE_IDS,
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

function devLog(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.log(`[revenuecat] ${message}`, details);
    return;
  }
  console.log(`[revenuecat] ${message}`);
}

function packageSnapshot(pkg: PurchasesPackage) {
  return {
    packageId: pkg.identifier,
    productId: pkg.product?.identifier ?? null,
    priceString: pkg.product?.priceString ?? null,
  };
}

function collectPackages(offerings: PurchasesOfferings): PurchasesPackage[] {
  const seen = new Set<string>();
  const pool: PurchasesPackage[] = [];

  const add = (pkg: PurchasesPackage | null | undefined) => {
    if (!pkg || seen.has(pkg.identifier)) return;
    seen.add(pkg.identifier);
    pool.push(pkg);
  };

  const current = offerings.current;
  for (const pkg of current?.availablePackages ?? []) add(pkg);
  add(current?.weekly ?? null);
  add(current?.monthly ?? null);

  for (const offering of Object.values(offerings.all)) {
    for (const pkg of offering.availablePackages) add(pkg);
    add(offering.weekly);
    add(offering.monthly);
  }

  return pool;
}

export function logOfferingsDiagnostics(
  offerings: PurchasesOfferings | null,
  context = 'offerings',
): void {
  if (!offerings) {
    devLog(`${context}: no offerings`, { offerings: null });
    return;
  }

  const pool = collectPackages(offerings);
  devLog(`${context}: offerings snapshot`, {
    currentOfferingId: offerings.current?.identifier ?? null,
    allOfferingIds: Object.keys(offerings.all),
    packageIdentifiers: pool.map((pkg) => pkg.identifier),
    productIdentifiers: pool.map((pkg) => pkg.product?.identifier ?? null),
    priceStrings: pool.map((pkg) => pkg.product?.priceString ?? null),
    currentWeeklyShortcut: offerings.current?.weekly?.identifier ?? null,
    currentMonthlyShortcut: offerings.current?.monthly?.identifier ?? null,
    packages: pool.map(packageSnapshot),
  });
}

function resolvePlanPackage(
  offerings: PurchasesOfferings | null,
  plan: PurchasePlan,
): PurchasesPackage | null {
  if (!offerings) return null;

  const productId = REVENUECAT_PRODUCT_IDS[plan];
  const packageId = REVENUECAT_PACKAGE_IDS[plan];
  const pool = collectPackages(offerings);

  for (const pkg of pool) {
    if (pkg.product?.identifier === productId) return pkg;
  }

  for (const pkg of pool) {
    if (pkg.identifier === packageId) return pkg;
  }

  const shortcut = plan === 'weekly' ? offerings.current?.weekly : offerings.current?.monthly;
  if (shortcut) return shortcut;

  return null;
}

export function isPremiumFromCustomerInfo(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  const active = info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
  if (active?.isActive) return true;

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

export function extractPaywallPackages(offerings: PurchasesOfferings | null): RevenueCatPaywallPackages {
  logOfferingsDiagnostics(offerings, 'extractPaywallPackages');

  const weekly = resolvePlanPackage(offerings, 'weekly');
  const monthly = resolvePlanPackage(offerings, 'monthly');

  devLog('extractPaywallPackages: resolved', {
    weeklyFound: Boolean(weekly),
    monthlyFound: Boolean(monthly),
    weeklyPackageId: weekly?.identifier ?? null,
    weeklyProductId: weekly?.product?.identifier ?? null,
    monthlyPackageId: monthly?.identifier ?? null,
    monthlyProductId: monthly?.product?.identifier ?? null,
  });

  return { weekly, monthly };
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
  if (!configured) {
    devLog('fetchOfferings skipped: not configured');
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    logOfferingsDiagnostics(offerings, 'fetchOfferings');
    return offerings;
  } catch (error) {
    devLog('getOfferings failed', { error: String(error) });
    return null;
  }
}

export type PurchaseFlowResult =
  | { ok: true; customerInfo: CustomerInfo }
  | { ok: false; cancelled: boolean; message?: string };

export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseFlowResult> {
  devLog('purchasePackage start', {
    configured,
    packageId: pkg.identifier,
    productId: pkg.product.identifier,
  });

  if (!configured) {
    devLog('purchasePackage blocked: not configured');
    return { ok: false, cancelled: false, message: 'Purchases are not configured.' };
  }

  try {
    devLog('purchasePackage calling Purchases.purchasePackage');
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    devLog('purchasePackage success', {
      packageId: pkg.identifier,
      activeEntitlements: Object.keys(customerInfo.entitlements.active),
    });
    return { ok: true, customerInfo };
  } catch (error: unknown) {
    const rcError = error as { code?: string; message?: string; userCancelled?: boolean };
    const cancelled =
      rcError.userCancelled === true ||
      rcError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;

    devLog('purchasePackage failed', {
      packageId: pkg.identifier,
      cancelled,
      code: rcError.code,
      message: rcError.message ?? String(error),
    });

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
