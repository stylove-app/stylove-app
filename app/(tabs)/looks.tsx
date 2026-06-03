import * as Haptics from 'expo-haptics';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';

import { LookbookSpread } from '@/components/looks/lookbook-spread';
import { WeeklyStyleSummaryCard } from '@/components/looks/weekly-style-summary-card';
import { OutfitResult } from '@/components/home/outfit-result';
import { CinematicLoading } from '@/components/ui/cinematic-loading';
import { EmptyState } from '@/components/ui/empty-state';
import { LuxuryToast } from '@/components/ui/luxury-toast';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { StyloveFooter } from '@/components/ui/stylove-footer';
import { useAppNavigation } from '@/contexts/app-navigation-context';
import { useAuth } from '@/contexts/auth-context';
import { useLooks } from '@/contexts/looks-context';
import { useLocale } from '@/contexts/locale-context';
import { usePremium } from '@/contexts/premium-context';
import { useStyleMemory } from '@/contexts/style-memory-context';
import { useTheme } from '@/contexts/theme-context';
import { useWeather } from '@/contexts/weather-context';
import { useWardrobe } from '@/contexts/wardrobe-context';
import { getTodaysAura } from '@/lib/aura-engine';
import { canGenerateFreeOutfit } from '@/lib/free-plan-limits';
import { runSecureOutfitGeneration } from '@/lib/run-secure-outfit-generation';
import { isEmptyReadyWardrobeError } from '@/lib/empty-ready-wardrobe';
import { getReadyStylingWardrobe } from '@/lib/wardrobe-utils';
import { buildWeeklyStyleSummary } from '@/lib/weekly-style-summary';
import { hapticLight } from '@/lib/haptics';
import { Fonts } from '@/constants/theme';
import type { CuratedLook } from '@/lib/outfit-engine';

export default function LooksScreen() {
  const { t, locale } = useLocale();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { weather } = useWeather();
  const { userId } = useAuth();
  const { isPremium } = usePremium();
  const { memory, recordGeneratedLook, recordSavedLook } = useStyleMemory();
  const { looks, savedLooks, currentLook, setCurrentLook, saveLook, removeLook, updateLookCategory, ready, loadError, retryLoad } = useLooks();
  const { stylingItems, ready: wardrobeReady } = useWardrobe();
  const { pendingTarget, clearPendingNavigation } = useAppNavigation();
  const scrollRef = useTabScrollToTop();
  const wardrobeSnapshotRef = useRef({ ready: wardrobeReady, stylingItems });
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [limitToastVisible, setLimitToastVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const displayLooks = useMemo(() => {
    if (savedLooks.length === 0) return looks;
    const savedIds = new Set(savedLooks.map((look) => look.id));
    const unsavedSessionLooks = looks.filter((look) => !savedIds.has(look.id));
    return [...unsavedSessionLooks, ...savedLooks];
  }, [looks, savedLooks]);
  const activeLook = currentLook ?? displayLooks[0] ?? null;
  const usageScope = userId ?? 'guest';
  const wardrobeEmpty =
    wardrobeReady && getReadyStylingWardrobe(stylingItems).length === 0;

  const alertGenerationFailure = useCallback(
    (error: unknown) => {
      if (isEmptyReadyWardrobeError(error)) {
        Alert.alert(t.home.emptyWardrobeTitle, t.home.emptyWardrobeMessage);
        return;
      }
      Alert.alert(t.profile.account.errorTitle, t.home.generateError);
    },
    [t],
  );

  const aura = getTodaysAura({ t, weather, styleMemory: memory });
  const weeklySummary = buildWeeklyStyleSummary(t, { looks, savedLooks });

  useEffect(() => {
    wardrobeSnapshotRef.current = { ready: wardrobeReady, stylingItems };
  }, [wardrobeReady, stylingItems]);

  const hideSaveToast = useCallback(() => setSaveToastVisible(false), []);
  const hideLimitToast = useCallback(() => setLimitToastVisible(false), []);

  const handleRetryLoad = useCallback(async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      await retryLoad();
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, retryLoad]);

  const openShare = useCallback(
    (look: CuratedLook) => {
      setCurrentLook(look);
      router.push({ pathname: '/share-look', params: { look: look.id } });
    },
    [setCurrentLook],
  );

  const handleReplace = useCallback(async () => {
    if (isGenerating || !activeLook || !wardrobeReady) return;

    if (!isPremium && !(await canGenerateFreeOutfit(usageScope))) {
      setLimitToastVisible(true);
      return;
    }

    if (wardrobeEmpty) {
      Alert.alert(t.home.emptyWardrobeTitle, t.home.emptyWardrobeMessage);
      return;
    }

    if (process.env.EXPO_OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const intentText = activeLook.intent ?? activeLook.occasion;

    setIsGenerating(true);
    try {
      const look = await runSecureOutfitGeneration({
        intentText,
        analyticsSource: 'looks',
        locale,
        t,
        weather,
        memory,
        styleMood: false,
        currentLook: activeLook,
        savedLooks,
        isPremium,
        usageScope,
        recordGeneratedLook,
        getWardrobeSnapshot: () => wardrobeSnapshotRef.current,
      });
      setCurrentLook(look);
    } catch (error) {
      alertGenerationFailure(error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    isGenerating,
    activeLook,
    wardrobeReady,
    wardrobeEmpty,
    isPremium,
    usageScope,
    locale,
    t,
    weather,
    memory,
    savedLooks,
    recordGeneratedLook,
    setCurrentLook,
    alertGenerationFailure,
  ]);

  const handleSave = async () => {
    if (!activeLook || savedLooks.some((l) => l.id === activeLook.id) || isSaving) return;
    setIsSaving(true);
    try {
      const saved = await saveLook(activeLook);
      recordSavedLook(saved);
      setSaveToastVisible(true);
    } catch {
      Alert.alert(t.profile.account.errorTitle, t.looks.saveError);
    } finally {
      setIsSaving(false);
    }
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
            void removeLook(id).catch(() => {
              Alert.alert(t.profile.account.errorTitle, t.looks.saveError);
            });
          },
        },
      ]);
    },
    [t, removeLook],
  );

  useEffect(() => {
    if (pendingTarget !== 'looks') return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      clearPendingNavigation();
    }, 300);
    return () => clearTimeout(timer);
  }, [pendingTarget, clearPendingNavigation, scrollRef]);

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
        onHide={hideSaveToast}
      />
      <LuxuryToast
        visible={limitToastVisible}
        title={t.limits.outfitTitle}
        subtitle={t.limits.freeDailyOutfitLimit}
        onHide={hideLimitToast}
        durationMs={4200}
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
        ) : loadError ? (
          <EmptyState
            title={t.looks.loadErrorTitle}
            subtitle={t.looks.loadErrorSubtitle}
            actionLabel={t.looks.retryLoad}
            onAction={() => void handleRetryLoad()}
            actionLoading={isRetrying}
          />
        ) : weeklySummary.hasData ? (
          <WeeklyStyleSummaryCard summary={weeklySummary} onPress={() => router.push('/weekly-summary')} />
        ) : null}

        {!ready || loadError ? null : activeLook ? (
          <>
            <OutfitResult
              look={activeLook}
              onReplace={handleReplace}
              onSave={handleSave}
              isSaved={savedLooks.some((l) => l.id === activeLook.id)}
              isSaving={isSaving}
              aura={aura}
              onShare={() => openShare(activeLook)}
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
                        onPress={() => {
                          void updateLookCategory(activeLook.id, category).catch(() => {
                            Alert.alert(t.profile.account.errorTitle, t.looks.saveError);
                          });
                        }}
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

        {!ready || loadError ? (
          !ready ? (
            <View style={styles.skeletonWrap}>
              {Array.from({ length: 2 }).map((_, index) => (
                <SkeletonShimmer key={index} height={420} borderRadius={24} />
              ))}
            </View>
          ) : null
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

      {isGenerating ? <CinematicLoading visible messages={t.loading.cinematic} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 32,
  },
  subtitle: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
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
