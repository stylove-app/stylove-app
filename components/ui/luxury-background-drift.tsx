import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { LUXURY_MOTION, luxuryEasing } from '@/constants/luxury-motion';
import { StyloveColors } from '@/constants/stylove-theme';

export function LuxuryBackgroundDrift() {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: LUXURY_MOTION.driftMs, easing: luxuryEasing }),
      -1,
      true,
    );
  }, [drift]);

  const burgundyOrb = useAnimatedStyle(() => ({
    opacity: 0.045 + drift.value * 0.035,
    transform: [
      { translateX: -18 + drift.value * 22 },
      { translateY: 12 - drift.value * 16 },
      { scale: 1 + drift.value * 0.04 },
    ],
  }));

  const creamOrb = useAnimatedStyle(() => ({
    opacity: 0.035 + (1 - drift.value) * 0.03,
    transform: [
      { translateX: 24 - drift.value * 20 },
      { translateY: -10 + drift.value * 14 },
      { scale: 1.02 - drift.value * 0.03 },
    ],
  }));

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.orb, styles.burgundy, burgundyOrb]} />
      <Animated.View style={[styles.orb, styles.cream, creamOrb]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  burgundy: {
    width: 320,
    height: 320,
    top: '18%',
    right: -80,
    backgroundColor: StyloveColors.burgundyRich,
  },
  cream: {
    width: 280,
    height: 280,
    bottom: '12%',
    left: -70,
    backgroundColor: StyloveColors.goldSoft,
  },
});
