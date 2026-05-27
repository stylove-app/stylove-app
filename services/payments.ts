/**
 * Payment service — mock purchases for MVP.
 * Connect RevenueCat or StoreKit / Play Billing here later.
 */

export type PurchasePlan = 'weekly' | 'monthly';

export type PurchaseResult = {
  success: boolean;
  plan: PurchasePlan;
  transactionId: string;
};

const MOCK_DELAY_MS = 900;

async function simulatePurchase(plan: PurchasePlan): Promise<PurchaseResult> {
  // TODO: RevenueCat — Purchases.purchasePackage(package)
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return {
    success: true,
    plan,
    transactionId: `mock-${plan}-${Date.now()}`,
  };
}

export async function purchaseWeekly(): Promise<PurchaseResult> {
  return simulatePurchase('weekly');
}

export async function purchaseMonthly(): Promise<PurchaseResult> {
  return simulatePurchase('monthly');
}

export async function restorePurchases(): Promise<{ restored: boolean; activePlan: PurchasePlan | null }> {
  // TODO: RevenueCat — Purchases.restorePurchases()
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return { restored: false, activePlan: null };
}
