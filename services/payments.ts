/**
 * Payment service — RevenueCat-backed on iOS when configured.
 */

import { restoreRevenueCatPurchases } from '@/services/revenuecat';

export async function restorePurchases(): Promise<{ restored: boolean }> {
  const { restored } = await restoreRevenueCatPurchases();
  return { restored };
}
