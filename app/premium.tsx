import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StyloveLogo } from '@/components/brand/stylove-logo';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { LuxuryConfirmationModal } from '@/components/ui/luxury-confirmation-modal';
import { usePremium } from '@/contexts/premium-context';
import { useTranslation } from '@/contexts/locale-context';
import { hapticLight } from '@/lib/haptics';
import { purchaseMonthly, purchaseWeekly, restorePurchases } from '@/services/payments';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type Plan = 'weekly' | 'monthly';

export default function PremiumScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { activatePremium } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('monthly');
  const [loading, setLoading] = useState<Plan | 'restore' | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const handlePurchase = async (plan: Plan) => {
    setLoading(plan);
    try {
      const result = plan === 'weekly' ? await purchaseWeekly() : await purchaseMonthly();
      if (result.success) {
        await activatePremium(plan);
        setSuccessVisible(true);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    setLoading('restore');
    try {
      await restorePurchases();
    } finally {
      setLoading(null);
    }
  };

  const closeSuccess = () => {
    setSuccessVisible(false);
    router.back();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Pressable
        style={styles.close}
        onPress={() => {
          void hapticLight();
          router.back();
        }}
        hitSlop={12}>
        <Ionicons name="close" size={24} color={StyloveColors.ivory} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.hero}>
          <StyloveLogo size="md" variant="light" />
          <Text style={styles.title}>{t.premium.title}</Text>
          <Text style={styles.subtitle}>{t.premium.subtitle}</Text>
        </View>

        <View style={styles.plans}>
          <Pressable
            onPress={() => {
              void hapticLight();
              setSelectedPlan('weekly');
            }}
            style={({ pressed }) => [
              styles.planCard,
              selectedPlan === 'weekly' && styles.planActive,
              pressed && styles.planPressed,
            ]}>
            <Text style={[styles.planLabel, selectedPlan === 'weekly' && styles.planLabelActive]}>
              {t.premium.weekly}
            </Text>
            <Text style={[styles.planPrice, selectedPlan === 'weekly' && styles.planPriceActive]}>
              {t.premium.weeklyPrice}
            </Text>
            <Text style={styles.planPeriod}>{t.premium.perWeek}</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void hapticLight();
              setSelectedPlan('monthly');
            }}
            style={({ pressed }) => [
              styles.planCard,
              selectedPlan === 'monthly' && styles.planActive,
              pressed && styles.planPressed,
            ]}>
            <Text style={[styles.planLabel, selectedPlan === 'monthly' && styles.planLabelActive]}>
              {t.premium.monthly}
            </Text>
            <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceActive]}>
              {t.premium.monthlyPrice}
            </Text>
            <Text style={styles.planPeriod}>{t.premium.perMonth}</Text>
          </Pressable>
        </View>

        <View style={styles.benefits}>
          {t.premium.benefits.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <LuxuryButton
            label={t.premium.ctaWeekly}
            onPress={() => handlePurchase('weekly')}
            variant={selectedPlan === 'weekly' ? 'gold' : 'secondary'}
            style={styles.actionBtn}
            disabled={loading !== null}
          />
          <LuxuryButton
            label={t.premium.ctaMonthly}
            onPress={() => handlePurchase('monthly')}
            variant={selectedPlan === 'monthly' ? 'gold' : 'secondary'}
            style={styles.actionBtn}
            disabled={loading !== null}
          />
        </View>

        <Pressable onPress={handleRestore} disabled={loading !== null} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>{t.premium.restore}</Text>
        </Pressable>

        <Text style={styles.note}>{t.premium.note}</Text>
      </ScrollView>

      <LuxuryConfirmationModal
        visible={successVisible}
        title={t.premium.successTitle}
        subtitle={t.premium.successMessage}
        buttonLabel={t.premium.continueCta}
        onClose={closeSuccess}
        variant="dark"
      />
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
    top: 56,
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
    marginBottom: 36,
    gap: 12,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    color: StyloveColors.ivory,
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(248,244,237,0.75)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  plans: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  planCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(248,244,237,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    gap: 6,
  },
  planActive: {
    borderColor: StyloveColors.goldMuted,
    backgroundColor: 'rgba(255,255,255,0.12)',
    ...StyloveShadow.glow,
  },
  planPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  planLabel: {
    fontSize: 12,
    letterSpacing: 0.2,
    color: 'rgba(248,244,237,0.6)',
  },
  planLabelActive: {
    color: StyloveColors.goldMuted,
  },
  planPrice: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: StyloveColors.ivory,
    textAlign: 'center',
  },
  planPriceActive: {
    color: StyloveColors.ivory,
  },
  planPeriod: {
    fontSize: 11,
    color: 'rgba(248,244,237,0.5)',
    fontStyle: 'italic',
  },
  benefits: {
    marginBottom: 28,
    gap: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: StyloveColors.goldMuted,
  },
  benefitText: {
    fontSize: 15,
    color: 'rgba(248,244,237,0.85)',
    letterSpacing: 0.2,
    flex: 1,
  },
  actions: {
    gap: 12,
    marginBottom: 8,
  },
  actionBtn: {
    width: '100%',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 12,
    color: StyloveColors.goldSoft,
    letterSpacing: 0.6,
    textDecorationLine: 'underline',
  },
  note: {
    fontSize: 12,
    color: 'rgba(248,244,237,0.45)',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
