import type { MoodId, WardrobeCategoryId, WardrobeItemTypeId } from '@/i18n/types';
import type { StyleMemory } from '@/lib/style-memory';

/** Minimal wardrobe shape for styling (category/type-first; name for color hints only). */
import type { WardrobeStyleProfile } from '@/lib/wardrobe-style-profile';
import {
  fallbackStyleProfileFromItem,
  formalityScore,
} from '@/lib/wardrobe-style-profile';
export type StylingWardrobeItem = {
  id: string;
  name: string;
  itemType: WardrobeItemTypeId;
  category: WardrobeCategoryId;
  styleProfile?: WardrobeStyleProfile;
};

export type StylingOutfitPiece = {
  item: StylingWardrobeItem;
};
import type { WeatherSnapshot } from '@/lib/weather';
import { weatherMoodBoost } from '@/lib/weather';
import { scorePieceWithBible } from '@/lib/styling-bible';

export type StyleFamily = 'sport' | 'casual' | 'smart' | 'formal' | 'luxe';

export type ItemStylingProfile = {
  item: StylingWardrobeItem;
  tone: string | null;
  formality: number;
  volume: number;
  patternLevel: number;
  styleFamily: StyleFamily;
  isStatementColor: boolean;
};

import type { ResolvedIntent } from '@/lib/intent-engine';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import {
  scoreHotWeatherItem,
  scoreItemUsageDiversity,
} from '@/lib/outfit-assembly-rules';

export type OutfitStylingContext = {
  mood: MoodId;
  intent: string;
  resolvedIntent?: ResolvedIntent;
  weather?: WeatherSnapshot;
  anchor: ItemStylingProfile | null;
  selected: ItemStylingProfile[];
  preferredTypes: WardrobeItemTypeId[];
  recentItemIds: Set<string>;
  recentOutfitSets?: string[][];
  selectedOccasion?: SelectedOccasionId;
  wardrobe?: StylingWardrobeItem[];
  styleMemory?: StyleMemory;
  seed: number;
};

const NEUTRAL_TONES = new Set([
  'black',
  'white',
  'cream',
  'ivory',
  'beige',
  'camel',
  'gray',
  'navy',
  'brown',
  'taupe',
]);

const STATEMENT_TONES = new Set([
  'burgundy',
  'pink',
  'green',
  'blue',
  'gold',
  'silver',
  'red',
  'orange',
  'yellow',
  'purple',
]);

const TONE_PATTERNS: { tone: string; patterns: RegExp[] }[] = [
  { tone: 'black', patterns: [/\bblack\b/i, /\bsiyah\b/i, /\bnoir\b/i] },
  { tone: 'white', patterns: [/\bwhite\b/i, /\bbeyaz\b/i] },
  { tone: 'cream', patterns: [/\bcream\b/i, /\bkrem\b/i] },
  { tone: 'ivory', patterns: [/\bivory\b/i, /\bfildisi\b/i, /\bfildişi\b/i] },
  { tone: 'burgundy', patterns: [/\bburgundy\b/i, /\bbordo\b/i, /\bwine\b/i, /\bşarap\b/i] },
  { tone: 'beige', patterns: [/\bbeige\b/i, /\bbej\b/i, /\btaupe\b/i, /\bvizon\b/i] },
  { tone: 'camel', patterns: [/\bcamel\b/i, /\bkahve\b/i, /\btaba\b/i, /\bbrown\b/i, /\bkahverengi\b/i] },
  { tone: 'brown', patterns: [/\bespresso\b/i, /\bchocolate\b/i] },
  { tone: 'gray', patterns: [/\bgray\b/i, /\bgrey\b/i, /\bgri\b/i, /\bantrasit\b/i, /\bcharcoal\b/i] },
  { tone: 'navy', patterns: [/\bnavy\b/i, /\blacivert\b/i, /\bdenim\b/i, /\bjean\b/i] },
  { tone: 'blue', patterns: [/\bblue\b/i, /\bmavi\b/i, /\bindigo\b/i] },
  { tone: 'pink', patterns: [/\bpink\b/i, /\bpembe\b/i, /\bblush\b/i, /\brose\b/i] },
  { tone: 'green', patterns: [/\bgreen\b/i, /\byeşil\b/i, /\byesil\b/i, /\bolive\b/i, /\bzeytin\b/i] },
  { tone: 'red', patterns: [/\bred\b/i, /\bkırmızı\b/i, /\bkirmizi\b/i, /\bcoral\b/i] },
  { tone: 'orange', patterns: [/\borange\b/i, /\bturuncu\b/i] },
  { tone: 'yellow', patterns: [/\byellow\b/i, /\bsarı\b/i, /\bsari\b/i, /\bmustard\b/i] },
  { tone: 'purple', patterns: [/\bpurple\b/i, /\bmor\b/i, /\blilac\b/i, /\blavender\b/i] },
  { tone: 'gold', patterns: [/\bgold\b/i, /\baltın\b/i, /\baltin\b/i, /\bbrass\b/i] },
  { tone: 'silver', patterns: [/\bsilver\b/i, /\bgümüş\b/i, /\bgumus\b/i] },
];

const HARMONIOUS_PAIR_LIST: [string, string][] = [
  ['black', 'cream'],
  ['black', 'ivory'],
  ['black', 'white'],
  ['black', 'beige'],
  ['black', 'camel'],
  ['black', 'gray'],
  ['black', 'navy'],
  ['black', 'brown'],
  ['cream', 'navy'],
  ['cream', 'brown'],
  ['ivory', 'navy'],
  ['ivory', 'brown'],
  ['beige', 'white'],
  ['beige', 'navy'],
  ['beige', 'brown'],
  ['camel', 'white'],
  ['camel', 'navy'],
  ['camel', 'cream'],
  ['gray', 'navy'],
  ['gray', 'cream'],
  ['navy', 'cream'],
  ['navy', 'beige'],
  ['navy', 'camel'],
  ['brown', 'ivory'],
  ['brown', 'cream'],
  ['white', 'navy'],
  ['white', 'camel'],
  ['white', 'beige'],
  ['burgundy', 'cream'],
  ['burgundy', 'gray'],
  ['burgundy', 'black'],
  ['pink', 'gray'],
  ['pink', 'cream'],
  ['blue', 'beige'],
  ['blue', 'cream'],
  ['blue', 'white'],
  ['green', 'beige'],
  ['green', 'cream'],
  ['green', 'camel'],
];

const HARMONIOUS_PAIRS = new Set(HARMONIOUS_PAIR_LIST.map(([a, b]) => pairKey(a, b)));

const CLASHING_PAIRS = new Set([
  'red|pink',
  'red|orange',
  'orange|pink',
  'purple|red',
  'green|red',
  'yellow|purple',
  'gold|silver',
]);

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

const PATTERN_SIGNALS: { level: number; patterns: RegExp[] }[] = [
  { level: 2, patterns: [/\bstripe/i, /\bçizgi/i, /\bcizgi/i, /\bplaid/i, /\bcheck/i, /\bkare\b/i, /\bgraphic/i, /\bprint/i, /\bleopard/i, /\bzebra/i, /\bfloral/i, /\bçiçek/i, /\bcicek/i] },
  { level: 1, patterns: [/\bpattern/i, /\bdeseni\b/i, /\blogo\b/i, /\bmonogram/i] },
];

const TYPE_STYLE: Record<
  WardrobeItemTypeId,
  { formality: number; volume: number; styleFamily: StyleFamily; patternPrior: number }
> = {
  tisort: { formality: 0.35, volume: 0.35, styleFamily: 'casual', patternPrior: 0 },
  gomlek: { formality: 0.82, volume: 0.3, styleFamily: 'smart', patternPrior: 0 },
  kazak: { formality: 0.72, volume: 0.45, styleFamily: 'smart', patternPrior: 0 },
  sweatshirt: { formality: 0.22, volume: 0.72, styleFamily: 'sport', patternPrior: 1 },
  hoodie: { formality: 0.18, volume: 0.78, styleFamily: 'sport', patternPrior: 1 },
  ceket: { formality: 0.88, volume: 0.42, styleFamily: 'formal', patternPrior: 0 },
  mont: { formality: 0.45, volume: 0.75, styleFamily: 'casual', patternPrior: 0 },
  trenchcoat: { formality: 0.9, volume: 0.5, styleFamily: 'luxe', patternPrior: 0 },
  kaban: { formality: 0.85, volume: 0.68, styleFamily: 'luxe', patternPrior: 0 },
  pantolon: { formality: 0.78, volume: 0.38, styleFamily: 'smart', patternPrior: 0 },
  jean: { formality: 0.42, volume: 0.42, styleFamily: 'casual', patternPrior: 0 },
  sort: { formality: 0.28, volume: 0.4, styleFamily: 'sport', patternPrior: 0 },
  tayt: { formality: 0.3, volume: 0.35, styleFamily: 'sport', patternPrior: 0 },
  etek: { formality: 0.8, volume: 0.35, styleFamily: 'formal', patternPrior: 0 },
  elbise: { formality: 0.88, volume: 0.4, styleFamily: 'formal', patternPrior: 0 },
  takim: { formality: 0.92, volume: 0.45, styleFamily: 'luxe', patternPrior: 0 },
  ayakkabi: { formality: 0.55, volume: 0.25, styleFamily: 'casual', patternPrior: 0 },
  bot: { formality: 0.7, volume: 0.45, styleFamily: 'smart', patternPrior: 0 },
  topuklu: { formality: 0.9, volume: 0.3, styleFamily: 'formal', patternPrior: 0 },
  canta: { formality: 0.75, volume: 0.35, styleFamily: 'luxe', patternPrior: 0 },
  saat: { formality: 0.8, volume: 0.1, styleFamily: 'luxe', patternPrior: 0 },
  kemer: { formality: 0.7, volume: 0.1, styleFamily: 'smart', patternPrior: 0 },
  sapka: { formality: 0.35, volume: 0.2, styleFamily: 'casual', patternPrior: 0 },
  gozluk: { formality: 0.6, volume: 0.1, styleFamily: 'smart', patternPrior: 0 },
  aksesuar: { formality: 0.65, volume: 0.1, styleFamily: 'luxe', patternPrior: 0 },
};

const MOOD_TYPE_BIAS: Record<MoodId, { boost: WardrobeItemTypeId[]; penalize: WardrobeItemTypeId[] }> = {
  elegant: {
    boost: ['gomlek', 'kazak', 'pantolon', 'etek', 'topuklu', 'trenchcoat', 'ceket', 'elbise', 'canta'],
    penalize: ['hoodie', 'sweatshirt', 'sort', 'tayt', 'sapka'],
  },
  soft: {
    boost: ['kazak', 'gomlek', 'etek', 'elbise', 'ayakkabi', 'canta'],
    penalize: ['hoodie', 'sweatshirt', 'mont'],
  },
  confident: {
    boost: ['ceket', 'pantolon', 'gomlek', 'bot', 'jean'],
    penalize: ['tayt', 'sort'],
  },
  oldMoney: {
    boost: ['gomlek', 'kazak', 'trenchcoat', 'kaban', 'pantolon', 'etek', 'topuklu', 'canta', 'saat'],
    penalize: ['hoodie', 'sweatshirt', 'tisort', 'sort', 'tayt'],
  },
  seductive: {
    boost: ['elbise', 'etek', 'topuklu', 'ceket', 'gomlek', 'aksesuar'],
    penalize: ['hoodie', 'sweatshirt', 'sort', 'sapka'],
  },
  minimal: {
    boost: ['gomlek', 'pantolon', 'kazak', 'ayakkabi', 'trenchcoat'],
    penalize: ['hoodie', 'sweatshirt', 'aksesuar', 'sapka'],
  },
};

const COLD_INTENT_PATTERN =
  /\b(cold|winter|snow|rain|rainy|evening|night|outdoor|outside|soğuk|soguk|kış|kis|kar|yağmur|yagmur|akşam|aksam|gece|dışarı|disari)\b/i;

const COMFORT_FOOTWEAR_INTENT_PATTERN =
  /\b(city walk|walk|travel|airport|explore|sightseeing|seyahat|yürüyüş|yuruyus|gezmek|keşif|kesif|havalimanı|havalimani)\b/i;

export const OUTFIT_CANDIDATE_COUNT = 12;
export const REGENERATE_OUTFIT_CANDIDATE_COUNT = 24;

function detectToneFromName(name: string): string | null {
  return TONE_PATTERNS.find((entry) => entry.patterns.some((pattern) => pattern.test(name)))?.tone ?? null;
}

function detectPatternLevel(name: string, typePrior: number): number {
  let level = typePrior;
  for (const signal of PATTERN_SIGNALS) {
    if (signal.patterns.some((pattern) => pattern.test(name))) {
      level = Math.max(level, signal.level);
    }
  }
  return level;
}

function toneFromStyleProfile(profile: WardrobeStyleProfile): string | null {
  const map: Record<string, string> = {
    dusty_rose: 'blush',
    denim_blue: 'denim',
    sage: 'sage',
    olive: 'olive',
    emerald: 'emerald',
    lavender: 'lavender',
  };
  return map[profile.color] ?? profile.color;
}

/** Uses saved styleProfile when present; legacy items fall back to itemType. */
export function analyzeWardrobeItem(item: StylingWardrobeItem): ItemStylingProfile {
  const profile =
    item.styleProfile ??
    fallbackStyleProfileFromItem({
      name: item.name,
      itemType: item.itemType,
      styleProfile: item.styleProfile,
    });
  const typeStyle = TYPE_STYLE[item.itemType] ?? TYPE_STYLE.aksesuar;
  const tone = toneFromStyleProfile(profile) ?? detectToneFromName(item.name);
  const isStatementColor =
    profile.isStatementPiece || (tone != null && STATEMENT_TONES.has(tone));
  const formality = formalityScore(profile.formality);
  const volume =
    profile.slot === 'outerwear'
      ? 0.55
      : profile.category === 'evening_dress'
        ? 0.42
        : typeStyle.volume;
  return {
    item,
    tone,
    formality,
    volume,
    patternLevel: detectPatternLevel(item.name, typeStyle.patternPrior),
    styleFamily: typeStyle.styleFamily,
    isStatementColor,
  };
}

function toneHarmonyScore(a: string | null, b: string | null): number {
  if (!a || !b) return 2;
  if (a === b) return 5;
  if (NEUTRAL_TONES.has(a) && NEUTRAL_TONES.has(b)) return 4.5;
  if (NEUTRAL_TONES.has(a) || NEUTRAL_TONES.has(b)) return 4;
  const key = pairKey(a, b);
  if (HARMONIOUS_PAIRS.has(key)) return 4.5;
  if (CLASHING_PAIRS.has(key)) return -4;
  if (STATEMENT_TONES.has(a) && STATEMENT_TONES.has(b)) return -3;
  return 0.5;
}

export function scoreColorHarmony(profiles: ItemStylingProfile[]): number {
  if (profiles.length <= 1) return 4;
  let score = 0;
  let comparisons = 0;
  let statementCount = 0;

  for (const profile of profiles) {
    if (profile.isStatementColor) statementCount += 1;
  }

  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      comparisons += 1;
      score += toneHarmonyScore(profiles[i].tone, profiles[j].tone);
    }
  }

  if (statementCount >= 2) score -= 6;
  else if (statementCount === 1) {
    const neutralsAmongRest = profiles.filter((p) => p.isStatementColor || !p.tone || NEUTRAL_TONES.has(p.tone)).length;
    if (neutralsAmongRest >= profiles.length - 1) score += 3;
    else score -= 2;
  }

  const avg = comparisons > 0 ? score / comparisons : 4;
  return avg;
}

export function scorePatternTextureHarmony(profiles: ItemStylingProfile[]): number {
  let score = 6;
  const heavyPatterns = profiles.filter((p) => p.patternLevel >= 2).length;
  const lightPatterns = profiles.filter((p) => p.patternLevel === 1).length;

  if (heavyPatterns >= 2) score -= 8;
  else if (heavyPatterns === 1 && lightPatterns >= 2) score -= 4;

  const families = new Set(profiles.map((p) => p.styleFamily));
  if (families.has('sport') && (families.has('formal') || families.has('luxe'))) {
    const sportPieces = profiles.filter((p) => p.styleFamily === 'sport').length;
    const formalPieces = profiles.filter((p) => p.styleFamily === 'formal' || p.styleFamily === 'luxe').length;
    if (sportPieces >= 1 && formalPieces >= 2) score -= 6;
    else if (sportPieces >= 1 && formalPieces >= 1) score -= 3;
  }

  const statementPieces = profiles.filter(
    (p) => p.volume >= 0.7 || p.patternLevel >= 2 || (p.isStatementColor && p.formality < 0.5),
  ).length;
  if (statementPieces >= 3) score -= 5;

  return score;
}

export function scoreSilhouetteBalance(profiles: ItemStylingProfile[]): number {
  if (profiles.length === 0) return 0;
  let score = 5;
  const volumes = profiles.map((p) => p.volume);
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
  const highVolumeCount = volumes.filter((v) => v >= 0.65).length;

  if (highVolumeCount >= 3) score -= 6;
  else if (highVolumeCount === 2 && avgVolume > 0.55) score -= 3;

  const topLike = profiles.find((p) => p.item.category === 'upper' || p.item.category === 'outerwear');
  const bottomLike = profiles.find((p) => p.item.category === 'bottom' || p.item.category === 'dress');
  if (topLike && bottomLike && topLike.volume >= 0.65 && bottomLike.volume >= 0.6) {
    score -= 4;
  } else if (topLike && bottomLike) {
    const contrast = Math.abs(topLike.volume - bottomLike.volume);
    if (contrast >= 0.25) score += 2;
  }

  const outerwear = profiles.filter((p) => p.item.category === 'outerwear');
  if (outerwear.length > 0) {
    const bulkyUnder = profiles.some(
      (p) =>
        (p.item.category === 'upper' && p.volume >= 0.65) ||
        (p.item.itemType === 'hoodie' || p.item.itemType === 'sweatshirt'),
    );
    if (bulkyUnder && outerwear.some((p) => p.volume >= 0.65)) score -= 4;
  }

  return score;
}

export function scoreMoodConsistency(profiles: ItemStylingProfile[], mood: MoodId): number {
  const bias = MOOD_TYPE_BIAS[mood];
  let score = 0;
  for (const profile of profiles) {
    if (bias.boost.includes(profile.item.itemType)) score += 2;
    if (bias.penalize.includes(profile.item.itemType)) score -= 3;
  }
  return score / Math.max(1, profiles.length);
}

function scoreWeatherFit(profiles: ItemStylingProfile[], weather?: WeatherSnapshot, intent?: string): number {
  if (!weather) return intent && COLD_INTENT_PATTERN.test(intent) ? 0 : 1;
  let score = 2;
  const { layerHint } = weatherMoodBoost(weather.condition, weather.temperature);
  const hot = weather.temperature >= 24 && layerHint !== 'warm';
  const veryHot = weather.temperature >= 29;
  const cold = weather.needsOuterwear || weather.temperature <= 14 || layerHint === 'warm';

  const outerwear = profiles.some((p) => p.item.category === 'outerwear');
  const heavyLayers = profiles.filter((p) => p.item.category === 'outerwear' || p.volume >= 0.7).length;
  const heavyShoes = profiles.some(
    (p) => p.item.itemType === 'bot' || p.item.itemType === 'topuklu',
  );

  if (hot) {
    if (heavyLayers >= 2) score -= 4;
    if (outerwear && !weather.isRainy) score -= 2;
  }
  if (veryHot) {
    if (outerwear && !weather.isRainy) score -= 5;
    if (heavyShoes) score -= 4;
    if (heavyLayers >= 1) score -= 3;
  }
  if (cold && !outerwear) score -= 2;
  if ((weather.isRainy || weather.condition === 'rain') && outerwear) score += 2;

  return score;
}

export function scoreOutfitCoherence(
  profiles: ItemStylingProfile[],
  context: Pick<OutfitStylingContext, 'mood' | 'weather' | 'intent' | 'resolvedIntent'>,
): number {
  if (profiles.length === 0) return -100;

  const color = scoreColorHarmony(profiles);
  const pattern = scorePatternTextureHarmony(profiles);
  const silhouette = scoreSilhouetteBalance(profiles);
  const mood = scoreMoodConsistency(profiles, context.mood);
  const weather = scoreWeatherFit(profiles, context.weather, context.intent);

  const formalitySpread =
    Math.max(...profiles.map((p) => p.formality)) - Math.min(...profiles.map((p) => p.formality));
  const formalityPenalty = formalitySpread > 0.55 ? -2.5 : formalitySpread > 0.4 ? -1 : 0.5;

  return (
    color * 2.2 +
    pattern * 1.1 +
    silhouette * 1.4 +
    mood * 2 +
    weather * 1.2 +
    formalityPenalty
  );
}

export function scorePieceCandidate(profile: ItemStylingProfile, context: OutfitStylingContext): number {
  const draft = [...context.selected, profile];
  let score = 0;

  if (context.preferredTypes.includes(profile.item.itemType)) score += 3.5;

  if (context.anchor) {
    score += toneHarmonyScore(profile.tone, context.anchor.tone) * 1.8;
    score += profile.styleFamily === context.anchor.styleFamily ? 1.5 : 0;
    const formalityDelta = Math.abs(profile.formality - context.anchor.formality);
    score += formalityDelta <= 0.25 ? 2 : formalityDelta <= 0.4 ? 0.5 : -2;
  }

  const moodBias = MOOD_TYPE_BIAS[context.mood];
  if (moodBias.boost.includes(profile.item.itemType)) score += 2.5;
  if (moodBias.penalize.includes(profile.item.itemType)) score -= 4;

  if (context.recentItemIds.has(profile.item.id)) score -= 8;

  if (context.recentOutfitSets?.length) {
    score += scoreItemUsageDiversity(profile.item, context.recentOutfitSets, context.recentItemIds);
  }

  if (context.selectedOccasion || context.weather) {
    score += scoreHotWeatherItem(profile.item, context.weather, context.selectedOccasion);
  }

  if (context.wardrobe?.length) {
    score += scorePieceWithBible(profile, context, context.wardrobe);
  }

  if (context.styleMemory?.favoriteTones.length) {
    const tone = profile.tone;
    if (tone && context.styleMemory.favoriteTones.some((fav) => fav.toLowerCase().includes(tone))) {
      score += 1.5;
    }
  }

  if (context.selected.length > 0) {
    score += scoreColorHarmony(draft) * 0.6;
    score += scorePatternTextureHarmony(draft) * 0.35;
    score += scoreSilhouetteBalance(draft) * 0.4;
  }

  return score;
}

export function rankWardrobeCandidates<T extends StylingWardrobeItem>(
  items: T[],
  context: OutfitStylingContext,
): T[] {
  if (items.length <= 1) return items;
  const offset = context.seed % items.length;
  const rotated = [...items.slice(offset), ...items.slice(0, offset)];

  return [...rotated]
    .map((item, index) => ({
      item,
      score: scorePieceCandidate(analyzeWardrobeItem(item), context) - index * 0.02,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

export function pickBestPiece<T extends StylingWardrobeItem>(
  items: T[],
  context: OutfitStylingContext,
): T | undefined {
  return rankWardrobeCandidates(items, context)[0];
}

export function scoreOutfitPieces(
  pieces: StylingOutfitPiece[],
  context: Pick<OutfitStylingContext, 'mood' | 'weather' | 'intent' | 'resolvedIntent'>,
): number {
  return scoreOutfitCoherence(
    pieces.map((piece) => analyzeWardrobeItem(piece.item)),
    context,
  );
}

export function needsOuterwearForContext(intent: string, weather?: WeatherSnapshot): boolean {
  if (!weather) return COLD_INTENT_PATTERN.test(intent);
  if (!weather.needsOuterwear && weather.temperature >= 22 && !weather.isRainy) return false;
  if (weather.needsOuterwear) return true;
  if (COLD_INTENT_PATTERN.test(intent)) return true;
  if (weather.temperature <= 18) return true;
  return ['rain', 'drizzle', 'snow', 'fog', 'thunderstorm'].includes(weather.condition);
}

export type OutfitSlotRole =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'shoes'
  | 'outerwear'
  | 'bag'
  | 'accessory'
  | 'jewelry'
  | 'upper-anchor';

export function preferredTypesForSlot(
  mood: MoodId,
  intent: string,
  role: OutfitSlotRole,
): WardrobeItemTypeId[] {
  const preferElegant = mood === 'elegant' || mood === 'oldMoney' || mood === 'seductive';
  const preferMinimal = mood === 'minimal';

  switch (role) {
    case 'top':
    case 'upper-anchor':
      return preferElegant || preferMinimal ? ['gomlek', 'kazak'] : ['gomlek', 'tisort'];
    case 'bottom':
      return preferElegant || preferMinimal ? ['pantolon', 'etek'] : ['pantolon', 'jean'];
    case 'dress':
      return ['elbise', 'takim'];
    case 'shoes':
      if (COMFORT_FOOTWEAR_INTENT_PATTERN.test(intent)) return ['ayakkabi', 'bot'];
      return preferElegant ? ['topuklu', 'bot', 'ayakkabi'] : ['ayakkabi', 'bot'];
    case 'outerwear':
      return ['trenchcoat', 'ceket', 'kaban', 'mont'];
    case 'bag':
      return ['canta'];
    case 'jewelry':
      return ['saat', 'aksesuar'];
    case 'accessory':
      return ['kemer', 'gozluk', 'sapka'];
    default:
      return [];
  }
}
