/**
 * Payment service — RevenueCat-backed on iOS when configured.
 */

import { restoreRevenueCatPurchases } from '@/services/revenuecat';

export type PurchasePlan = 'weekly' | 'monthly';

export type PurchaseResult = {
  success: boolean;
  plan: PurchasePlan;
  transactionId: string;
};

export async function restorePurchases(): Promise<{ restored: boolean; activePlan: PurchasePlan | null }> {
  const { restored } = await restoreRevenueCatPurchases();
  return {
    restored,
    activePlan: restored ? 'monthly' : null,
  };
}
