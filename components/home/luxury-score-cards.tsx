import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { softFadeInDown } from '@/constants/luxury-motion';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { useTranslation } from '@/contexts/locale-context';
import type { LuxuryScores } from '@/lib/luxury-scores';
import { Fonts } from '@/constants/theme';

type LuxuryScoreCardsProps = {
  scores: LuxuryScores;
};

type ScoreRowProps = {
  label: string;
  value: number;
  delay: number;
  trackColor: string;
  fillColor: string;
  textColor: string;
};

function ScoreRow({ label, value, delay, trackColor, fillColor, textColor }: ScoreRowProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(value / 100, { duration: 900 + delay });
  }, [value, delay, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Animated.View entering={softFadeInDown(delay)} style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        <Text style={[styles.value, { color: fillColor }]}>{value}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.fill, { backgroundColor: fillColor }, barStyle]} />
      </View>
    </Animated.View>
  );
}

export function LuxuryScoreCards({ scores }: LuxuryScoreCardsProps) {
  const t = useTranslation();
  const { colors, isDark } = useTheme();

  const trackColor = isDark ? 'rgba(196,160,98,0.12)' : 'rgba(74,14,24,0.08)';
  const fillColor = colors.goldMuted;
  const textColor = isDark ? colors.gray : colors.gray;

  const rows: { key: keyof LuxuryScores; label: string; delay: number }[] = [
    { key: 'elegance', label: t.scores.elegance, delay: 100 },
    { key: 'confidence', label: t.scores.confidence, delay: 180 },
    { key: 'minimalism', label: t.scores.minimalism, delay: 260 },
    { key: 'nightEnergy', label: t.scores.nightEnergy, delay: 340 },
    { key: 'streetLuxury', label: t.scores.streetLuxury, delay: 420 },
  ];

  return (
    <Animated.View
      entering={softFadeInDown(300)}
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? colors.cardElevated : colors.white,
          borderColor: isDark ? 'rgba(196,160,98,0.15)' : colors.creamRich,
        },
        StyloveShadow.soft,
      ]}>
      <Text style={[styles.title, { color: colors.goldMuted }]}>{t.scores.title}</Text>
      {rows.map((row) => (
        <ScoreRow
          key={row.key}
          label={row.label}
          value={scores[row.key]}
          delay={row.delay}
          trackColor={trackColor}
          fillColor={fillColor}
          textColor={textColor}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  title: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: {
    gap: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
  value: {
    fontFamily: Fonts.serif,
    fontSize: 16,
  },
  track: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.85,
  },
});
