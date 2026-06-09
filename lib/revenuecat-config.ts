import type { PurchasePlan } from '@/services/payments';

/** App Store subscription product identifiers (must match App Store Connect + RevenueCat). */
export const REVENUECAT_PRODUCT_IDS: Record<PurchasePlan, string> = {
  weekly: 'com.stylove.app.premium.weekly',
  monthly: 'com.stylove.app.premium.monthly',
};

/** RevenueCat offering package identifiers (dashboard default/custom package ids). */
export const REVENUECAT_PACKAGE_IDS: Record<PurchasePlan, string> = {
  weekly: '$rc_weekly',
  monthly: '$rc_monthly',
};

/**
 * RevenueCat entitlement identifier (dashboard → Entitlements → Identifier).
 * Display name in RC is "stylove Premium"; identifier must match exactly.
 */
export const REVENUECAT_ENTITLEMENT_ID = 'stylove Premium';

export function getRevenueCatIosApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  return key && key.length > 0 ? key : null;
}

export function isRevenueCatConfigured(): boolean {
  return getRevenueCatIosApiKey() !== null;
}
