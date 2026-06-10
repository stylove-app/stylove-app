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
  if (!__DEV__) return;
  if (details) {
    console.log(`[revenuecat] ${message}`, details);
    return;
  }
  console.log(`[revenuecat] ${message}`);
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
  return resolveMonthlyPackage(offerings);
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
    devLog('fetchOfferings skipped: SDK not configured');
    return null;
  }

  try {
    return await Purchases.getOfferings();
  } catch (error) {
    devLog('getOfferings failed', { error: String(error) });
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
