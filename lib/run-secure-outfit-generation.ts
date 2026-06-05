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
import { buildOutfitDiversityContext } from '@/lib/styling-bible';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import { enginePhraseForOccasion } from '@/lib/selected-occasion';
import { logSecureOutfitFinalDiagnostic } from '@/lib/outfit-decision-debug';
import { validateOutfitStructure } from '@/lib/outfit-assembly-rules';
import { stylingComboSignature } from '@/lib/outfit-diversity';

export const OUTFIT_GENERATION_MS = 5500;

type WardrobeSnapshot = {
  ready: boolean;
  stylingItems: WardrobeItem[];
};

type RunSecureOutfitGenerationParams = {
  intentText: string;
  selectedOccasion?: SelectedOccasionId;
  analyticsSource: 'home' | 'replace' | 'looks';
  locale: Locale;
  t: TranslationKeys;
  weather: WeatherSnapshot | null;
  memory: StyleMemory;
  engineMood?: MoodId;
  styleMood: boolean;
  currentLook: CuratedLook | null;
  savedLooks: CuratedLook[];
  sessionLooks?: CuratedLook[];
  isPremium: boolean;
  usageScope: string;
  recordGeneratedLook: (look: CuratedLook) => void;
  getWardrobeSnapshot: () => WardrobeSnapshot;
};

export async function runSecureOutfitGeneration({
  intentText,
  selectedOccasion,
  analyticsSource,
  locale,
  t,
  weather,
  memory,
  engineMood,
  styleMood,
  currentLook,
  savedLooks,
  sessionLooks = [],
  isPremium,
  usageScope,
  recordGeneratedLook,
  getWardrobeSnapshot,
}: RunSecureOutfitGenerationParams): Promise<CuratedLook> {
  const resolvedWeather = weather ?? undefined;
  const isRegenerate = analyticsSource === 'replace' || analyticsSource === 'looks';

  const [{ stylingItems: wardrobeSnapshot }] = await Promise.all([
    waitForWardrobeReady(getWardrobeSnapshot),
    new Promise((resolve) => setTimeout(resolve, OUTFIT_GENERATION_MS)),
  ]);
  const wardrobeForLook = getReadyStylingWardrobe(wardrobeSnapshot);

  if (wardrobeForLook.length === 0) {
    throw new EmptyReadyWardrobeError();
  }

  const diversityLooks = [
    ...sessionLooks,
    ...(currentLook ? [currentLook] : []),
    ...savedLooks.slice(-4),
  ];
  const { recentOutfitSets, recentCoreSets, seenSignatures, recentItemIds } =
    buildOutfitDiversityContext(diversityLooks);

  const generationSeed = isRegenerate
    ? Date.now() + Math.floor(Math.random() * 1_000_000)
    : undefined;

  const engineIntent = selectedOccasion
    ? enginePhraseForOccasion(selectedOccasion)
    : intentText;

  const previousComboSignature =
    currentLook?.completeOutfit?.length
      ? stylingComboSignature(currentLook.completeOutfit)
      : undefined;
  const previousWasOnePiece = Boolean(
    currentLook?.completeOutfit?.some((piece) => piece.role === 'dress'),
  );

  const fallbackLook = generateLook(t, {
    intent: engineIntent,
    wardrobe: wardrobeForLook,
    weather: resolvedWeather,
    seed: generationSeed,
    styleMemory: memory,
    moodOverride: engineMood,
    recentItemIds,
    recentOutfitSets,
    recentCoreSets,
    seenSignatures,
    regenerate: isRegenerate,
    selectedOccasion,
    previousStylingConceptId: currentLook?.stylingConceptId,
    previousPaletteMode: currentLook?.paletteMode,
    previousItemIds: currentLook?.itemIds,
    previousComboSignature: isRegenerate ? previousComboSignature : undefined,
    previousWasOnePiece: isRegenerate ? previousWasOnePiece : undefined,
    diversitySource: analyticsSource,
    displayOccasion: selectedOccasion
      ? t.home.occasions[selectedOccasion].title
      : undefined,
  });

  const { look, remoteOk } = await generateOutfitSecurely({
    locale,
    intent: intentText,
    wardrobe: wardrobeForLook,
    weather: resolvedWeather,
    mood: engineMood,
    styleMemory: memory,
    recentItemIds,
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

  const isHomeFlow = analyticsSource === 'home' || analyticsSource === 'replace';
  if (isHomeFlow) {
    const finalPieces = look.completeOutfit ?? [];
    const finalValidation = validateOutfitStructure(finalPieces, selectedOccasion, resolvedWeather);

    logSecureOutfitFinalDiagnostic({
      path: remoteOk ? 'local_validated_openai_copy_only' : 'local_validated',
      occasion: selectedOccasion,
      temp: resolvedWeather?.temperature,
      remoteOk,
      localValidation: finalValidation.valid ? 'PASS' : 'FAIL',
      finalPieces,
    });
  }

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
