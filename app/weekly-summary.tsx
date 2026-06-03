import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WeeklyStyleSummaryCard } from '@/components/looks/weekly-style-summary-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { useLooks } from '@/contexts/looks-context';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme } from '@/contexts/theme-context';
import { buildWeeklyStyleSummary } from '@/lib/weekly-style-summary';
import { hapticLight } from '@/lib/haptics';
import { Fonts } from '@/constants/theme';

export default function WeeklySummaryScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { looks, savedLooks, ready } = useLooks();
  const summary = buildWeeklyStyleSummary(t, { looks, savedLooks });

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? colors.ivory : colors.wineDeep, paddingTop: insets.top }]}>
      <Pressable
        style={styles.close}
        onPress={() => {
          void hapticLight();
          router.back();
        }}
        hitSlop={12}>
        <Ionicons name="close" size={24} color={colors.creamText} />
      </Pressable>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.goldSoft }]}>{t.weeklySummary.cardEyebrow}</Text>
          <Text style={[styles.title, { color: colors.creamText }]}>{t.weeklySummary.title}</Text>
          <Text style={[styles.subtitle, { color: colors.grayLight }]}>{t.weeklySummary.subtitle}</Text>
        </View>

        {!ready ? (
          <View style={styles.skeletonWrap}>
            <SkeletonShimmer height={420} borderRadius={28} />
            <SkeletonShimmer height={18} width="72%" borderRadius={8} />
            <SkeletonShimmer height={18} width="52%" borderRadius={8} />
          </View>
        ) : summary.hasData ? (
          <WeeklyStyleSummaryCard summary={summary} expanded />
        ) : (
          <EmptyState title={t.weeklySummary.emptyTitle} subtitle={t.weeklySummary.emptySubtitle} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  close: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 44,
  },
  header: {
    paddingHorizontal: 28,
    marginBottom: 28,
    gap: 10,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  skeletonWrap: {
    paddingHorizontal: 24,
    gap: 14,
  },
});
