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

        <View style={[styles.featureCard, StyloveShadow.editorial]}>
          <View style={styles.featureGlow} />
          {t.premium.benefits.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons name="checkmark" size={16} color={StyloveColors.goldSoft} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          <Text style={styles.plansIntro}>{t.premium.plansIntro}</Text>
          <Text style={styles.sameFeaturesNote}>{t.premium.sameFeaturesNote}</Text>
          <PlanCard
            title={t.premium.weeklyPlanTitle}
            subtitle={t.premium.weeklyPlanSubtitle}
            price={t.premium.weeklyPrice}
            cadence={t.premium.perWeek}
            cta={t.premium.inactiveCta}
          />
          <PlanCard
            title={t.premium.monthlyPlanTitle}
            subtitle={t.premium.monthlyPlanSubtitle}
            price={t.premium.monthlyPrice}
            cadence={t.premium.perMonth}
            cta={t.premium.inactiveCta}
            recommended={t.premium.recommended}
          />
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
    marginBottom: 24,
    gap: 12,
  },
  comingSoonBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 28,
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
    fontSize: 15,
    color: 'rgba(248,244,237,0.75)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
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
  featureCard: {
    gap: 14,
    marginBottom: 22,
    padding: 22,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: StyloveColors.goldMuted,
    backgroundColor: 'rgba(255,250,242,0.06)',
    overflow: 'hidden',
  },
  featureGlow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(196,160,98,0.16)',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  benefitText: {
    fontSize: 15,
    color: 'rgba(248,244,237,0.85)',
    letterSpacing: 0.2,
    flex: 1,
  },
  plans: {
    gap: 14,
    marginBottom: 24,
  },
  plansIntro: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: StyloveColors.ivory,
    textAlign: 'center',
    lineHeight: 24,
  },
  sameFeaturesNote: {
    fontSize: 13,
    color: 'rgba(248,244,237,0.62)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: 4,
  },
  planCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(248,244,237,0.13)',
    backgroundColor: 'rgba(255,250,242,0.05)',
    padding: 20,
    gap: 12,
    opacity: 0.92,
  },
  planCardRecommended: {
    borderColor: 'rgba(196,160,98,0.58)',
    backgroundColor: 'rgba(196,160,98,0.12)',
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  planTitle: {
    flex: 1,
    fontFamily: Fonts.serif,
    color: StyloveColors.ivory,
    fontSize: 21,
  },
  recommendedPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: StyloveColors.goldSoft,
  },
  recommendedText: {
    color: StyloveColors.wineDeep,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  planSubtitle: {
    color: 'rgba(248,244,237,0.68)',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  planPrice: {
    fontFamily: Fonts.serif,
    color: StyloveColors.ivory,
    fontSize: 30,
  },
  planCadence: {
    color: 'rgba(248,244,237,0.58)',
    fontSize: 13,
    paddingBottom: 5,
  },
  inactiveCta: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.22)',
    backgroundColor: 'rgba(255,250,242,0.06)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  inactiveCtaRecommended: {
    backgroundColor: 'rgba(196,160,98,0.22)',
    borderColor: 'rgba(196,160,98,0.35)',
  },
  inactiveCtaText: {
    color: StyloveColors.goldSoft,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inactiveCtaTextRecommended: {
    color: 'rgba(248,244,237,0.78)',
  },
  comparison: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.22)',
    overflow: 'hidden',
    marginBottom: 22,
  },
  compareHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,250,242,0.06)',
  },
  comparePlan: {
    width: 82,
    color: 'rgba(248,244,237,0.7)',
    textAlign: 'center',
    fontSize: 12,
  },
  comparePremium: {
    color: StyloveColors.goldSoft,
    fontWeight: '600',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196,160,98,0.14)',
    gap: 10,
  },
  compareLabel: {
    flex: 1,
    color: StyloveColors.creamText,
    fontSize: 13,
    lineHeight: 18,
  },
  compareValue: {
    width: 82,
    color: 'rgba(248,244,237,0.64)',
    textAlign: 'center',
    fontSize: 12,
  },
  note: {
    fontSize: 12,
    color: 'rgba(248,244,237,0.45)',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
