import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RevenueCatPaywall } from '@/components/premium/revenuecat-paywall';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { useTranslation } from '@/contexts/locale-context';
import { usePremium } from '@/contexts/premium-context';
import { StyloveColors } from '@/constants/stylove-theme';
import { analytics } from '@/lib/analytics';

export default function PremiumScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { isPremium, refreshOfferings } = usePremium();

  useEffect(() => {
    analytics.capture('paywall_opened', { source: 'premium_screen' });
    void refreshOfferings();
  }, [refreshOfferings]);

  const handlePurchaseSuccess = () => {
    void refreshOfferings();
    router.back();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Pressable
        style={[styles.close, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t.common.close}>
        <Ionicons name="close" size={24} color={StyloveColors.ivory} />
      </Pressable>

      {isPremium ? (
        <View style={styles.premiumActive}>
          <Text style={styles.premiumActiveTitle}>{t.premium.title}</Text>
          <Text style={styles.premiumActiveMessage}>{t.premium.successMessage}</Text>
          <LuxuryButton label={t.premium.continueCta} variant="gold" onPress={() => router.back()} />
        </View>
      ) : (
        <RevenueCatPaywall onPurchaseSuccess={handlePurchaseSuccess} />
      )}
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
  premiumActive: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  premiumActiveTitle: {
    color: StyloveColors.ivory,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  premiumActiveMessage: {
    color: 'rgba(248,244,237,0.75)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
