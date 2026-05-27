import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { LUXURY_MOTION } from '@/constants/luxury-motion';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

type CinematicLoadingProps = {
  visible: boolean;
  messages: readonly string[];
  intervalMs?: number;
};

/**
 * Non-modal overlay so it cannot block scroll/touches after generation completes.
 */
export function CinematicLoading({
  visible,
  messages,
  intervalMs = 2000,
}: CinematicLoadingProps) {
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
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.backdrop} pointerEvents="auto">
        <Animated.View
          entering={FadeIn.duration(LUXURY_MOTION.enterMs)}
          exiting={FadeOut.duration(LUXURY_MOTION.modalEnterMs)}
          style={[styles.card, StyloveShadow.editorial]}>
          <GoldShimmerLine width={40} />
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
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    elevation: 40,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 5, 9, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: StyloveColors.wineDeep,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 98, 0.25)',
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 20,
  },
  message: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: StyloveColors.creamText,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 28,
    minHeight: 56,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(212, 184, 120, 0.25)',
  },
  dotActive: {
    backgroundColor: StyloveColors.goldMuted,
  },
});
