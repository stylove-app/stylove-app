import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { softFadeInDown } from '@/constants/luxury-motion';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';

type TodaysAuraProps = {
  aura: string;
  label: string;
};

function TodaysAuraComponent({ aura, label }: TodaysAuraProps) {
  const { colors } = useTheme();

  return (
    <Animated.View entering={softFadeInDown(120)} style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.wineDeep, borderColor: 'rgba(196,160,98,0.2)' }, StyloveShadow.glow]}>
        <View style={[styles.glowOrb, { backgroundColor: colors.burgundy }]} />
        <Text style={[styles.label, { color: colors.goldSoft }]}>{label}</Text>
        <Text style={[styles.aura, { color: colors.creamText }]}>{aura}</Text>
        <GoldShimmerLine width={32} style={styles.goldLine} />
      </View>
    </Animated.View>
  );
}

export const TodaysAura = memo(TodaysAuraComponent);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  card: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.35,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  aura: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    lineHeight: 30,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  goldLine: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
});
