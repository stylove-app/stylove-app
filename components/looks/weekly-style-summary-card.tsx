import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { useTranslation } from '@/contexts/locale-context';
import type { WeeklyStyleSummary } from '@/lib/weekly-style-summary';
import { Fonts } from '@/constants/theme';

type WeeklyStyleSummaryCardProps = {
  summary: WeeklyStyleSummary;
  onPress?: () => void;
  expanded?: boolean;
};

export function WeeklyStyleSummaryCard({ summary, onPress, expanded }: WeeklyStyleSummaryCardProps) {
  const t = useTranslation();
  const { colors, isDark } = useTheme();
  const content = (
    <Animated.View entering={FadeInUp.duration(700)} style={styles.inner}>
      <View style={styles.glow} />
      <Text style={[styles.eyebrow, { color: colors.goldMuted }]}>{t.weeklySummary.cardEyebrow}</Text>
      <GoldShimmerLine width={38} />
      <Text style={[styles.title, { color: colors.creamText }]}>{summary.aura}</Text>
      {summary.editorialSummary ? (
        <Text style={[styles.subtitle, { color: colors.grayLight }]}>{summary.editorialSummary}</Text>
      ) : null}

      <View style={styles.metricsGrid}>
        <Metric value={summary.metrics.looksCreated} label={t.weeklySummary.looksCreated} />
        <Metric value={summary.metrics.savedLooks} label={t.weeklySummary.savedLooks} />
        <Metric value={summary.metrics.activeDays} label={t.weeklySummary.activeDays} />
      </View>

      <View style={styles.detailBlock}>
        <Text style={[styles.detailLabel, { color: colors.goldSoft }]}>{t.weeklySummary.moodTitle}</Text>
        <Text style={[styles.detailText, { color: colors.creamText }]}>{summary.mood}</Text>
      </View>

      <View style={styles.detailBlock}>
        <Text style={[styles.detailLabel, { color: colors.goldSoft }]}>{t.weeklySummary.tonesTitle}</Text>
        <Text style={[styles.detailText, { color: colors.creamText }]}>
          {summary.tones.length ? summary.tones.join(' · ') : '—'}
        </Text>
      </View>

      {summary.favoriteLook ? (
        <View style={[styles.favorite, { borderColor: 'rgba(196,160,98,0.18)' }]}>
          <Image source={{ uri: summary.favoriteLook.image }} style={styles.favoriteImage} contentFit="cover" />
          <View style={styles.favoriteBody}>
            <Text style={[styles.detailLabel, { color: colors.goldSoft }]}>{t.weeklySummary.favoriteTitle}</Text>
            <Text style={[styles.favoriteTitle, { color: colors.creamText }]} numberOfLines={2}>
              {summary.favoriteLook.title}
            </Text>
          </View>
        </View>
      ) : null}

      {expanded ? (
        <>
          <View style={styles.insights}>
            <Text style={[styles.detailLabel, { color: colors.goldSoft }]}>{t.weeklySummary.insightsTitle}</Text>
            {summary.insights.map((insight) => (
              <Text key={insight} style={[styles.insight, { color: colors.grayLight }]}>
                {insight}
              </Text>
            ))}
          </View>
          <View style={styles.detailBlock}>
            <Text style={[styles.detailLabel, { color: colors.goldSoft }]}>{t.weeklySummary.nextWeekTitle}</Text>
            <Text style={[styles.detailText, { color: colors.creamText }]}>{summary.nextWeekSuggestion}</Text>
          </View>
        </>
      ) : (
        <Text style={[styles.cta, { color: colors.goldSoft }]}>{t.weeklySummary.openCta}</Text>
      )}
    </Animated.View>
  );

  const style = [
    styles.card,
    {
      backgroundColor: isDark ? colors.cardDark : colors.wineDeep,
      borderColor: 'rgba(196,160,98,0.2)',
    },
    StyloveShadow.editorial,
  ];

  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => [style, pressed && styles.pressed]}>{content}</Pressable>;
  }

  return <View style={style}>{content}</View>;
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginBottom: 26,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  inner: {
    padding: 24,
    gap: 14,
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(196,160,98,0.16)',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(255,250,242,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(196,160,98,0.12)',
  },
  metricValue: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: '#F5EDE0',
  },
  metricLabel: {
    fontSize: 10,
    color: 'rgba(245,237,224,0.62)',
    lineHeight: 14,
  },
  detailBlock: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  detailText: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    lineHeight: 24,
  },
  favorite: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,250,242,0.06)',
  },
  favoriteImage: {
    width: 96,
    height: 118,
  },
  favoriteBody: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
    gap: 6,
  },
  favoriteTitle: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    lineHeight: 23,
  },
  insights: {
    gap: 8,
  },
  insight: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  cta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
