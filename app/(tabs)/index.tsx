import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { CompleteTheLook } from '@/components/home/complete-the-look';
import { CompactLookCard } from '@/components/home/compact-look-card';
import { OutfitResult } from '@/components/home/outfit-result';
import { StylingIntent } from '@/components/home/styling-intent';
import { TodaysAura } from '@/components/home/todays-aura';
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
import { useWardrobe } from '@/contexts/wardrobe-context';
import { getTodaysAura, inferWardrobeTone } from '@/lib/aura-engine';
import { canGenerateFreeOutfit } from '@/lib/free-plan-limits';
import { getTonightsSelection } from '@/lib/outfit-engine';
import { INTENT_SUGGESTIONS } from '@/lib/intent-parser';
import { styleMoodToEngine } from '@/lib/style-mood';
import { runSecureOutfitGeneration } from '@/lib/run-secure-outfit-generation';
import { analytics } from '@/lib/analytics';
import { isEmptyReadyWardrobeError } from '@/lib/empty-ready-wardrobe';
import { getReadyStylingWardrobe } from '@/lib/wardrobe-utils';
import { hapticLight } from '@/lib/haptics';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';
import type { StyleMoodId } from '@/i18n/types';

export default function HomeScreen() {
  const { t, locale } = useLocale();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { stylingItems, ready: wardrobeReady } = useWardrobe();
  const { userId } = useAuth();
  const { isPremium } = usePremium();
  const { weather } = useWeather();
  const { memory, recordGeneratedLook, recordSavedLook } = useStyleMemory();
  const { currentLook, setCurrentLook, saveLook, savedLooks, removeLook } = useLooks();
  const { pendingTarget, clearPendingNavigation } = useAppNavigation();
  const scrollRef = useTabScrollToTop();
  const resultsY = useRef(0);
  const auraSectionY = useRef(0);
  const wardrobeSnapshotRef = useRef({ ready: wardrobeReady, stylingItems });

  const [auraIntent, setAuraIntent] = useState('');
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

  const handleAuraIntentChange = useCallback((text: string) => {
    setAuraIntent(text);
  }, []);

  const wardrobeTone = useMemo(
    () => inferWardrobeTone(stylingItems.map((i) => i.category)),
    [stylingItems],
  );

  const engineMood = styleMood ? styleMoodToEngine(styleMood) : undefined;

  const todaysAura = useMemo(
    () =>
      getTodaysAura({
        t,
        weather,
        intent: auraIntent.trim() || undefined,
        wardrobeTone,
        styleMemory: memory,
        styleMood: engineMood,
      }),
    [t, weather, auraIntent, wardrobeTone, memory, engineMood],
  );

  const tonightsSelection = useMemo(() => {
    if (!wardrobeReady) return null;
    return getTonightsSelection(t, stylingItems, weather);
  }, [t, stylingItems, weather, wardrobeReady]);

  const isSaved = currentLook ? savedLooks.some((l) => l.id === currentLook.id) : false;
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

  const scrollContentStyle = useMemo(
    () => ({ paddingBottom: insets.bottom + 100 }),
    [insets.bottom],
  );

  const runGeneration = useCallback(
    async (intentText: string, analyticsSource: 'home' | 'replace') =>
      runSecureOutfitGeneration({
        intentText,
        analyticsSource,
        locale,
        t,
        weather,
        memory,
        engineMood,
        styleMood: Boolean(styleMood),
        currentLook,
        savedLooks,
        isPremium,
        usageScope,
        recordGeneratedLook,
        getWardrobeSnapshot: () => wardrobeSnapshotRef.current,
      }),
    [
      locale,
      t,
      weather,
      memory,
      engineMood,
      styleMood,
      currentLook,
      savedLooks,
      isPremium,
      usageScope,
      recordGeneratedLook,
    ],
  );

  const handleReveal = useCallback(
    async (intentText: string) => {
      if (isGenerating) return;
      Keyboard.dismiss();

      const moodLabel = styleMood ? t.home.moods[styleMood] : '';
      const text =
        intentText.trim() ||
        moodLabel ||
        t.intent.suggestions[0] ||
        INTENT_SUGGESTIONS[0];
      setAuraIntent(text.trim());

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
        const look = await runGeneration(text, 'home');
        setCurrentLook(look);
        setShowResult(true);
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: resultsY.current, animated: true });
        });
      } catch (error) {
        alertGenerationFailure(error);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      isGenerating,
      styleMood,
      t,
      runGeneration,
      setCurrentLook,
      usageScope,
      isPremium,
      wardrobeEmpty,
      alertGenerationFailure,
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

    const text =
      currentLook.intent ??
      (styleMood ? t.home.moods[styleMood] : t.intent.suggestions[0]);

    setIsGenerating(true);
    try {
      const look = await runGeneration(text, 'replace');
      setCurrentLook(look);
    } catch (error) {
      alertGenerationFailure(error);
    } finally {
      setIsGenerating(false);
    }
  }, [
    isGenerating,
    currentLook,
    styleMood,
    t,
    runGeneration,
    setCurrentLook,
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
      scrollRef.current?.scrollTo({ y: auraSectionY.current, animated: true });
      clearPendingNavigation();
    }, 300);
    return () => clearTimeout(timer);
  }, [pendingTarget, clearPendingNavigation]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.ivory }]}>
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
            auraSectionY.current = e.nativeEvent.layout.y;
          }}>
          <TodaysAura aura={todaysAura} label={t.home.todaysAura} />

          <StyleMoodSelector
            value={styleMood}
            onChange={(mood) => {
              setStyleMood(mood);
              const label = t.home.moods[mood];
              setAuraIntent(label);
            }}
          />

          <Animated.View entering={softFadeInDown(80)}>
            <StylingIntent
              presetIntent={styleMood ? t.home.moods[styleMood] : undefined}
              onIntentChange={handleAuraIntentChange}
              onReveal={handleReveal}
              isGenerating={isGenerating}
              wardrobeLoading={!wardrobeReady}
              wardrobeEmpty={wardrobeEmpty}
            />
          </Animated.View>

          <AboutStyloveHintCard />
        </View>

        {showResult && currentLook ? (
          <View
            onLayout={(e) => {
              resultsY.current = e.nativeEvent.layout.y;
            }}>
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
            <CompleteTheLook />
          </View>
        ) : null}

        {!showResult && wardrobeReady && tonightsSelection ? (
          <Animated.View entering={softFadeInDown(200)}>
            <SectionHeader
              title={t.home.tonightsSelection}
              subtitle={t.home.noLookSubtitle}
            />
            <View style={styles.tonightWrap}>
              <SoftEnter delay={260}>
                <CompactLookCard
                  look={tonightsSelection}
                  wide
                  onPress={() => {
                    if (isGenerating || !wardrobeReady || wardrobeEmpty) {
                      if (wardrobeEmpty) {
                        Alert.alert(t.home.emptyWardrobeTitle, t.home.emptyWardrobeMessage);
                      }
                      return;
                    }
                    void handleReveal(t.intent.suggestions[0]);
                  }}
                />
              </SoftEnter>
            </View>
          </Animated.View>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  tonightWrap: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  savedRow: {
    paddingHorizontal: 24,
    gap: 14,
    marginBottom: 28,
  },
});
