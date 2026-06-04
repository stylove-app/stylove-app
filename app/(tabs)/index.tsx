import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/home/brand-header';
import { AboutStyloveHintCard } from '@/components/home/about-stylove-hint';
import { StyleMoodSelector } from '@/components/home/style-mood-selector';
import { CompactLookCard } from '@/components/home/compact-look-card';
import { OutfitResult } from '@/components/home/outfit-result';
import { OccasionSelector } from '@/components/home/occasion-selector';
import { WardrobePreview } from '@/components/home/wardrobe-preview';
import { CinematicLoading } from '@/components/ui/cinematic-loading';
import { LuxuryBackgroundDrift } from '@/components/ui/luxury-background-drift';
import { LuxuryToast } from '@/components/ui/luxury-toast';
import { SoftEnter } from '@/components/ui/soft-enter';
import { StyloveFooter } from '@/components/ui/stylove-footer';
import { PremiumCta } from '@/components/ui/premium-cta';
import { SectionHeader } from '@/components/ui/section-header';
import { softFadeInDown } from '@/constants/luxury-motion';
import { useLooks } from '@/contexts/looks-context';
import { useAppNavigation } from '@/contexts/app-navigation-context';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { usePremium } from '@/contexts/premium-context';
import { useStyleMemory } from '@/contexts/style-memory-context';
import { useTheme } from '@/contexts/theme-context';
import { useWeather } from '@/contexts/weather-context';
import { useWardrobeState } from '@/contexts/wardrobe-context';
import { getTodaysAura, inferWardrobeTone } from '@/lib/aura-engine';
import { canGenerateFreeOutfit } from '@/lib/free-plan-limits';
import { styleMoodToEngine } from '@/lib/style-mood';
import { runSecureOutfitGeneration } from '@/lib/run-secure-outfit-generation';
import { analytics } from '@/lib/analytics';
import { isEmptyReadyWardrobeError } from '@/lib/empty-ready-wardrobe';
import { getReadyStylingWardrobe } from '@/lib/wardrobe-utils';
import { hapticLight } from '@/lib/haptics';
import { useScrollToOutfitResult } from '@/hooks/use-scroll-to-outfit-result';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';
import type { StyleMoodId } from '@/i18n/types';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import { enginePhraseForOccasion } from '@/lib/selected-occasion';

function HomeScreen() {
  const { t, locale } = useLocale();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { stylingItems, ready: wardrobeReady } = useWardrobeState();
  const { userId } = useAuth();
  const { isPremium } = usePremium();
  const { weather, weatherReady, getWeatherForOutfit } = useWeather();
  const { memory, recordGeneratedLook, recordSavedLook } = useStyleMemory();
  const { looks, currentLook, setCurrentLook, saveLook, savedLooks, removeLook } = useLooks();
  const { pendingTarget, clearPendingNavigation } = useAppNavigation();
  const scrollRef = useTabScrollToTop();
  const { onOutfitResultLayout, requestScrollToOutfitResult } = useScrollToOutfitResult(scrollRef);
  const styleSectionY = useRef(0);
  const wardrobeSnapshotRef = useRef({ ready: wardrobeReady, stylingItems });

  const [selectedOccasion, setSelectedOccasion] = useState<SelectedOccasionId | null>(null);
  const [styleMood, setStyleMood] = useState<StyleMoodId | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [limitToastVisible, setLimitToastVisible] = useState(false);

  const hideSaveToast = useCallback(() => setSaveToastVisible(false), []);
  const hideLimitToast = useCallback(() => setLimitToastVisible(false), []);

  useEffect(() => {
    wardrobeSnapshotRef.current = { ready: wardrobeReady, stylingItems };
  }, [wardrobeReady, stylingItems]);

  const wardrobeTone = useMemo(
    () => inferWardrobeTone(stylingItems.map((i) => i.category)),
    [stylingItems],
  );

  const engineMood = styleMood ? styleMoodToEngine(styleMood) : undefined;

  const todaysAura = useMemo(
    () =>
      getTodaysAura({
        t,
        weather: weatherReady ? weather : undefined,
        intent: selectedOccasion ? enginePhraseForOccasion(selectedOccasion) : undefined,
        wardrobeTone,
        styleMemory: memory,
        styleMood: engineMood,
      }),
    [t, weather, weatherReady, selectedOccasion, wardrobeTone, memory, engineMood],
  );

  const isSaved = useMemo(
    () => (currentLook ? savedLooks.some((l) => l.id === currentLook.id) : false),
    [currentLook, savedLooks],
  );
  const usageScope = userId ?? 'guest';
  const wardrobeEmpty = useMemo(
    () => wardrobeReady && getReadyStylingWardrobe(stylingItems).length === 0,
    [wardrobeReady, stylingItems],
  );
  const screenStyle = useMemo(() => [styles.screen, { backgroundColor: colors.ivory }], [colors.ivory]);
  const handleStyleMoodChange = useCallback(
    (mood: StyleMoodId) => {
      setStyleMood(mood);
    },
    [],
  );

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

  const scrollContentStyle = useMemo(
    () => ({ paddingBottom: insets.bottom + 100 }),
    [insets.bottom],
  );

  const runGeneration = useCallback(
    async (
      intentText: string,
      analyticsSource: 'home' | 'replace',
      occasion?: SelectedOccasionId,
    ) => {
      const outfitWeather = await getWeatherForOutfit();
      return runSecureOutfitGeneration({
        intentText,
        selectedOccasion: occasion,
        analyticsSource,
        locale,
        t,
        weather: outfitWeather,
        memory,
        engineMood,
        styleMood: Boolean(styleMood),
        currentLook,
        savedLooks,
        sessionLooks: looks,
        isPremium,
        usageScope,
        recordGeneratedLook,
        getWardrobeSnapshot: () => wardrobeSnapshotRef.current,
      });
    },
    [
      locale,
      t,
      getWeatherForOutfit,
      memory,
      engineMood,
      styleMood,
      currentLook,
      savedLooks,
      looks,
      isPremium,
      usageScope,
      recordGeneratedLook,
    ],
  );

  const handleCreateLook = useCallback(async () => {
      if (isGenerating || !selectedOccasion) return;
      Keyboard.dismiss();

      const text = enginePhraseForOccasion(selectedOccasion);

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

      setIsGenerating(true);
      try {
        const look = await runGeneration(text, 'home', selectedOccasion);
        setCurrentLook(look);
        setShowResult(true);
        requestScrollToOutfitResult();
      } catch (error) {
        alertGenerationFailure(error);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      isGenerating,
      selectedOccasion,
      runGeneration,
      setCurrentLook,
      usageScope,
      isPremium,
      wardrobeEmpty,
      alertGenerationFailure,
      requestScrollToOutfitResult,
    ],
  );

  const handleReplace = useCallback(async () => {
    if (isGenerating || !currentLook) return;

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

    const occasionForReplace = selectedOccasion ?? undefined;
    const text = selectedOccasion
      ? enginePhraseForOccasion(selectedOccasion)
      : currentLook.intent?.trim() || currentLook.occasion;

    setIsGenerating(true);
    try {
      const look = await runGeneration(text, 'replace', occasionForReplace);
      setCurrentLook(look);
      setShowResult(true);
      requestScrollToOutfitResult();
    } catch (error) {
      alertGenerationFailure(error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    isGenerating,
    currentLook,
    selectedOccasion,
    styleMood,
    t,
    runGeneration,
    setCurrentLook,
    requestScrollToOutfitResult,
    isPremium,
    usageScope,
    wardrobeEmpty,
    alertGenerationFailure,
  ]);

  const openShare = useCallback(() => {
    if (!currentLook) return;
    setCurrentLook(currentLook);
    router.push({ pathname: '/share-look', params: { look: currentLook.id } });
  }, [currentLook, setCurrentLook]);

  const handleSave = useCallback(async () => {
    if (!currentLook || isSaved) return;
    Keyboard.dismiss();
    setIsSaving(true);
    try {
      const saved = await saveLook(currentLook);
      recordSavedLook(saved);
      analytics.capture('outfit_saved', {
        is_premium: isPremium,
        item_count: saved.itemIds.length,
        mood: saved.mood,
        has_weather: Boolean(saved.weatherNote),
      });
      setSaveToastVisible(true);
    } catch {
      Alert.alert(t.profile.account.errorTitle, t.looks.saveError);
    } finally {
      setIsSaving(false);
    }
  }, [currentLook, isSaved, saveLook, recordSavedLook, t.looks.saveError, t.profile.account.errorTitle, isPremium]);

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
            if (currentLook?.id === id) {
              setShowResult(false);
            }
          },
        },
      ]);
    },
    [t, removeLook, currentLook],
  );

  useEffect(() => {
    if (pendingTarget !== 'home-aura') return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: styleSectionY.current, animated: true });
      clearPendingNavigation();
    }, 300);
    return () => clearTimeout(timer);
  }, [pendingTarget, clearPendingNavigation]);

  return (
    <View style={screenStyle}>
      <LuxuryBackgroundDrift />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={Keyboard.dismiss}
        nestedScrollEnabled
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={scrollContentStyle}>
        <BrandHeader />

        <View
          onLayout={(e) => {
            styleSectionY.current = e.nativeEvent.layout.y;
          }}>
          <StyleMoodSelector value={styleMood} onChange={handleStyleMoodChange} />

          <Animated.View entering={softFadeInDown(80)}>
            <OccasionSelector
              value={selectedOccasion}
              onChange={setSelectedOccasion}
              onCreateLook={() => void handleCreateLook()}
              isGenerating={isGenerating}
              wardrobeLoading={!wardrobeReady}
              wardrobeEmpty={wardrobeEmpty}
            />
          </Animated.View>

          <AboutStyloveHintCard />
        </View>

        {showResult && currentLook ? (
          <View onLayout={onOutfitResultLayout}>
            <OutfitResult
              look={currentLook}
              onReplace={handleReplace}
              onSave={handleSave}
              isSaved={isSaved}
              isSaving={isSaving}
              aura={todaysAura}
              onShare={openShare}
            />
            <PremiumCta label={t.home.premiumCta} />
          </View>
        ) : null}

        {savedLooks.length > 0 ? (
          <>
            <SectionHeader title={t.home.savedLooks} subtitle={t.home.savedLooksSubtitle} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              contentContainerStyle={styles.savedRow}>
              {savedLooks.map((look, index) => (
                <SoftEnter key={look.id} delay={index * 50}>
                  <CompactLookCard
                    look={look}
                    onPress={() => {
                      setCurrentLook(look);
                      setShowResult(true);
                      requestScrollToOutfitResult();
                    }}
                    onDelete={() => confirmRemoveLook(look.id)}
                  />
                </SoftEnter>
              ))}
            </ScrollView>
          </>
        ) : null}

        <SoftEnter delay={140}>
          <WardrobePreview />
        </SoftEnter>

        <StyloveFooter />
      </ScrollView>

      {isGenerating ? <CinematicLoading visible messages={t.loading.cinematic} /> : null}

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
    </View>
  );
}

export default memo(HomeScreen);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  savedRow: {
    paddingHorizontal: 24,
    gap: 14,
    marginBottom: 28,
  },
});
