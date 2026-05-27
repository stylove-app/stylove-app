import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/contexts/locale-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';

type PremiumCtaProps = {
  label: string;
  variant?: 'banner' | 'card';
  onPress?: () => void;
};

export function PremiumCta({ label, variant = 'banner', onPress }: PremiumCtaProps) {
  const t = useTranslation();
  const { colors } = useTheme();

  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
    } else {
      router.push('/premium');
    }
  };

  if (variant === 'card') {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.wineDeep,
            borderColor: 'rgba(196,160,98,0.25)',
            opacity: pressed ? 0.92 : 1,
          },
          StyloveShadow.glow,
        ]}>
        <View style={[styles.glow, { backgroundColor: colors.burgundy }]} />
        <Text style={[styles.cardLabel, { color: colors.ivory }]}>{label}</Text>
        <Text style={styles.cardHint}>{t.premium.badgeHint}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.banner,
        {
          backgroundColor: colors.ivory,
          borderColor: colors.goldMuted,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      <Text style={[styles.bannerText, { color: colors.burgundy }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  bannerText: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    fontStyle: 'italic',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    gap: 6,
  },
  glow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.35,
  },
  cardLabel: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    letterSpacing: 0.3,
  },
  cardHint: {
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(212,184,120,0.85)',
  },
});
