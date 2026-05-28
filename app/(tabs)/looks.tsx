import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';

import { LookbookSpread } from '@/components/looks/lookbook-spread';
import { WeeklyStyleSummaryCard } from '@/components/looks/weekly-style-summary-card';
import { OutfitResult } from '@/components/home/outfit-result';
import { EmptyState } from '@/components/ui/empty-state';
import { LuxuryToast } from '@/components/ui/luxury-toast';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { StyloveFooter } from '@/components/ui/stylove-footer';
import { useLooks } from '@/contexts/looks-context';
import { useStyleMemory } from '@/contexts/style-memory-context';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme } from '@/contexts/theme-context';
import { useWeather } from '@/contexts/weather-context';
import { useWardrobe } from '@/contexts/wardrobe-context';
import { getTodaysAura } from '@/lib/aura-engine';
import { generateLook } from '@/lib/outfit-engine';
import { buildWeeklyStyleSummary } from '@/lib/weekly-style-summary';
import { hapticLight } from '@/lib/haptics';
import { Fonts } from '@/constants/theme';

export default function LooksScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { weather } = useWeather();
  const { memory, recordGeneratedLook, recordSavedLook } = useStyleMemory();
  const { looks, savedLooks, currentLook, setCurrentLook, saveLook, removeLook, updateLookCategory, ready } = useLooks();
  const { stylingItems, ready: wardrobeReady } = useWardrobe();
  const scrollRef = useTabScrollToTop();
  const [saveToastVisible, setSaveToastVisible] = useState(false);

  const displayLooks = savedLooks.length > 0 ? savedLooks : looks;
  const activeLook = currentLook ?? displayLooks[0] ?? null;

  const aura = getTodaysAura({ t, weather, styleMemory: memory });
  const weeklySummary = buildWeeklyStyleSummary(t, { looks, savedLooks });

  const handleReplace = async () => {
    if (!activeLook || !wardrobeReady) return;
    const look = generateLook(t, {
      intent: activeLook.intent ?? activeLook.occasion,
      wardrobe: stylingItems,
      weather,
      seed: Date.now(),
      styleMemory: memory,
    });
    recordGeneratedLook(look);
    setCurrentLook(look);
  };

  const handleSave = () => {
    if (!activeLook || savedLooks.some((l) => l.id === activeLook.id)) return;
    void saveLook(activeLook)
      .then((saved) => {
        recordSavedLook(saved);
        setSaveToastVisible(true);
      })
      .catch(() => {
        Alert.alert(t.profile.account.errorTitle, t.looks.saveError);
      });
  };

  const confirmRemoveLook = useCallback(
    (id: string) => {
      Alert.alert(t.looks.removeTitle, t.looks.removeConfirm, [
        { text: t.common.decline, style: 'cancel' },
        {
          text: t.looks.removeAction,
          style: 'destructive',
          onPress: () => {
            void hapticLight();
            void removeLook(id);
          },
        },
      ]);
    },
    [t, removeLook],
  );

  const archiveCategories = [
    t.looks.archiveCategoryToday,
    t.looks.archiveCategoryDateNight,
    t.looks.archiveCategoryBusiness,
    t.looks.archiveCategorySummer,
    t.looks.archiveCategoryTravel,
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.ivory, paddingTop: insets.top }]}>
      <LuxuryToast
        visible={saveToastVisible}
        title={t.looks.savedTitle}
        subtitle={t.looks.savedMessage}
        onHide={() => setSaveToastVisible(false)}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.black }]}>{t.looks.title}</Text>
          <Text style={[styles.subtitle, { color: colors.gray }]}>{t.looks.subtitle}</Text>
        </View>

        {!ready ? (
          <View style={styles.skeletonWrap}>
            <SkeletonShimmer height={360} borderRadius={28} />
            <SkeletonShimmer height={18} width="60%" borderRadius={8} />
            <SkeletonShimmer height={14} width="40%" borderRadius={8} />
          </View>
        ) : weeklySummary.hasData ? (
          <WeeklyStyleSummaryCard summary={weeklySummary} onPress={() => router.push('/weekly-summary')} />
        ) : null}

        {!ready ? null : activeLook ? (
          <>
            <OutfitResult
              look={activeLook}
              onReplace={handleReplace}
              onSave={handleSave}
              isSaved={savedLooks.some((l) => l.id === activeLook.id)}
              aura={aura}
            />
            {savedLooks.some((l) => l.id === activeLook.id) ? (
              <View style={styles.categoryWrap}>
                <Text style={[styles.categoryTitle, { color: colors.gray }]}>{t.looks.archiveCategoryLabel}</Text>
                <View style={styles.categoryChips}>
                  {archiveCategories.map((category) => {
                    const selected = activeLook.archiveCategory === category;
                    return (
                      <Pressable
                        key={category}
                        onPress={() => void updateLookCategory(activeLook.id, category)}
                        style={[
                          styles.categoryChip,
                          {
                            borderColor: selected ? colors.goldMuted : colors.creamRich,
                            backgroundColor: selected ? colors.wineDeep : colors.white,
                          },
                        ]}>
                        <Text style={[styles.categoryChipText, { color: selected ? colors.creamText : colors.gray }]}>
                          {category}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <EmptyState title={t.looks.emptyTitle} subtitle={t.looks.emptySubtitle} />
        )}

        {!ready ? (
          <View style={styles.skeletonWrap}>
            {Array.from({ length: 2 }).map((_, index) => (
              <SkeletonShimmer key={index} height={420} borderRadius={24} />
            ))}
          </View>
        ) : displayLooks.length > 0 ? (
          <>
            <SectionHeader title={t.looks.lookbook} subtitle={t.looks.lookbookSubtitle} />
            {displayLooks.map((look, index) => (
              <LookbookSpread
                key={look.id}
                look={look}
                index={index}
                onPress={() => setCurrentLook(look)}
                onDelete={() => confirmRemoveLook(look.id)}
              />
            ))}
          </>
        ) : null}

        <StyloveFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 8,
    gap: 4,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 32,
  },
  subtitle: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  skeletonWrap: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  categoryWrap: {
    paddingHorizontal: 24,
    marginTop: -12,
    marginBottom: 24,
    gap: 10,
  },
  categoryTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
