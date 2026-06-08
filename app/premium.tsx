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
import { LuxuryButton } from '@/components/ui/luxury-button';
import { useTranslation } from '@/contexts/locale-context';
import { usePremium } from '@/contexts/premium-context';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import { analytics } from '@/lib/analytics';
import type { PurchasePlan } from '@/services/payments';

function paywallLog(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.log(`[premium] ${message}`, details);
    return;
  }
  console.log(`[premium] ${message}`);
}

type PlanCardProps = {
  plan: PurchasePlan;
  title: string;
  subtitle: string;
  price: string;
  cadence: string;
  cta: string;
  recommended?: string;
  packageReady: boolean;
  purchasesEnabled: boolean;
  loading?: boolean;
  onPurchase: (plan: PurchasePlan) => void;
};

function PlanCard({
  plan,
  title,
  subtitle,
  price,
  cadence,
  cta,
  recommended,
  packageReady,
  purchasesEnabled,
  loading = false,
  onPurchase,
}: PlanCardProps) {
  const isRecommended = Boolean(recommended);
  const canPurchase = purchasesEnabled && packageReady && !loading;

  const handleCtaPress = () => {
    paywallLog('CTA tap', {
      plan,
      packageReady,
      purchasesEnabled,
      loading,
      canPurchase,
    });
    if (!canPurchase) {
      Alert.alert(
        title,
        packageReady ? 'Purchase is unavailable right now.' : 'Subscription package is not loaded yet.',
      );
      return;
    }
    onPurchase(plan);
  };

  return (
    <View
      style={[
        styles.planCard,
        isRecommended && styles.planCardRecommended,
        StyloveShadow.soft,
      ]}>
      <View style={styles.planTopRow} pointerEvents="none">
        <Text style={styles.planTitle}>{title}</Text>
        {recommended ? (
          <View style={styles.recommendedPill}>
            <Text style={styles.recommendedText}>{recommended}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.planSubtitle} pointerEvents="none">
        {subtitle}
      </Text>
      <View style={styles.priceRow} pointerEvents="none">
        <Text style={styles.planPrice}>{price}</Text>
        <Text style={styles.planCadence}>{cadence}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canPurchase }}
        disabled={!canPurchase}
        onPress={handleCtaPress}
        hitSlop={8}
        style={({ pressed }) => [
          canPurchase ? styles.activeCta : styles.inactiveCta,
          isRecommended && (canPurchase ? styles.activeCtaRecommended : styles.inactiveCtaRecommended),
          pressed && canPurchase && styles.planCtaPressed,
        ]}>
        {loading ? (
          <ActivityIndicator size="small" color={StyloveColors.goldSoft} />
        ) : (
          <Text
            pointerEvents="none"
            style={[
              canPurchase ? styles.activeCtaText : styles.inactiveCtaText,
              isRecommended &&
                (canPurchase ? styles.activeCtaTextRecommended : styles.inactiveCtaTextRecommended),
            ]}>
            {cta}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

export default function PremiumScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    isPremium,
    packagesLoading,
    offeringsAvailable,
    weeklyPackage,
    monthlyPackage,
    purchasePlan,
    restorePurchases,
    refreshOfferings,
  } = usePremium();

  const [busyPlan, setBusyPlan] = useState<PurchasePlan | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    analytics.capture('paywall_opened', { source: 'premium_screen' });
    void refreshOfferings();
  }, [refreshOfferings]);

  const purchasesEnabled = offeringsAvailable && !isPremium;

  const handlePurchase = useCallback(
    async (plan: PurchasePlan) => {
      paywallLog('handlePurchase start', {
        plan,
        busyPlan,
        isPremium,
        purchasesEnabled,
        hasWeekly: Boolean(weeklyPackage),
        hasMonthly: Boolean(monthlyPackage),
      });

      if (busyPlan) {
        paywallLog('handlePurchase blocked: busy', { busyPlan });
        return;
      }

      if (isPremium) {
        Alert.alert(t.premium.title, t.premium.successMessage);
        return;
      }

      const pkg = plan === 'weekly' ? weeklyPackage : monthlyPackage;
      if (!pkg) {
        paywallLog('handlePurchase blocked: missing package', { plan });
        Alert.alert(t.premium.title, t.premium.purchaseError);
        return;
      }

      paywallLog('purchase start', {
        plan,
        packageId: pkg.identifier,
        productId: pkg.product.identifier,
        price: pkg.product.priceString,
      });

      setBusyPlan(plan);
      try {
        const result = await purchasePlan(plan);
        if (result.ok) {
          paywallLog('purchase success', { plan });
          Alert.alert(t.premium.successTitle, t.premium.successMessage, [
            { text: t.premium.continueCta, onPress: () => router.back() },
          ]);
          return;
        }

        if (result.cancelled) {
          paywallLog('purchase cancelled', { plan });
          return;
        }

        paywallLog('purchase failure', { plan, message: result.message });
        Alert.alert(t.premium.title, result.message ?? t.premium.purchaseError);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        paywallLog('purchase threw', { plan, message });
        Alert.alert(t.premium.title, message || t.premium.purchaseError);
      } finally {
        setBusyPlan(null);
      }
    },
    [
      busyPlan,
      isPremium,
      monthlyPackage,
      purchasePlan,
      purchasesEnabled,
      t.premium.continueCta,
      t.premium.purchaseError,
      t.premium.successMessage,
      t.premium.successTitle,
      t.premium.title,
      weeklyPackage,
    ],
  );

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

  const weeklyPrice = weeklyPackage?.product.priceString ?? t.premium.weeklyPrice;

  const handleDebugPurchase = async () => {
    paywallLog('debug purchase button tapped');
    Alert.alert('Tap works');
    Alert.alert('Monthly tap received');
    try {
      const result = await purchasePlan('monthly');
      paywallLog('debug purchasePlan finished', {
        ok: result.ok,
        cancelled: !result.ok ? result.cancelled : false,
        message: !result.ok ? result.message : undefined,
      });
      if (!result.ok && !result.cancelled) {
        Alert.alert('Debug purchase failed', result.message ?? 'Unknown error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      paywallLog('debug purchasePlan threw', { message });
      Alert.alert('Debug purchase threw', message);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Debug purchase monthly"
        onPress={() => void handleDebugPurchase()}
        style={[styles.debugPurchaseButton, { top: insets.top + 8 }]}>
        <Text style={styles.debugPurchaseButtonText}>DEBUG: Buy Monthly</Text>
      </Pressable>

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
        <View style={styles.hero}>
          <StyloveLogo size="md" variant="light" />
          <Text style={styles.eyebrow}>{t.premium.paywallEyebrow}</Text>
          <Text style={styles.title}>{t.premium.title}</Text>
          <Text style={styles.subtitle}>{t.premium.subtitle}</Text>
        </View>

        <View style={styles.pricingSection}>
          <Text style={styles.plansIntro}>{t.premium.plansIntro}</Text>
          <Text style={styles.sameFeaturesNote}>{t.premium.sameFeaturesNote}</Text>
          <PlanCard
            plan="monthly"
            title={t.premium.monthlyPlanTitle}
            subtitle={t.premium.monthlyPlanSubtitle}
            price={monthlyPackage?.product.priceString ?? t.premium.monthlyPrice}
            cadence={t.premium.perMonth}
            cta={isPremium ? t.premium.inactiveCta : t.premium.ctaMonthly}
            recommended={t.premium.recommended}
            packageReady={Boolean(monthlyPackage)}
            purchasesEnabled={purchasesEnabled}
            loading={busyPlan === 'monthly'}
            onPurchase={handlePurchase}
          />
          <PlanCard
            plan="weekly"
            title={t.premium.weeklyPlanTitle}
            subtitle={t.premium.weeklyPlanSubtitle}
            price={weeklyPrice}
            cadence={t.premium.perWeek}
            cta={isPremium ? t.premium.inactiveCta : t.premium.ctaWeekly}
            packageReady={Boolean(weeklyPackage)}
            purchasesEnabled={purchasesEnabled}
            loading={busyPlan === 'weekly'}
            onPurchase={handlePurchase}
          />
        </View>

        {!purchasesEnabled && !isPremium ? (
          <View style={styles.comingSoonBanner} accessibilityRole="text">
            <Ionicons name="sparkles-outline" size={18} color={StyloveColors.goldSoft} />
            <View style={styles.comingSoonCopy}>
              <Text style={styles.comingSoonTitle}>
                {packagesLoading ? t.premium.loadingPlansTitle : t.premium.comingSoonTitle}
              </Text>
              <Text style={styles.comingSoonMessage}>
                {packagesLoading ? t.premium.loadingPlansMessage : t.premium.comingSoonMessage}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.planGrid}>
          <View style={[styles.accessCard, styles.freeCard]}>
            <Text style={styles.accessTitle}>{t.premium.freeTitle}</Text>
            {t.premium.freeFeatures.map((feature) => (
              <View key={feature} style={styles.accessRow}>
                <Ionicons name="ellipse" size={6} color="rgba(248,244,237,0.5)" />
                <Text style={styles.accessText}>{feature}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.accessCard, styles.premiumCard]}>
            <Text style={[styles.accessTitle, styles.accessTitlePremium]}>{t.premium.premiumTitle}</Text>
            {t.premium.premiumFeatures.map((feature) => (
              <View key={feature} style={styles.accessRow}>
                <Ionicons name="checkmark" size={15} color={StyloveColors.goldSoft} />
                <Text style={[styles.accessText, styles.accessTextPremium]}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.comparison}>
          <View style={styles.compareHeader}>
            <Text style={styles.comparePlan}>{t.premium.freeTitle}</Text>
            <Text style={[styles.comparePlan, styles.comparePremium]}>{t.premium.premiumTitle}</Text>
          </View>
          {t.premium.comparison.map((row) => (
            <View key={row.label} style={styles.compareRow}>
              <Text style={styles.compareLabel}>{row.label}</Text>
              <Text style={styles.compareValue}>{row.free}</Text>
              <Text style={[styles.compareValue, styles.comparePremium]}>{row.premium}</Text>
            </View>
          ))}
        </View>

        {isPremium ? (
          <LuxuryButton label={t.premium.continueCta} variant="gold" onPress={() => router.back()} />
        ) : purchasesEnabled ? (
          <LuxuryButton
            label={t.premium.ctaMonthly}
            variant="gold"
            disabled={!monthlyPackage || busyPlan !== null}
            onPress={() => {
              paywallLog('bottom CTA tap', { plan: 'monthly', hasMonthly: Boolean(monthlyPackage) });
              void handlePurchase('monthly');
            }}
          />
        ) : (
          <LuxuryButton label={t.premium.inactiveCta} variant="gold" disabled />
        )}

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

        <Text style={styles.note}>{purchasesEnabled ? t.premium.note : t.premium.inactiveNote}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: StyloveColors.wineDeep,
  },
  debugPurchaseButton: {
    position: 'absolute',
    left: 16,
    right: 72,
    zIndex: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
  },
  debugPurchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
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
  },
  hero: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  pricingSection: {
    gap: 14,
    marginBottom: 24,
  },
  comingSoonBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 22,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.28)',
    backgroundColor: 'rgba(196,160,98,0.08)',
  },
  comingSoonCopy: {
    flex: 1,
    gap: 4,
  },
  comingSoonTitle: {
    color: StyloveColors.goldSoft,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  comingSoonMessage: {
    color: 'rgba(248,244,237,0.72)',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
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
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(248,244,237,0.75)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 19,
  },
  planGrid: {
    gap: 14,
    marginBottom: 22,
  },
  accessCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  freeCard: {
    borderColor: 'rgba(248,244,237,0.12)',
    backgroundColor: 'rgba(255,250,242,0.04)',
  },
  premiumCard: {
    borderColor: 'rgba(196,160,98,0.34)',
    backgroundColor: 'rgba(196,160,98,0.08)',
  },
  accessTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: 'rgba(248,244,237,0.78)',
    marginBottom: 2,
  },
  accessTitlePremium: {
    color: StyloveColors.goldSoft,
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accessText: {
    flex: 1,
    color: 'rgba(248,244,237,0.68)',
    fontSize: 13,
    lineHeight: 18,
  },
  accessTextPremium: {
    color: 'rgba(248,244,237,0.9)',
  },
  plansIntro: {
    color: StyloveColors.goldSoft,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  sameFeaturesNote: {
    color: 'rgba(248,244,237,0.62)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  planCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(248,244,237,0.14)',
    backgroundColor: 'rgba(255,250,242,0.06)',
    padding: 20,
    gap: 8,
  },
  planCardRecommended: {
    borderColor: 'rgba(196,160,98,0.45)',
    backgroundColor: 'rgba(196,160,98,0.12)',
  },
  planCtaPressed: {
    opacity: 0.88,
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  planTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: StyloveColors.ivory,
    flex: 1,
  },
  recommendedPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(196,160,98,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.35)',
  },
  recommendedText: {
    color: StyloveColors.goldSoft,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '700',
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
  inactiveCta: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248,244,237,0.2)',
    alignItems: 'center',
  },
  inactiveCtaRecommended: {
    borderColor: 'rgba(196,160,98,0.4)',
    backgroundColor: 'rgba(196,160,98,0.1)',
  },
  inactiveCtaText: {
    color: 'rgba(248,244,237,0.55)',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  inactiveCtaTextRecommended: {
    color: StyloveColors.goldSoft,
  },
  activeCta: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.55)',
    backgroundColor: 'rgba(196,160,98,0.22)',
    alignItems: 'center',
  },
  activeCtaRecommended: {
    borderColor: 'rgba(196,160,98,0.65)',
    backgroundColor: 'rgba(196,160,98,0.28)',
  },
  activeCtaText: {
    color: StyloveColors.ivory,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  activeCtaTextRecommended: {
    color: StyloveColors.goldSoft,
  },
  comparison: {
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(248,244,237,0.1)',
    overflow: 'hidden',
  },
  compareHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,250,242,0.06)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  comparePlan: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(248,244,237,0.55)',
  },
  comparePremium: {
    color: StyloveColors.goldSoft,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(248,244,237,0.08)',
  },
  compareLabel: {
    flex: 1.2,
    color: 'rgba(248,244,237,0.75)',
    fontSize: 12,
  },
  compareValue: {
    flex: 1,
    textAlign: 'center',
    color: 'rgba(248,244,237,0.55)',
    fontSize: 12,
  },
  restoreLink: {
    marginTop: 16,
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
    marginTop: 16,
    textAlign: 'center',
    color: 'rgba(248,244,237,0.5)',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
