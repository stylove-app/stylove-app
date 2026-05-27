import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { LUXURY_MOTION, luxuryEasing } from '@/constants/luxury-motion';
import { StyloveColors } from '@/constants/stylove-theme';

type SkeletonShimmerProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function SkeletonShimmer({
  width = '100%',
  height = 16,
  borderRadius = 12,
  style,
}: SkeletonShimmerProps) {
  const opacity = useSharedValue(0.38);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.62, { duration: LUXURY_MOTION.shimmerMs, easing: luxuryEasing }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.base, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmer, { borderRadius }, animatedStyle]} />
    </View>
  );
}

export function SkeletonWeatherLine() {
  return <SkeletonShimmer width={180} height={12} borderRadius={6} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: StyloveColors.cream,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: StyloveColors.creamRich,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: StyloveColors.goldSoft,
    opacity: 0.28,
  },
});
