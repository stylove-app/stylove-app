import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { softFadeInDown } from '@/constants/luxury-motion';

import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

type LuxuryToastProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onHide: () => void;
  durationMs?: number;
};

export function LuxuryToast({
  visible,
  title,
  subtitle,
  onHide,
  durationMs = 2800,
}: LuxuryToastProps) {
  const insets = useSafeAreaInsets();
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => onHideRef.current(), durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={softFadeInDown(0)}
      exiting={FadeOutUp.duration(350)}
      style={[styles.wrap, { top: insets.top + 12 }, StyloveShadow.editorial]}
      pointerEvents="none">
      <GoldShimmerLine width={24} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 100,
    backgroundColor: StyloveColors.wineDeep,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 98, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 4,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    color: StyloveColors.creamText,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(248,244,237,0.72)',
    fontStyle: 'italic',
    lineHeight: 19,
  },
});
