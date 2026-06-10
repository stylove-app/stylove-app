import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RevenueCatDiagnosticSnapshot } from '@/lib/revenuecat-diagnostics';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

type RevenueCatDiagnosticPanelProps = {
  snapshot: RevenueCatDiagnosticSnapshot;
  loading: boolean;
  onRefresh: () => void;
};

function formatValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '[]';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function DiagnosticRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

export function RevenueCatDiagnosticPanel({
  snapshot,
  loading,
  onRefresh,
}: RevenueCatDiagnosticPanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>RevenueCat Diagnostics (temp)</Text>

      <DiagnosticRow label="hasApiKey" value={formatValue(snapshot.hasApiKey)} />
      <DiagnosticRow label="sdkConfigured" value={formatValue(snapshot.sdkConfigured)} />
      <DiagnosticRow label="configureResult" value={formatValue(snapshot.configureResult)} />
      <DiagnosticRow label="lastFetchStartedAt" value={formatValue(snapshot.lastFetchStartedAt)} />
      <DiagnosticRow label="lastFetchFinishedAt" value={formatValue(snapshot.lastFetchFinishedAt)} />
      <DiagnosticRow label="fetchResult" value={formatValue(snapshot.fetchResult)} />
      <DiagnosticRow label="getOfferingsError" value={formatValue(snapshot.getOfferingsError)} />
      <DiagnosticRow label="currentOfferingId" value={formatValue(snapshot.currentOfferingId)} />
      <DiagnosticRow
        label="allOfferingIds"
        value={snapshot.allOfferingIds.length ? snapshot.allOfferingIds.join(', ') : '[]'}
      />
      <DiagnosticRow label="defaultOfferingExists" value={formatValue(snapshot.defaultOfferingExists)} />
      <DiagnosticRow label="packageCount" value={formatValue(snapshot.packageCount)} />
      <DiagnosticRow
        label="productIds"
        value={snapshot.productIds.length ? snapshot.productIds.join(', ') : '[]'}
      />
      <DiagnosticRow
        label="packageIdentifiers"
        value={snapshot.packageIdentifiers.length ? snapshot.packageIdentifiers.join(', ') : '[]'}
      />
      <DiagnosticRow label="monthlyFound" value={formatValue(snapshot.monthlyFound)} />
      <DiagnosticRow label="lastRetryAt" value={formatValue(snapshot.lastRetryAt)} />

      <Pressable
        style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
        disabled={loading}
        onPress={onRefresh}
        accessibilityRole="button"
        accessibilityLabel="Refresh diagnostics">
        <Text style={styles.refreshLabel}>{loading ? 'Refreshing…' : 'Refresh diagnostics'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.35)',
    backgroundColor: 'rgba(0,0,0,0.28)',
    padding: 14,
    gap: 8,
  },
  heading: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    color: StyloveColors.goldSoft,
    marginBottom: 4,
  },
  row: {
    gap: 2,
  },
  label: {
    color: 'rgba(248,244,237,0.55)',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  value: {
    color: StyloveColors.ivory,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'monospace',
  },
  refreshButton: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.45)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  refreshButtonDisabled: {
    opacity: 0.55,
  },
  refreshLabel: {
    color: StyloveColors.goldSoft,
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
