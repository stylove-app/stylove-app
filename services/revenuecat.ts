import { Platform } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';

import {
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_OFFERING_ID,
  REVENUECAT_PACKAGE_ID,
  REVENUECAT_PRODUCT_ID,
  getRevenueCatIosApiKey,
  isRevenueCatConfigured,
} from '@/lib/revenuecat-config';

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

function getDefaultOffering(offerings: PurchasesOfferings): PurchasesOffering | null {
  const explicit = offerings.all[REVENUECAT_OFFERING_ID];
  if (explicit) return explicit;

  if (offerings.current?.identifier === REVENUECAT_OFFERING_ID) {
    return offerings.current;
  }

  return offerings.current ?? null;
}

function collectMonthlyPackages(offering: PurchasesOffering): PurchasesPackage[] {
  const seen = new Set<string>();
  const pool: PurchasesPackage[] = [];

  const add = (pkg: PurchasesPackage | null | undefined) => {
    if (!pkg || seen.has(pkg.identifier)) return;
    seen.add(pkg.identifier);
    pool.push(pkg);
  };

  for (const pkg of offering.availablePackages) add(pkg);
  add(offering.monthly ?? null);

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

  const offering = getDefaultOffering(offerings);
  const pool = offering ? collectMonthlyPackages(offering) : [];

  devLog(`${context}: offerings snapshot`, {
    expectedOfferingId: REVENUECAT_OFFERING_ID,
    currentOfferingId: offerings.current?.identifier ?? null,
    defaultOfferingId: offering?.identifier ?? null,
    allOfferingIds: Object.keys(offerings.all),
    packageIdentifiers: pool.map((pkg) => pkg.identifier),
    productIdentifiers: pool.map((pkg) => pkg.product?.identifier ?? null),
    priceStrings: pool.map((pkg) => pkg.product?.priceString ?? null),
    monthlyShortcut: offering?.monthly?.identifier ?? null,
    packages: pool.map(packageSnapshot),
  });
}

export function resolveMonthlyPackage(offerings: PurchasesOfferings | null): PurchasesPackage | null {
  if (!offerings) return null;

  const offering = getDefaultOffering(offerings);
  if (!offering) return null;

  const pool = collectMonthlyPackages(offering);

  for (const pkg of pool) {
    if (pkg.product?.identifier === REVENUECAT_PRODUCT_ID) return pkg;
  }

  for (const pkg of pool) {
    if (pkg.identifier === REVENUECAT_PACKAGE_ID) return pkg;
  }

  if (offering.monthly) return offering.monthly;

  return null;
}

export function isPremiumFromCustomerInfo(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  return Boolean(info.entitlements.active[REVENUECAT_ENTITLEMENT_ID]?.isActive);
}

export function extractMonthlyPackage(offerings: PurchasesOfferings | null): PurchasesPackage | null {
  logOfferingsDiagnostics(offerings, 'extractMonthlyPackage');

  const monthly = resolveMonthlyPackage(offerings);

  devLog('extractMonthlyPackage: resolved', {
    monthlyFound: Boolean(monthly),
    monthlyPackageId: monthly?.identifier ?? null,
    monthlyProductId: monthly?.product?.identifier ?? null,
  });

  return monthly;
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
  devLog('fetchOfferings:start', {
    configured,
    platform: Platform.OS,
    hasApiKey: isRevenueCatConfigured(),
    expectedProductId: REVENUECAT_PRODUCT_ID,
    expectedPackageId: REVENUECAT_PACKAGE_ID,
    expectedOfferingId: REVENUECAT_OFFERING_ID,
  });

  if (!configured) {
    devLog('fetchOfferings skipped: SDK not configured', {
      hint: 'configureRevenueCat() may not have run yet or EXPO_PUBLIC_REVENUECAT_IOS_KEY missing at build time',
    });
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings ? getDefaultOffering(offerings) : null;
    const pool = offering ? collectMonthlyPackages(offering) : [];

    devLog('fetchOfferings:raw response', {
      hasOfferings: Boolean(offerings),
      currentOfferingId: offerings?.current?.identifier ?? null,
      allOfferingIds: offerings ? Object.keys(offerings.all) : [],
      defaultOfferingResolved: offering?.identifier ?? null,
      availablePackageCount: pool.length,
      offeringHasMonthlyShortcut: Boolean(offering?.monthly),
    });

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

export function isRevenueCatSdkConfigured(): boolean {
  return configured;
}

export type RevenueCatOfferingSnapshot = {
  currentOfferingId: string | null;
  allOfferingIds: string[];
  defaultOfferingExists: boolean;
  packageCount: number;
  productIds: string[];
  packageIdentifiers: string[];
  monthlyFound: boolean;
};

export function snapshotOfferingDetails(
  offerings: PurchasesOfferings | null,
): RevenueCatOfferingSnapshot {
  if (!offerings) {
    return {
      currentOfferingId: null,
      allOfferingIds: [],
      defaultOfferingExists: false,
      packageCount: 0,
      productIds: [],
      packageIdentifiers: [],
      monthlyFound: false,
    };
  }

  const offering = getDefaultOffering(offerings);
  const pool = offering ? collectMonthlyPackages(offering) : [];
  const monthly = resolveMonthlyPackage(offerings);

  return {
    currentOfferingId: offerings.current?.identifier ?? null,
    allOfferingIds: Object.keys(offerings.all),
    defaultOfferingExists: Boolean(offerings.all[REVENUECAT_OFFERING_ID]),
    packageCount: pool.length,
    productIds: pool.map((pkg) => pkg.product?.identifier ?? '').filter(Boolean),
    packageIdentifiers: pool.map((pkg) => pkg.identifier),
    monthlyFound: Boolean(monthly),
  };
}

export async function probeRevenueCatOfferings(): Promise<{
  offerings: PurchasesOfferings | null;
  fetchResult: 'null' | 'ok' | 'error';
  errorMessage: string | null;
  skipReason: 'not_configured' | null;
}> {
  if (!configured) {
    return {
      offerings: null,
      fetchResult: 'null',
      errorMessage: 'SDK not configured',
      skipReason: 'not_configured',
    };
  }

  try {
    const offerings = await Purchases.getOfferings();
    return {
      offerings,
      fetchResult: 'ok',
      errorMessage: null,
      skipReason: null,
    };
  } catch (error) {
    return {
      offerings: null,
      fetchResult: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
      skipReason: null,
    };
  }
}
