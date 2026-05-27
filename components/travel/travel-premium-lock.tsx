import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { SoftEnter } from '@/components/ui/soft-enter';
import { StyloveLogo } from '@/components/brand/stylove-logo';
import { useTranslation } from '@/contexts/locale-context';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

export function TravelPremiumLock() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <SoftEnter>
        <View style={[styles.card, StyloveShadow.editorial]}>
          <View style={styles.glow} />
          <StyloveLogo size="sm" variant="light" />
          <GoldShimmerLine width={48} />
          <View style={styles.iconWrap}>
            <Ionicons name="airplane-outline" size={28} color={StyloveColors.goldSoft} />
          </View>
          <Text style={styles.title}>{t.travel.lockTitle}</Text>
          <Text style={styles.subtitle}>{t.travel.lockSubtitle}</Text>
          <LuxuryButton label={t.travel.lockCta} onPress={() => router.push('/premium')} variant="gold" />
        </View>
      </SoftEnter>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: StyloveColors.wineDeep,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: StyloveColors.burgundyRich,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.22)',
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: StyloveColors.wineLight,
    opacity: 0.18,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(212,184,120,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,250,242,0.06)',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: StyloveColors.creamText,
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(245,237,224,0.72)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8,
  },
});
