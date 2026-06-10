import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StyloveLogo } from '@/components/brand/stylove-logo';
import { RevenueCatDiagnosticPanel } from '@/components/premium/revenuecat-diagnostic-panel';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { useTranslation } from '@/contexts/locale-context';
import { usePremium } from '@/contexts/premium-context';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import { analytics } from '@/lib/analytics';
import {
  getRevenueCatDiagnosticSnapshot,
  markRevenueCatRetry,
  refreshRevenueCatDiagnostics,
  type RevenueCatDiagnosticSnapshot,
} from '@/lib/revenuecat-diagnostics';

export default function PremiumScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    isPremium,
    monthlyPackage,
    packagesLoading,
    purchaseMonthly,
    restorePurchases,
    refreshOfferings,
  } = usePremium();

  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [titleTapCount, setTitleTapCount] = useState(0);
  const [diagnostics, setDiagnostics] = useState<RevenueCatDiagnosticSnapshot>(
    getRevenueCatDiagnosticSnapshot,
  );
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

  const runDiagnostics = useCallback(async () => {
    setDiagnosticsLoading(true);
    try {
      const snapshot = await refreshRevenueCatDiagnostics();
      setDiagnostics(snapshot);
    } finally {
      setDiagnosticsLoading(false);
    }
  }, []);

  const handleTitleTap = useCallback(() => {
    setTitleTapCount((count) => {
      const next = count + 1;
      if (next >= 5) {
        setDebugOpen((open) => {
          const willOpen = !open;
          if (willOpen) {
            void runDiagnostics();
          }
          return willOpen;
        });
        return 0;
      }
      return next;
    });
  }, [runDiagnostics]);

  useEffect(() => {
    analytics.capture('paywall_opened', { source: 'premium_screen' });
    console.log('[paywall] mount: refreshing offerings', {
      monthlyPackage: Boolean(monthlyPackage),
      packagesLoading,
    });
    void refreshOfferings().then((result) => {
      console.log('[paywall] mount: refresh complete', result);
    });
  }, [refreshOfferings]);

  const displayPrice = monthlyPackage?.product.priceString ?? t.premium.monthlyPrice;
  const packageReady = Boolean(monthlyPackage);

  const ctaLabel = packageReady
    ? t.premium.ctaMonthly
    : packagesLoading
      ? 'Paket hazırlanıyor'
      : 'Yeniden dene';

  const ctaDisabled = packageReady ? busy : packagesLoading;

  const handlePurchase = useCallback(async () => {
    console.log('[paywall] purchase:start', {
      monthlyPackage: Boolean(monthlyPackage),
      packageId: monthlyPackage?.identifier ?? null,
      productId: monthlyPackage?.product?.identifier ?? null,
      busy,
    });

    if (!monthlyPackage || busy) {
      console.log('[paywall] purchase:blocked', {
        reason: !monthlyPackage ? 'no_monthly_package' : 'busy',
      });
      return;
    }

    setBusy(true);
    try {
      const result = await purchaseMonthly();
      console.log('[paywall] purchase:result', {
        ok: result.ok,
        cancelled: !result.ok && result.cancelled,
        message: !result.ok ? result.message : undefined,
      });
      if (result.ok) {
        Alert.alert(t.premium.successTitle, t.premium.successMessage, [
          { text: t.premium.continueCta, onPress: () => router.back() },
        ]);
        return;
      }
      if (!result.cancelled) {
        Alert.alert(t.premium.title, result.message ?? t.premium.purchaseError);
      }
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    monthlyPackage,
    purchaseMonthly,
    t.premium.continueCta,
    t.premium.purchaseError,
    t.premium.successMessage,
    t.premium.successTitle,
    t.premium.title,
  ]);

  const handleCtaPress = () => {
    console.log('[paywall] cta:pressed', {
      packageReady,
      packagesLoading,
      busy,
      ctaDisabled: ctaDisabled || busy,
      ctaLabel,
      monthlyPackage: Boolean(monthlyPackage),
      displayPrice,
      priceFromStore: Boolean(monthlyPackage?.product.priceString),
    });

    if (packageReady) {
      void handlePurchase();
      return;
    }

    if (packagesLoading) {
      console.log('[paywall] cta:ignored — packagesLoading');
      return;
    }

    markRevenueCatRetry();
    setDiagnostics((prev) => ({ ...prev, lastRetryAt: new Date().toISOString() }));

    console.log('[paywall] cta:retry — calling refreshOfferings');
    void refreshOfferings().then((result) => {
      console.log('[paywall] cta:retry complete', result);
      if (!result.monthlyFound) {
        Alert.alert(
          t.premium.title,
          result.offeringsFetched
            ? 'Abonelik paketi bulunamadı. RevenueCat offering veya package eşleşmesini kontrol edin.'
            : 'Abonelikler yüklenemedi. RevenueCat yapılandırmasını ve ağ bağlantısını kontrol edin.',
        );
      }
    });
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const { restored } = await restorePurchases();
      if (restored) {
        Alert.alert(t.premium.restoreTitle, t.premium.restoreSuccess, [
          { text: t.premium.continueCta, onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(t.premium.restoreTitle, t.premium.restoreEmpty);
      }
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Pressable
        style={[styles.close, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t.common.close}>
        <Ionicons name="close" size={24} color={StyloveColors.ivory} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {isPremium ? (
          <View style={styles.premiumActive}>
            <StyloveLogo size="md" variant="light" />
            <Text style={styles.title}>{t.premium.title}</Text>
            <Text style={styles.subtitle}>{t.premium.successMessage}</Text>
            <LuxuryButton label={t.premium.continueCta} variant="gold" onPress={() => router.back()} />
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <StyloveLogo size="md" variant="light" />
              <Text style={styles.eyebrow}>{t.premium.paywallEyebrow}</Text>
              <Pressable onPress={handleTitleTap} accessibilityRole="button">
                <Text style={styles.title}>{t.premium.title}</Text>
              </Pressable>
              <Text style={styles.subtitle}>{t.premium.subtitle}</Text>
            </View>

            {debugOpen ? (
              <RevenueCatDiagnosticPanel
                snapshot={diagnostics}
                loading={diagnosticsLoading}
                onRefresh={() => void runDiagnostics()}
              />
            ) : null}

            <View style={styles.planCard}>
              <Text style={styles.planTitle}>{t.premium.monthlyPlanTitle}</Text>
              <Text style={styles.planSubtitle}>{t.premium.monthlyPlanSubtitle}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.planPrice}>{displayPrice}</Text>
                <Text style={styles.planCadence}>{t.premium.perMonth}</Text>
              </View>
              {t.premium.premiumFeatures.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Ionicons name="checkmark" size={15} color={StyloveColors.goldSoft} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <LuxuryButton
              label={busy ? 'İşleniyor…' : ctaLabel}
              variant="gold"
              disabled={ctaDisabled || busy}
              onPress={handleCtaPress}
            />

            <Pressable
              onPress={() => void handleRestore()}
              disabled={restoring || packagesLoading}
              style={styles.restoreLink}
              accessibilityRole="button">
              {restoring ? (
                <ActivityIndicator size="small" color={StyloveColors.goldSoft} />
              ) : (
                <Text style={styles.restoreText}>{t.premium.restore}</Text>
              )}
            </Pressable>

            <Text style={styles.note}>{t.premium.note}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: StyloveColors.wineDeep,
  },
  close: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 48,
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  eyebrow: {
    color: StyloveColors.goldSoft,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    color: StyloveColors.ivory,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(248,244,237,0.75)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 19,
  },
  planCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.45)',
    backgroundColor: 'rgba(196,160,98,0.12)',
    padding: 20,
    gap: 10,
  },
  planTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: StyloveColors.ivory,
  },
  planSubtitle: {
    color: 'rgba(248,244,237,0.65)',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  planPrice: {
    fontFamily: Fonts.serif,
    fontSize: 36,
    color: StyloveColors.goldSoft,
    letterSpacing: 0.3,
  },
  planCadence: {
    color: 'rgba(248,244,237,0.55)',
    fontSize: 13,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    color: 'rgba(248,244,237,0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
  restoreLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  restoreText: {
    color: StyloveColors.goldSoft,
    fontSize: 12,
    letterSpacing: 0.4,
    textDecorationLine: 'underline',
  },
  note: {
    textAlign: 'center',
    color: 'rgba(248,244,237,0.5)',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  premiumActive: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 16,
  },
});
