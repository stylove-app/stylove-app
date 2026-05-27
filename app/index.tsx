import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StyloveLogo } from '@/components/brand/stylove-logo';
import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { softFadeIn, softFadeInDown } from '@/constants/luxury-motion';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/contexts/locale-context';

const SPLASH_MS = 1800;

export default function WelcomeScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable style={styles.screen} onPress={() => router.replace('/(tabs)')}>
      <View style={[styles.inner, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <Animated.View entering={softFadeIn(0)} style={styles.logoWrap}>
          <StyloveLogo size="lg" variant="light" />
        </Animated.View>

        <Animated.View entering={softFadeInDown(280)} style={styles.shimmerWrap}>
          <GoldShimmerLine width={56} />
        </Animated.View>

        <Animated.View entering={softFadeInDown(420)}>
          <Text style={styles.tagline}>{t.welcome.tagline}</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: StyloveColors.wineDeep,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: StyloveColors.burgundy,
    opacity: 0.28,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: StyloveColors.wineLight,
    opacity: 0.14,
  },
  logoWrap: {
    marginBottom: 18,
  },
  shimmerWrap: {
    marginBottom: 22,
  },
  tagline: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: StyloveColors.ivory,
    textAlign: 'center',
    letterSpacing: 0.3,
    fontStyle: 'italic',
    opacity: 0.92,
  },
});
