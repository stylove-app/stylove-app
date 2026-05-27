import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';

import { LookbookSpread } from '@/components/looks/lookbook-spread';
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
import { hapticLight } from '@/lib/haptics';
import { Fonts } from '@/constants/theme';

export default function LooksScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { weather } = useWeather();
  const { memory, recordGeneratedLook, recordSavedLook } = useStyleMemory();
  const { looks, savedLooks, currentLook, setCurrentLook, saveLook, removeLook, ready } = useLooks();
  const { stylingItems, ready: wardrobeReady } = useWardrobe();
  const scrollRef = useTabScrollToTop();
  const [saveToastVisible, setSaveToastVisible] = useState(false);

  const displayLooks = savedLooks.length > 0 ? savedLooks : looks;
  const activeLook = currentLook ?? displayLooks[0] ?? null;

  const aura = getTodaysAura({ t, weather, styleMemory: memory });

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
    saveLook(activeLook);
    recordSavedLook(activeLook);
    setSaveToastVisible(true);
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
            removeLook(id);
          },
        },
      ]);
    },
    [t, removeLook],
  );

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
        ) : activeLook ? (
          <OutfitResult
            look={activeLook}
            onReplace={handleReplace}
            onSave={handleSave}
            isSaved={savedLooks.some((l) => l.id === activeLook.id)}
            aura={aura}
          />
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
});
