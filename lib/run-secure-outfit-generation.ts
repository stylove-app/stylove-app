import { analytics } from '@/lib/analytics';
import { recordFreeOutfitGeneration } from '@/lib/free-plan-limits';
import { generateLook, type CuratedLook } from '@/lib/outfit-engine';
import type { StyleMemory } from '@/lib/style-memory';
import { getReadyStylingWardrobe } from '@/lib/wardrobe-utils';
import { EmptyReadyWardrobeError } from '@/lib/empty-ready-wardrobe';
import { waitForWardrobeReady } from '@/lib/wardrobe-ready';
import type { Locale, MoodId, TranslationKeys } from '@/i18n/types';
import type { WeatherSnapshot } from '@/lib/weather';
import type { WardrobeItem } from '@/lib/outfit-engine';
import { generateOutfitSecurely } from '@/services/outfit-generation';

export const OUTFIT_GENERATION_MS = 5500;

type WardrobeSnapshot = {
  ready: boolean;
  stylingItems: WardrobeItem[];
};

type RunSecureOutfitGenerationParams = {
  intentText: string;
  analyticsSource: 'home' | 'replace' | 'looks';
  locale: Locale;
  t: TranslationKeys;
  weather: WeatherSnapshot | null;
  memory: StyleMemory;
  engineMood?: MoodId;
  styleMood: boolean;
  currentLook: CuratedLook | null;
  savedLooks: CuratedLook[];
  isPremium: boolean;
  usageScope: string;
  recordGeneratedLook: (look: CuratedLook) => void;
  getWardrobeSnapshot: () => WardrobeSnapshot;
};

export async function runSecureOutfitGeneration({
  intentText,
  analyticsSource,
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
  getWardrobeSnapshot,
}: RunSecureOutfitGenerationParams): Promise<CuratedLook> {
  const resolvedWeather = weather ?? undefined;

  const [{ stylingItems: wardrobeSnapshot }] = await Promise.all([
    waitForWardrobeReady(getWardrobeSnapshot),
    new Promise((resolve) => setTimeout(resolve, OUTFIT_GENERATION_MS)),
  ]);
  const wardrobeForLook = getReadyStylingWardrobe(wardrobeSnapshot);

  if (wardrobeForLook.length === 0) {
    throw new EmptyReadyWardrobeError();
  }

  const recentItemIds = [
    ...(currentLook?.itemIds ?? []),
    ...savedLooks.slice(-4).flatMap((lookItem) => lookItem.itemIds),
  ];

  const fallbackLook = generateLook(t, {
    intent: intentText,
    wardrobe: wardrobeForLook,
    weather: resolvedWeather,
    seed: Date.now(),
    styleMemory: memory,
    moodOverride: engineMood,
    recentItemIds,
  });

  const look = await generateOutfitSecurely({
    locale,
    intent: intentText,
    wardrobe: wardrobeForLook,
    weather: resolvedWeather,
    mood: engineMood,
    styleMemory: memory,
    recentItemIds: [
      ...(currentLook?.itemIds ?? []),
      ...savedLooks.slice(-4).flatMap((lookItem) => lookItem.itemIds),
    ],
    roleLabels: {
      top: t.completeLook.top,
      bottom: t.completeLook.bottom,
      dress: t.completeLook.dress,
      shoes: t.completeLook.shoes,
      outerwear: t.completeLook.outerwear,
      bag: t.completeLook.bag,
      accessory: t.completeLook.accessories,
      jewelry: t.completeLook.jewelry,
    },
    fallback: fallbackLook,
  });

  if (!isPremium) {
    await recordFreeOutfitGeneration(usageScope);
  }

  recordGeneratedLook(look);
  analytics.capture('outfit_generated', {
    source: analyticsSource,
    is_premium: isPremium,
    wardrobe_count: wardrobeForLook.length,
    item_count: look.itemIds.length,
    mood: look.mood,
    has_weather: Boolean(resolvedWeather),
    has_style_mood: styleMood,
  });

  return look;
}
