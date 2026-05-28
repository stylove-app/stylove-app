import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { BRAND_NAME } from '@/constants/brand';
import { LUXURY_MOTION, luxuryEasing, softFadeIn } from '@/constants/luxury-motion';
import { useTheme } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';

export function StyloveFooter() {
  const { colors } = useTheme();
  const breath = useSharedValue(0.3);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(0.46, { duration: LUXURY_MOTION.breathMs, easing: luxuryEasing }),
      -1,
      true,
    );
  }, [breath]);

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: breath.value,
  }));

  return (
    <Animated.View entering={softFadeIn(80)} style={styles.wrap}>
      <GoldShimmerLine width={28} />
      <Animated.Text style={[styles.wordmark, { color: colors.goldMuted }, wordmarkStyle]}>
        {BRAND_NAME}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    gap: 14,
  },
  wordmark: {
    fontFamily: Fonts.serif,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
