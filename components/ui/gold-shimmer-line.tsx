import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { LUXURY_MOTION, luxuryEasing } from '@/constants/luxury-motion';
import { StyloveColors } from '@/constants/stylove-theme';

type GoldShimmerLineProps = {
  width?: number;
  style?: ViewStyle;
  height?: number;
};

export function GoldShimmerLine({ width = 32, style, height = 1 }: GoldShimmerLineProps) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: LUXURY_MOTION.shimmerMs, easing: luxuryEasing }),
      -1,
      true,
    );
  }, [drift]);

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + drift.value * 0.22,
    transform: [{ translateX: -width * 0.18 + drift.value * width * 0.36 }],
  }));

  return (
    <View style={[styles.track, { width, height }, style]}>
      <View style={[styles.base, { height }]} />
      <Animated.View style={[styles.highlight, { width: width * 0.42, height }, highlightStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    alignSelf: 'center',
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: StyloveColors.goldMuted,
    opacity: 0.28,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: StyloveColors.goldSoft,
    borderRadius: 1,
  },
});
