/** RevenueCat / App Store subscription product identifier. */
export const REVENUECAT_PRODUCT_ID = 'stylove_premium_monthly';

/** RevenueCat package identifier (default offering → monthly). */
export const REVENUECAT_PACKAGE_ID = '$rc_monthly';

/** RevenueCat offering identifier (dashboard default offering). */
export const REVENUECAT_OFFERING_ID = 'default';

/** RevenueCat entitlement identifier — premium access gate. */
export const REVENUECAT_ENTITLEMENT_ID = 'Premium';

export function getRevenueCatIosApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  return key && key.length > 0 ? key : null;
}

export function isRevenueCatConfigured(): boolean {
  return getRevenueCatIosApiKey() !== null;
}
