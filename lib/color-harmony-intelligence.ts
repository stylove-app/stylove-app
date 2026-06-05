import { isQaTestMode } from '@/lib/qa-test-mode';
import type { ResolvedIntent } from '@/lib/intent-engine';
import type { ItemStylingProfile } from '@/lib/outfit-styling-intelligence';
import { analyzeWardrobeItem, scoreSilhouetteBalance } from '@/lib/outfit-styling-intelligence';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import type { WardrobeItem } from '@/lib/outfit-engine';
import {
  getEffectiveStyleProfile,
  type WardrobeColorId,
  type WardrobeStyleProfile,
} from '@/lib/wardrobe-style-profile';
import type { WeatherSnapshot } from '@/lib/weather';
import { classifyUseCaseMatch, occasionTargetUseCase } from '@/lib/wardrobe-metadata-authority';
import {
  detectWardrobeHarmonyMode,
  isNeutralColorFamily,
  isStrongColorFamily,
  NEON_COLOR_FAMILIES,
} from '@/lib/wardrobe-color-theory';

export type ColorFamilyId =
  | 'black'
  | 'white'
  | 'cream'
  | 'beige'
  | 'camel'
  | 'brown'
  | 'gray'
  | 'navy'
  | 'denim_blue'
  | 'sky_blue'
  | 'sage'
  | 'olive'
  | 'emerald'
  | 'burgundy'
  | 'red'
  | 'pink'
  | 'dusty_rose'
  | 'lavender'
  | 'purple'
  | 'yellow'
  | 'orange'
  | 'gold'
  | 'silver'
  | 'multicolor';

export type MaterialId =
  | 'linen'
  | 'cotton'
  | 'denim'
  | 'knit'
  | 'wool'
  | 'satin'
  | 'silk'
  | 'leather'
  | 'polyester';

export type HarmonyMode = 'monochromatic' | 'analogous' | 'complementary' | 'neutral_accent' | 'mixed';

export type OutfitHarmonyBreakdown = {
  total: number;
  occasionFit: number;
  colorHarmony: number;
  occasionColorFit: number;
  materialHarmony: number;
  silhouetteBalance: number;
  accessoryBalance: number;
  weatherFit: number;
  styleProfileFit: number;
  shoeNoteScore: number;
  colors: ColorFamilyId[];
  harmonyMode: HarmonyMode;
  matchedPalette: string | null;
};

const NEUTRAL_FAMILIES = new Set<ColorFamilyId>([
  'black',
  'white',
  'cream',
  'beige',
  'camel',
  'brown',
  'gray',
  'navy',
]);

const STRONG_FAMILIES = new Set<ColorFamilyId>([
  'red',
  'pink',
  'burgundy',
  'emerald',
  'purple',
  'yellow',
  'orange',
  'sky_blue',
  'denim_blue',
  'gold',
  'multicolor',
]);

const REFINED_OCCASIONS = new Set<SelectedOccasionId>(['wedding', 'dinner', 'date', 'office']);
const RELAXED_OCCASIONS = new Set<SelectedOccasionId>(['daily', 'coffee', 'shopping', 'beach', 'sport_walk']);
const LIGHT_OCCASIONS = new Set<SelectedOccasionId>(['beach', 'vacation']);

function normalizeColorFamily(profile: WardrobeStyleProfile): ColorFamilyId {
  const map: Partial<Record<WardrobeColorId, ColorFamilyId>> = {
    blue: 'sky_blue',
    green: 'sage',
    denim_blue: 'denim_blue',
    pink: 'pink',
    dusty_rose: 'dusty_rose',
    multicolor: 'multicolor',
  };
  return map[profile.color as WardrobeColorId] ?? (profile.color as ColorFamilyId);
}

function inferMaterial(profile: WardrobeStyleProfile): MaterialId {
  const cat = profile.category;
  if (['summer_dress', 'shorts', 'sandal'].includes(cat)) return 'linen';
  if (['jeans', 'denim'].includes(cat) || cat.includes('jean')) return 'denim';
  if (['sweater', 'cardigan', 'knit'].some((k) => cat.includes(k))) return 'knit';
  if (['evening_dress', 'midi_dress'].includes(cat) && profile.formality === 'elegant') return 'satin';
  if (['blouse', 'shirt'].includes(cat) && profile.formality === 'elegant') return 'silk';
  if (['coat', 'kaban', 'blazer'].includes(cat)) return 'wool';
  if (profile.slot === 'shoes' || profile.slot === 'bag' || cat === 'belt') return 'leather';
  if (['heel', 'loafer', 'boot'].includes(cat)) return 'leather';
  if (profile.season === 'winter') return 'wool';
  return 'cotton';
}

function detectHarmonyMode(colors: ColorFamilyId[]): HarmonyMode {
  const detected = detectWardrobeHarmonyMode(colors);
  const map: Record<string, HarmonyMode> = {
    monochrome: 'monochromatic',
    tonal: 'monochromatic',
    analogous: 'analogous',
    complementary: 'complementary',
    split_complementary: 'complementary',
    triadic: 'analogous',
    neutral_plus_accent: 'neutral_accent',
    mixed: 'mixed',
  };
  return map[detected] ?? 'mixed';
}

function scoreColorHarmonyCore(colors: ColorFamilyId[], profiles: ItemStylingProfile[]): {
  score: number;
  mode: HarmonyMode;
  matchedPalette: string | null;
} {
  const unique = [...new Set(colors)];
  const mode = detectHarmonyMode(unique);
  let score = 8;

  if (mode === 'monochromatic') score += 6;
  else if (mode === 'analogous') score += 5;
  else if (mode === 'complementary') score += 4;
  else if (mode === 'neutral_accent') score += 6;
  else score += 1;

  let matchedPalette: string | null = null;
  if (mode !== 'mixed' && unique.length >= 2) {
    matchedPalette = unique.slice(0, 3).join(' + ');
    if (mode === 'monochromatic' || mode === 'neutral_accent') score += 2;
    else if (mode === 'analogous' || mode === 'complementary') score += 1;
  }

  const strongCount = unique.filter((c) => isStrongColorFamily(c)).length;
  if (strongCount > 3) score -= 8;
  else if (strongCount === 3) score -= 3;

  const heavyPattern = profiles.filter((p) => p.patternLevel >= 2).length;
  if (heavyPattern >= 2) score -= 6;
  else if (heavyPattern >= 1) score -= 2;

  return { score: Math.max(0, Math.min(18, score)), mode, matchedPalette };
}

function scoreOccasionColorFit(
  colors: ColorFamilyId[],
  occasion: SelectedOccasionId | undefined,
): number {
  if (!occasion || colors.length === 0) return 6;

  const unique = [...new Set(colors)];
  const strong = unique.filter((c) => isStrongColorFamily(c));
  const neon = unique.filter((c) => NEON_COLOR_FAMILIES.has(c));
  const neutral = unique.filter((c) => isNeutralColorFamily(c));
  const harmonyMode = detectWardrobeHarmonyMode(unique);

  let score = 6;

  if (harmonyMode !== 'mixed') score += 3;
  if (strong.length <= 2) score += 2;
  if (neutral.length >= 1) score += 1;

  if (REFINED_OCCASIONS.has(occasion)) {
    if (strong.length <= 1) score += 2;
    if (neon.length >= 2) score -= 6;
    else if (neon.length === 1 && !['burgundy', 'dusty_rose', 'emerald'].includes(neon[0])) score -= 3;
    if (strong.length >= 3) score -= 5;
  } else if (LIGHT_OCCASIONS.has(occasion)) {
    const hasLight = unique.some((c) => ['white', 'cream', 'beige', 'sky_blue', 'sage', 'lavender'].includes(c));
    if (hasLight) score += 2;
    if (strong.length >= 3) score -= 3;
  } else if (RELAXED_OCCASIONS.has(occasion)) {
    if (strong.length >= 2 && harmonyMode !== 'mixed') score += 1;
    if (neon.length >= 2) score -= 4;
  }

  if (unique.length >= 5) score -= 3;

  return Math.max(0, Math.min(12, score));
}

function scoreMaterialHarmony(
  items: { profile: WardrobeStyleProfile; styling: ItemStylingProfile }[],
  occasion: SelectedOccasionId | undefined,
  weather?: WeatherSnapshot,
): number {
  let score = 4;
  const materials = items.map((e) => inferMaterial(e.profile));
  const cold =
    weather &&
    (weather.needsOuterwear || weather.temperature <= 14 || ['rain', 'snow'].includes(weather.condition));
  const hot = weather && weather.temperature >= 24;

  for (let i = 0; i < items.length; i++) {
    const mat = materials[i];
    const sp = items[i].profile;
    const occ = occasion;

    if (mat === 'linen' && (sp.season === 'summer' || occ === 'beach' || occ === 'vacation')) score += 2;
    if (mat === 'cotton' && (sp.styleTags.includes('casual') || occ === 'daily' || occ === 'shopping'))
      score += 1.5;
    if (mat === 'denim' && (sp.category === 'jeans' || occ === 'daily' || occ === 'coffee')) score += 1.5;
    if ((mat === 'satin' || mat === 'silk') && (occ === 'dinner' || occ === 'date' || occ === 'wedding'))
      score += 2.5;
    if ((mat === 'wool' || mat === 'knit') && (cold || sp.season === 'winter')) score += 2;
    if (mat === 'leather' && (sp.slot === 'shoes' || sp.slot === 'bag') && (occ === 'office' || occ === 'dinner'))
      score += 1.5;
  }

  const uniqueMats = new Set(materials);
  if (uniqueMats.size >= 4) score -= 2;
  if (hot && materials.includes('wool') && !cold) score -= 3;

  return Math.max(0, Math.min(12, score));
}

function scoreSilhouetteHarmony(profiles: ItemStylingProfile[]): number {
  const base = scoreSilhouetteBalance(profiles);
  let score = Math.max(0, Math.min(8, 5 + base * 0.8));

  const hasOnePiece = profiles.some(
    (p) => p.item.category === 'dress' || p.item.itemType === 'elbise' || p.item.itemType === 'takim',
  );
  if (hasOnePiece && profiles.length <= 4) score += 2;

  const volumes = profiles.map((p) => p.volume);
  const oversized = volumes.filter((v) => v >= 0.68).length;
  const fitted = volumes.filter((v) => v <= 0.38).length;

  if (oversized >= 2) score -= 5;
  if (fitted >= 3 && !hasOnePiece) score -= 3;

  const top = profiles.find((p) => p.item.category === 'upper' || p.item.category === 'outerwear');
  const bottom = profiles.find((p) => p.item.category === 'bottom');
  if (top && bottom) {
    if (top.volume >= 0.65 && bottom.volume <= 0.42) score += 3;
    if (top.volume <= 0.42 && bottom.volume >= 0.55) score += 3;
  }

  return Math.max(0, Math.min(10, score));
}

function scoreAccessoryHarmony(
  items: WardrobeItem[],
  occasion: SelectedOccasionId | undefined,
): number {
  let score = 3;
  const profiles = items.map((item) => getEffectiveStyleProfile(item));
  const hasBag = profiles.some((p) => p.slot === 'bag');
  const hasJewelry = profiles.some(
    (p) => p.slot === 'jewelry' || ['necklace', 'earrings', 'watch'].includes(p.category),
  );
  const hasWatch = profiles.some((p) => p.category === 'watch' || p.slot === 'jewelry');
  const hasSunglasses = profiles.some((p) => p.category === 'sunglasses');

  if (!occasion) return Math.min(10, score + (hasBag ? 2 : 0));

  switch (occasion) {
    case 'office':
      if (hasBag) score += 3;
      if (hasWatch) score += 2;
      break;
    case 'date':
    case 'dinner':
      if (hasBag) score += 2;
      if (hasJewelry) score += 4;
      break;
    case 'wedding':
      if (hasBag) score += 3;
      if (hasJewelry) score += 4;
      break;
    case 'beach':
    case 'vacation':
      if (hasSunglasses) score += 3;
      if (hasBag) score += 1;
      break;
    default:
      if (hasBag) score += 2;
      if (hasJewelry) score += 1;
      break;
  }

  const accessoryCount = profiles.filter((p) => p.slot === 'bag' || p.slot === 'accessory' || p.slot === 'jewelry')
    .length;
  if (accessoryCount >= 3) score -= 2;

  return Math.max(0, Math.min(10, score));
}

function scoreStyleProfileFit(
  items: { profile: WardrobeStyleProfile }[],
  occasion: SelectedOccasionId | undefined,
): number {
  if (!occasion) return 6;
  let score = 0;
  let count = 0;

  const targetUse = occasionTargetUseCase(occasion);

  for (const { profile } of items) {
    count += 1;
    const tier = classifyUseCaseMatch(profile.useCases, occasion);
    if (tier === 'direct') score += 8;
    else if (tier === 'related') score += 3;
    else if (tier === 'incompatible') score -= 6;
    else if (tier === 'neutral') score -= 2;

    if (targetUse && profile.useCases.includes(targetUse as never)) score += 2;
    if (occasion === 'office' && profile.styleTags.includes('office')) score += 1;
    if ((occasion === 'dinner' || occasion === 'date') && (profile.styleTags.includes('elegant') || profile.styleTags.includes('romantic')))
      score += 1;
    if ((occasion === 'beach' || occasion === 'vacation') && profile.styleTags.includes('vacation')) score += 1;
    if (occasion === 'wedding' && (profile.styleTags.includes('elegant') || profile.styleTags.includes('evening')))
      score += 2;
    if (profile.formality === 'sporty' && ['office', 'wedding', 'dinner'].includes(occasion)) score -= 2;
  }

  return Math.max(0, Math.min(12, count > 0 ? score / count + 4 : 4));
}

function scoreWeatherHarmony(profiles: ItemStylingProfile[], weather?: WeatherSnapshot): number {
  if (!weather) return 5;
  let score = 5;
  const outerwear = profiles.some((p) => p.item.category === 'outerwear');
  const hot = weather.temperature >= 24;
  const cold = weather.needsOuterwear || weather.temperature <= 14;

  if (cold && outerwear) score += 3;
  if (cold && !outerwear) score -= 2;
  if (hot && profiles.filter((p) => p.volume >= 0.7).length >= 2) score -= 3;
  if (weather.isRainy && outerwear) score += 2;

  return Math.max(0, Math.min(8, score));
}

function scoreOccasionFitFromProfiles(
  occasion: SelectedOccasionId | undefined,
  resolved?: ResolvedIntent,
): number {
  if (!occasion) return resolved ? 12 : 10;
  const map: Partial<Record<SelectedOccasionId, number>> = {
    office: 18,
    dinner: 17,
    date: 17,
    wedding: 18,
    beach: 15,
    vacation: 15,
    daily: 14,
    coffee: 14,
    shopping: 13,
    sport_walk: 12,
    travel: 13,
    family_visit: 14,
  };
  let score = map[occasion] ?? 12;
  if (resolved && resolved.confidenceScore >= 0.6) score += 2;
  return Math.min(20, score);
}

function scoreShoeHarmonyNote(profiles: ItemStylingProfile[], occasion?: SelectedOccasionId): number {
  const shoe = profiles.find((p) => p.item.category === 'shoes');
  if (!shoe) return 4;
  let score = 6;
  if (occasion === 'office' && shoe.formality >= 0.7) score += 2;
  if ((occasion === 'dinner' || occasion === 'date' || occasion === 'wedding') && shoe.formality >= 0.75)
    score += 2;
  if ((occasion === 'beach' || occasion === 'vacation' || occasion === 'sport_walk') && shoe.formality <= 0.6)
    score += 2;
  return Math.min(8, score);
}

export function extractOutfitColorFamilies(items: WardrobeItem[]): ColorFamilyId[] {
  return [
    ...new Set(
      items.map((item) => normalizeColorFamily(getEffectiveStyleProfile(item))),
    ),
  ];
}

export function scoreOutfitHarmonyLayer(params: {
  items: WardrobeItem[];
  profiles?: ItemStylingProfile[];
  selectedOccasion?: SelectedOccasionId;
  resolvedIntent?: ResolvedIntent;
  weather?: WeatherSnapshot;
}): OutfitHarmonyBreakdown {
  const profiles =
    params.profiles ??
    params.items.map((item) =>
      analyzeWardrobeItem({
        id: item.id,
        name: item.name,
        itemType: item.itemType,
        category: item.category,
        styleProfile: getEffectiveStyleProfile(item),
      }),
    );

  const styleEntries = params.items.map((item, i) => ({
    profile: getEffectiveStyleProfile(item),
    styling: profiles[i],
  }));

  const colors = extractOutfitColorFamilies(params.items);
  const { score: colorHarmony, mode, matchedPalette } = scoreColorHarmonyCore(colors, profiles);
  const occasionColorFit = scoreOccasionColorFit(colors, params.selectedOccasion);
  const materialHarmony = scoreMaterialHarmony(styleEntries, params.selectedOccasion, params.weather);
  const silhouetteBalance = scoreSilhouetteHarmony(profiles);
  const accessoryBalance = scoreAccessoryHarmony(params.items, params.selectedOccasion);
  const weatherFit = scoreWeatherHarmony(profiles, params.weather);
  const styleProfileFit = scoreStyleProfileFit(styleEntries, params.selectedOccasion);
  const occasionFit = scoreOccasionFitFromProfiles(params.selectedOccasion, params.resolvedIntent);
  const shoeNoteScore = scoreShoeHarmonyNote(profiles, params.selectedOccasion);

  const total =
    occasionFit +
    colorHarmony +
    occasionColorFit +
    materialHarmony +
    silhouetteBalance +
    accessoryBalance +
    weatherFit +
    styleProfileFit +
    shoeNoteScore;

  return {
    total,
    occasionFit,
    colorHarmony,
    occasionColorFit,
    materialHarmony,
    silhouetteBalance,
    accessoryBalance,
    weatherFit,
    styleProfileFit,
    shoeNoteScore,
    colors,
    harmonyMode: mode,
    matchedPalette,
  };
}

export function logOutfitHarmonyDebug(breakdown: OutfitHarmonyBreakdown): void {
  if (!isQaTestMode()) return;
  console.log('[Stylove Harmony]', {
    colors: breakdown.colors,
    colorHarmony: breakdown.colorHarmony.toFixed(1),
    occasionColorFit: breakdown.occasionColorFit.toFixed(1),
    materialHarmony: breakdown.materialHarmony.toFixed(1),
    silhouetteBalance: breakdown.silhouetteBalance.toFixed(1),
    accessoryBalance: breakdown.accessoryBalance.toFixed(1),
    mode: breakdown.harmonyMode,
    palette: breakdown.matchedPalette,
    total: breakdown.total.toFixed(1),
  });
}

export function buildHarmonyOutfitExplanation(
  items: WardrobeItem[],
  breakdown: OutfitHarmonyBreakdown,
  params: {
    selectedOccasion?: SelectedOccasionId;
    weather?: WeatherSnapshot;
    occasionLabel?: string;
  },
): { whyThisWorks: string; stylingNotes: string[] } {
  const profiles = items.map((item) =>
    analyzeWardrobeItem({
      id: item.id,
      name: item.name,
      itemType: item.itemType,
      category: item.category,
      styleProfile: getEffectiveStyleProfile(item),
    }),
  );

  const colorNames = breakdown.colors.slice(0, 4).join(', ');
  const modeLabel =
    breakdown.harmonyMode === 'monochromatic'
      ? 'a calm monochromatic palette'
      : breakdown.harmonyMode === 'analogous'
        ? 'soft analogous tones'
        : breakdown.harmonyMode === 'complementary'
          ? 'balanced complementary contrast'
          : breakdown.harmonyMode === 'neutral_accent'
            ? 'neutral base with a refined accent'
            : 'a composed color story';

  let colorLine = `Colors (${colorNames}) work in ${modeLabel}`;
  if (breakdown.matchedPalette) {
    colorLine = `The ${breakdown.matchedPalette} pairing reads intentional and polished—${modeLabel}.`;
  } else if (breakdown.colorHarmony >= 14) {
    colorLine = `${colorNames} sit in ${modeLabel} without competing.`;
  }

  const seasons = [...new Set(items.map((i) => getEffectiveStyleProfile(i).season))];
  const seasonLine =
    seasons.includes('summer') && params.weather && params.weather.temperature >= 22
      ? 'Light fabrics and summer-weight pieces suit the season and temperature.'
      : seasons.includes('winter') || (params.weather && params.weather.temperature <= 14)
        ? 'Layering and richer textures match the cooler season.'
        : seasons.includes('all_season')
          ? 'Versatile pieces bridge the season comfortably.'
          : '';

  const occasionLabel =
    params.occasionLabel ??
    (params.selectedOccasion
      ? params.selectedOccasion.replace('_', ' ')
      : 'your occasion');
  const occasionLine =
    breakdown.occasionColorFit >= 8
      ? `The palette fits ${occasionLabel}: tones feel appropriate, not loud or out of place.`
      : `Styled for ${occasionLabel} with restrained color choices.`;

  const shoe = profiles.find((p) => p.item.category === 'shoes');
  let shoeLine = '';
  if (shoe) {
    const shoeColor = items.find((i) => i.category === 'shoes');
    const shoeFamily = shoeColor ? normalizeColorFamily(getEffectiveStyleProfile(shoeColor)) : '';
    if (params.selectedOccasion === 'office') {
      shoeLine = `Footwear in ${shoeFamily || 'a refined tone'} anchors the look for a professional setting.`;
    } else if (params.selectedOccasion === 'beach' || params.selectedOccasion === 'vacation') {
      shoeLine = 'Easy shoes keep the outfit relaxed and walkable for the destination.';
    } else if (params.selectedOccasion === 'dinner' || params.selectedOccasion === 'date') {
      shoeLine = `Heels or refined shoes in ${shoeFamily || 'a deep neutral'} elevate the line without overpowering the look.`;
    } else {
      shoeLine = 'Shoes complete the proportion and keep the outfit grounded.';
    }
  }

  const materialNote =
    breakdown.materialHarmony >= 9
      ? 'Fabric choices (cotton, knit, denim, or satin where needed) support the mood of the moment.'
      : '';

  const notes = [occasionLine, colorLine, seasonLine, materialNote, shoeLine].filter(Boolean);
  return {
    whyThisWorks: notes.join(' '),
    stylingNotes: notes,
  };
}
