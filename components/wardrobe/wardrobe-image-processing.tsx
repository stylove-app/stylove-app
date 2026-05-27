import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { LUXURY_MOTION } from '@/constants/luxury-motion';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

type WardrobeImageProcessingProps = {
  visible: boolean;
  messages: readonly string[];
  intervalMs?: number;
};

export function WardrobeImageProcessing({
  visible,
  messages,
  intervalMs = 1800,
}: WardrobeImageProcessingProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [visible, messages.length, intervalMs]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <GoldShimmerLine width={48} />
      <ActivityIndicator color={StyloveColors.goldMuted} size="small" style={styles.spinner} />
      <Animated.Text
        key={messages[index]}
        entering={FadeIn.duration(LUXURY_MOTION.enterMs)}
        exiting={FadeOut.duration(LUXURY_MOTION.modalEnterMs)}
        style={styles.message}>
        {messages[index]}
      </Animated.Text>
      <View style={styles.dots}>
        {messages.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: 'rgba(245, 240, 230, 0.94)',
    paddingHorizontal: 20,
  },
  spinner: {
    marginTop: 4,
  },
  message: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    fontStyle: 'italic',
    color: StyloveColors.burgundy,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(196, 160, 98, 0.25)',
  },
  dotActive: {
    backgroundColor: StyloveColors.goldMuted,
    width: 14,
  },
});
