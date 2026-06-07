import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { StyloveLogo } from '@/components/brand/stylove-logo';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { useTranslation } from '@/contexts/locale-context';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { analytics } from '@/lib/analytics';

type PlanCardProps = {
  title: string;
  subtitle: string;
  price: string;
  cadence: string;
  cta: string;
  recommended?: string;
};

function PlanCard({ title, subtitle, price, cadence, cta, recommended }: PlanCardProps) {
  const isRecommended = Boolean(recommended);
  return (
    <View
      accessibilityRole="text"
      accessibilityState={{ disabled: true }}
      style={[
        styles.planCard,
        isRecommended && styles.planCardRecommended,
        StyloveShadow.soft,
      ]}>
      <View style={styles.planTopRow}>
        <Text style={styles.planTitle}>{title}</Text>
        {recommended ? (
          <View style={styles.recommendedPill}>
            <Text style={styles.recommendedText}>{recommended}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.planSubtitle}>{subtitle}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.planPrice}>{price}</Text>
        <Text style={styles.planCadence}>{cadence}</Text>
      </View>
      <View style={[styles.inactiveCta, isRecommended && styles.inactiveCtaRecommended]}>
        <Text style={[styles.inactiveCtaText, isRecommended && styles.inactiveCtaTextRecommended]}>{cta}</Text>
      </View>
    </View>
  );
}

export default function PremiumScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    analytics.capture('paywall_opened', { source: 'premium_screen' });
  }, []);

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
            title={t.premium.monthlyPlanTitle}
            subtitle={t.premium.monthlyPlanSubtitle}
            price={t.premium.monthlyPrice}
            cadence={t.premium.perMonth}
            cta={t.premium.inactiveCta}
            recommended={t.premium.recommended}
          />
          <PlanCard
            title={t.premium.weeklyPlanTitle}
            subtitle={t.premium.weeklyPlanSubtitle}
            price={t.premium.weeklyPrice}
            cadence={t.premium.perWeek}
            cta={t.premium.inactiveCta}
          />
        </View>

        <View style={styles.comingSoonBanner} accessibilityRole="text">
          <Ionicons name="sparkles-outline" size={18} color={StyloveColors.goldSoft} />
          <View style={styles.comingSoonCopy}>
            <Text style={styles.comingSoonTitle}>{t.premium.comingSoonTitle}</Text>
            <Text style={styles.comingSoonMessage}>{t.premium.comingSoonMessage}</Text>
          </View>
        </View>

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

        <LuxuryButton label={t.premium.inactiveCta} variant="gold" disabled />

        <Text style={styles.note}>{t.premium.inactiveNote}</Text>
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
    transform: [{ scale: 1.02 }],
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
  note: {
    marginTop: 16,
    textAlign: 'center',
    color: 'rgba(248,244,237,0.5)',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
