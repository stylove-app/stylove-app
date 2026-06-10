import { isRevenueCatConfigured } from '@/lib/revenuecat-config';
import {
  configureRevenueCat,
  isRevenueCatSdkConfigured,
  probeRevenueCatOfferings,
  snapshotOfferingDetails,
} from '@/services/revenuecat';

export type RevenueCatDiagnosticSnapshot = {
  hasApiKey: boolean;
  sdkConfigured: boolean;
  configureResult: boolean;
  lastFetchStartedAt: string | null;
  lastFetchFinishedAt: string | null;
  fetchResult: 'idle' | 'ok' | 'null' | 'error';
  getOfferingsError: string | null;
  currentOfferingId: string | null;
  allOfferingIds: string[];
  defaultOfferingExists: boolean;
  packageCount: number;
  productIds: string[];
  packageIdentifiers: string[];
  monthlyFound: boolean;
  lastRetryAt: string | null;
};

const emptySnapshot = (): RevenueCatDiagnosticSnapshot => ({
  hasApiKey: isRevenueCatConfigured(),
  sdkConfigured: isRevenueCatSdkConfigured(),
  configureResult: false,
  lastFetchStartedAt: null,
  lastFetchFinishedAt: null,
  fetchResult: 'idle',
  getOfferingsError: null,
  currentOfferingId: null,
  allOfferingIds: [],
  defaultOfferingExists: false,
  packageCount: 0,
  productIds: [],
  packageIdentifiers: [],
  monthlyFound: false,
  lastRetryAt: null,
});

let cachedSnapshot: RevenueCatDiagnosticSnapshot = emptySnapshot();
let lastRetryAt: string | null = null;

export function markRevenueCatRetry(): void {
  lastRetryAt = new Date().toISOString();
  cachedSnapshot = { ...cachedSnapshot, lastRetryAt };
}

export function getRevenueCatDiagnosticSnapshot(): RevenueCatDiagnosticSnapshot {
  return {
    ...cachedSnapshot,
    hasApiKey: isRevenueCatConfigured(),
    sdkConfigured: isRevenueCatSdkConfigured(),
    lastRetryAt,
  };
}

export async function refreshRevenueCatDiagnostics(): Promise<RevenueCatDiagnosticSnapshot> {
  const startedAt = new Date().toISOString();
  const configureResult = await configureRevenueCat();
  const probe = await probeRevenueCatOfferings();
  const offeringDetails = snapshotOfferingDetails(probe.offerings);
  const finishedAt = new Date().toISOString();

  cachedSnapshot = {
    hasApiKey: isRevenueCatConfigured(),
    sdkConfigured: isRevenueCatSdkConfigured(),
    configureResult,
    lastFetchStartedAt: startedAt,
    lastFetchFinishedAt: finishedAt,
    fetchResult: probe.fetchResult,
    getOfferingsError: probe.errorMessage,
    lastRetryAt,
    ...offeringDetails,
  };

  return getRevenueCatDiagnosticSnapshot();
}
