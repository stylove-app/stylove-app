import type { MoodId, WardrobeItemTypeId } from '@/i18n/types';
import type { ResolvedIntent } from '@/lib/intent-engine';
import type { ItemStylingProfile, OutfitStylingContext, StylingWardrobeItem } from '@/lib/outfit-styling-intelligence';
import { analyzeWardrobeItem } from '@/lib/outfit-styling-intelligence';
import type { WeatherSnapshot } from '@/lib/weather';
import { weatherMoodBoost } from '@/lib/weather';

export type StylingOccasion =
  | 'business'
  | 'meeting'
  | 'office'
  | 'formal'
  | 'smart_casual'
  | 'casual'
  | 'dinner'
  | 'date'
  | 'travel'
  | 'vacation'
  | 'sport';

export type OutfitBibleScoreBreakdown = {
  total: number;
  contextFit: number;
  formalityMatch: number;
  colorHarmony: number;
  shoeCompatibility: number;
  weatherSuitability: number;
  categoryCompleteness: number;
  diversityScore: number;
  forbiddenPairPenalty: number;
};

const BUSINESS_OCCASIONS = new Set<StylingOccasion>(['business', 'meeting', 'office', 'formal']);

const OCCASION_SIGNALS: { occasion: StylingOccasion; patterns: RegExp[] }[] = [
  { occasion: 'business', patterns: [/\b(business|iş|is toplantı|is toplantisi|boardroom|corporate|kurumsal|müşteri|musteri)\b/i] },
  { occasion: 'meeting', patterns: [/\b(meeting|toplantı|toplanti|presentation|sunum)\b/i] },
  { occasion: 'office', patterns: [/\b(office|ofis|work|iş yer|is yer)\b/i] },
  { occasion: 'formal', patterns: [/\b(formal|resmi|black tie|gala|tören|toren)\b/i] },
  { occasion: 'smart_casual', patterns: [/\b(smart casual|şık günlük|sik gunluk|after work)\b/i] },
  { occasion: 'casual', patterns: [/\b(casual|günlük|gunluk|weekend|hafta sonu|relaxed)\b/i] },
  { occasion: 'dinner', patterns: [/\b(dinner|yemek|restaurant|restoran|fine dining)\b/i] },
  { occasion: 'date', patterns: [/\b(date|randevu|romantic|romantik|anniversary)\b/i] },
  { occasion: 'travel', patterns: [/\b(travel|seyahat|airport|havalimanı|havalimani|trip|gezi)\b/i] },
  { occasion: 'vacation', patterns: [/\b(vacation|tatil|holiday|resort)\b/i] },
  { occasion: 'sport', patterns: [/\b(sport|spor|gym|fitness|workout|koşu|kosu)\b/i] },
];

const NEUTRAL_TONES = new Set([
  'black', 'white', 'ivory', 'cream', 'beige', 'camel', 'taupe', 'gray', 'charcoal', 'navy', 'brown',
]);

const STATEMENT_TONES = new Set([
  'burgundy', 'wine', 'pink', 'blush', 'green', 'sage', 'olive', 'mint', 'emerald', 'blue', 'powder',
  'sky', 'royal', 'denim', 'purple', 'lavender', 'lilac', 'plum', 'red', 'cherry', 'ruby', 'yellow',
  'mustard', 'butter', 'orange', 'peach', 'terracotta', 'burnt', 'chocolate', 'mocha', 'cognac', 'tan',
  'gold', 'silver',
]);

const SAFE_PALETTES: string[][] = [
  ['black', 'cream', 'gold'],
  ['navy', 'white', 'camel'],
  ['burgundy', 'cream'],
  ['sage', 'beige'],
  ['emerald', 'black'],
  ['powder', 'white'],
  ['blush', 'cream'],
  ['charcoal', 'white'],
  ['chocolate', 'beige'],
];

const HARMONIOUS_PAIRS = new Set(
  [
    ['black', 'cream'], ['black', 'ivory'], ['black', 'white'], ['black', 'beige'], ['black', 'navy'],
    ['navy', 'cream'], ['navy', 'white'], ['navy', 'camel'], ['navy', 'beige'], ['cream', 'brown'],
    ['ivory', 'navy'], ['ivory', 'brown'], ['beige', 'white'], ['camel', 'white'], ['gray', 'navy'],
    ['burgundy', 'cream'], ['burgundy', 'black'], ['sage', 'beige'], ['emerald', 'black'],
    ['blush', 'cream'], ['blush', 'gray'], ['chocolate', 'beige'], ['powder', 'white'],
  ].map(([a, b]) => (a < b ? `${a}|${b}` : `${b}|${a}`)),
);

const BUSINESS_BANNED_TYPES = new Set<WardrobeItemTypeId>([
  'hoodie', 'sweatshirt', 'sort', 'tayt', 'tisort',
]);

const BUSINESS_LOW_TYPES = new Set<WardrobeItemTypeId>(['jean', 'mont']);

const FORMAL_SHOE_NAME = /\b(kundura|oxford|derby|loafer|mokasin|moccasin|klasik|formal|heel|stiletto|pump|topuklu)\b/i;
const CASUAL_SHOE_NAME = /\b(sneaker|spor|trainer|canvas|gym|running|koşu|kosu|athletic)\b/i;
const FORMAL_BOTTOM_NAME = /\b(trouser|tailored|wool|kumaş|kumas|dress pant|slacks|pantolon|etek|suit)\b/i;
const RIPPED_DENIM = /\b(ripped|yırtık|yirtik|destroyed|distressed)\b/i;

const TONE_PATTERNS: { tone: string; patterns: RegExp[] }[] = [
  { tone: 'black', patterns: [/\bblack\b/i, /\bsiyah\b/i, /\bnoir\b/i, /\bcharcoal\b/i, /\bantrasit\b/i] },
  { tone: 'white', patterns: [/\bwhite\b/i, /\bbeyaz\b/i] },
  { tone: 'ivory', patterns: [/\bivory\b/i, /\bfildişi\b/i, /\bfildisi\b/i] },
  { tone: 'cream', patterns: [/\bcream\b/i, /\bkrem\b/i, /\becru\b/i] },
  { tone: 'beige', patterns: [/\bbeige\b/i, /\bbej\b/i, /\btaupe\b/i, /\bvizon\b/i] },
  { tone: 'camel', patterns: [/\bcamel\b/i, /\btaba\b/i] },
  { tone: 'brown', patterns: [/\bbrown\b/i, /\bkahve\b/i, /\bchocolate\b/i, /\bmocha\b/i, /\bespresso\b/i] },
  { tone: 'gray', patterns: [/\bgray\b/i, /\bgrey\b/i, /\bgri\b/i] },
  { tone: 'navy', patterns: [/\bnavy\b/i, /\blacivert\b/i] },
  { tone: 'denim', patterns: [/\bdenim\b/i, /\bjean\b/i, /\bjeans\b/i] },
  { tone: 'burgundy', patterns: [/\bburgundy\b/i, /\bbordo\b/i, /\bwine\b/i] },
  { tone: 'blush', patterns: [/\bblush\b/i, /\bdusty rose\b/i, /\bpembe\b/i, /\brose\b/i, /\bsoft pink\b/i] },
  { tone: 'pink', patterns: [/\bpink\b/i, /\bhot pink\b/i, /\bfuchsia\b/i] },
  { tone: 'sage', patterns: [/\bsage\b/i, /\bsoft green\b/i] },
  { tone: 'olive', patterns: [/\bolive\b/i, /\bzeytin\b/i] },
  { tone: 'mint', patterns: [/\bmint\b/i, /\bnane\b/i] },
  { tone: 'emerald', patterns: [/\bemerald\b/i, /\bforest\b/i] },
  { tone: 'green', patterns: [/\bgreen\b/i, /\byeşil\b/i, /\byesil\b/i] },
  { tone: 'powder', patterns: [/\bpowder blue\b/i, /\bsky blue\b/i, /\bacik mavi\b/i] },
  { tone: 'sky', patterns: [/\bsky\b/i, /\bmavi\b/i, /\bblue\b/i] },
  { tone: 'royal', patterns: [/\broyal blue\b/i, /\bindigo\b/i] },
  { tone: 'lavender', patterns: [/\blavender\b/i, /\blilac\b/i, /\bmor\b/i] },
  { tone: 'purple', patterns: [/\bpurple\b/i, /\bplum\b/i] },
  { tone: 'red', patterns: [/\bred\b/i, /\bkırmızı\b/i, /\bkirmizi\b/i, /\bcherry\b/i, /\bruby\b/i] },
  { tone: 'yellow', patterns: [/\bmustard\b/i, /\bbutter\b/i, /\bsarı\b/i, /\bsari\b/i] },
  { tone: 'orange', patterns: [/\borange\b/i, /\bturuncu\b/i, /\bterracotta\b/i, /\bpeach\b/i, /\bburnt orange\b/i] },
  { tone: 'gold', patterns: [/\bgold\b/i, /\baltın\b/i, /\baltin\b/i] },
  { tone: 'tan', patterns: [/\btan\b/i, /\bcognac\b/i] },
];

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function classifyStylingOccasion(intent: string): StylingOccasion {
  const lower = intent.trim().toLowerCase();
  for (const signal of OCCASION_SIGNALS) {
    if (signal.patterns.some((pattern) => pattern.test(lower))) {
      return signal.occasion;
    }
  }
  if (/\b(akşam|aksam|gece|evening|night)\b/i.test(lower)) return 'dinner';
  return 'smart_casual';
}

export function occasionFromStylingContext(
  context: Pick<OutfitStylingContext, 'intent' | 'resolvedIntent'>,
): StylingOccasion {
  return context.resolvedIntent?.occasion ?? classifyStylingOccasion(context.intent);
}

function wardrobeHasBlazer(wardrobe: StylingWardrobeItem[]): boolean {
  return wardrobe.some(
    (item) =>
      item.itemType === 'ceket' ||
      item.itemType === 'trenchcoat' ||
      /\b(blazer|suit jacket|takım ceket|takim ceket)\b/i.test(item.name),
  );
}

function wardrobeHasFormalShoe(wardrobe: StylingWardrobeItem[]): boolean {
  return wardrobe.some((item) => {
    if (item.category !== 'shoes') return false;
    const profile = analyzeWardrobeItem(item);
    return isFormalShoe(profile);
  });
}

export function detectItemTone(name: string): string | null {
  return TONE_PATTERNS.find((entry) => entry.patterns.some((pattern) => pattern.test(name)))?.tone ?? null;
}

function isBusinessContext(occasion: StylingOccasion): boolean {
  return BUSINESS_OCCASIONS.has(occasion);
}

function wardrobeHasTailoredBottom(wardrobe: StylingWardrobeItem[]): boolean {
  return wardrobe.some((item) => item.itemType === 'pantolon' || item.itemType === 'etek');
}

function isFormalShoe(profile: ItemStylingProfile): boolean {
  if (profile.item.itemType === 'topuklu') return true;
  if (profile.item.itemType === 'bot' && FORMAL_SHOE_NAME.test(profile.item.name)) return true;
  if (profile.item.itemType === 'ayakkabi' && FORMAL_SHOE_NAME.test(profile.item.name)) return true;
  if (profile.item.itemType === 'ayakkabi' && !CASUAL_SHOE_NAME.test(profile.item.name) && profile.formality >= 0.55) {
    return true;
  }
  return false;
}

function isCasualShoe(profile: ItemStylingProfile): boolean {
  if (CASUAL_SHOE_NAME.test(profile.item.name)) return true;
  if (profile.item.itemType === 'ayakkabi' && profile.formality < 0.5) return true;
  return false;
}

function isFormalBottom(profile: ItemStylingProfile): boolean {
  if (profile.item.itemType === 'pantolon' || profile.item.itemType === 'etek') return true;
  if (profile.item.itemType === 'jean' && FORMAL_BOTTOM_NAME.test(profile.item.name)) return false;
  if (FORMAL_BOTTOM_NAME.test(profile.item.name)) return true;
  return false;
}

function isCasualBottom(profile: ItemStylingProfile): boolean {
  return (
    profile.item.itemType === 'jean' ||
    profile.item.itemType === 'sort' ||
    (profile.item.category === 'bottom' && profile.formality < 0.5)
  );
}

export function preferredTypesForOccasion(
  occasion: StylingOccasion,
  role: 'top' | 'bottom' | 'dress' | 'shoes' | 'outerwear',
  wardrobe: StylingWardrobeItem[],
): WardrobeItemTypeId[] {
  const hasTailoredBottom = wardrobeHasTailoredBottom(wardrobe);

  if (role === 'bottom') {
    if (isBusinessContext(occasion)) {
      return hasTailoredBottom ? ['pantolon', 'etek', 'jean'] : ['pantolon', 'etek', 'jean', 'sort'];
    }
    if (occasion === 'smart_casual') return ['pantolon', 'jean', 'etek', 'sort'];
    if (occasion === 'casual' || occasion === 'vacation') return ['jean', 'pantolon', 'sort', 'tayt'];
    if (occasion === 'date' || occasion === 'dinner') return ['etek', 'elbise', 'pantolon', 'jean'];
    if (occasion === 'travel') return ['pantolon', 'jean', 'tayt', 'sort'];
    return ['pantolon', 'jean', 'etek'];
  }

  if (role === 'shoes') {
    if (isBusinessContext(occasion) || occasion === 'formal' || occasion === 'dinner' || occasion === 'date') {
      return ['topuklu', 'bot', 'ayakkabi'];
    }
    if (occasion === 'travel' || occasion === 'vacation') return ['ayakkabi', 'bot', 'topuklu'];
    return ['ayakkabi', 'bot', 'topuklu'];
  }

  if (role === 'top') {
    if (isBusinessContext(occasion)) return ['gomlek', 'kazak', 'tisort'];
    if (occasion === 'casual') return ['tisort', 'gomlek', 'kazak', 'sweatshirt'];
    return ['gomlek', 'kazak', 'tisort'];
  }

  if (role === 'outerwear') {
    if (isBusinessContext(occasion)) return ['ceket', 'trenchcoat', 'kaban'];
    return ['ceket', 'mont', 'trenchcoat', 'kaban'];
  }

  return ['elbise', 'takim'];
}

export function scorePieceWithBible(
  profile: ItemStylingProfile,
  context: OutfitStylingContext,
  wardrobe: StylingWardrobeItem[],
): number {
  const occasion = occasionFromStylingContext(context);
  const resolved = context.resolvedIntent;
  let score = 0;

  if (BUSINESS_BANNED_TYPES.has(profile.item.itemType)) {
    if (isBusinessContext(occasion)) return -40;
  }

  if (
    isBusinessContext(occasion) &&
    profile.item.itemType === 'hoodie' &&
    wardrobeHasBlazer(wardrobe)
  ) {
    score -= 28;
  }

  if (isBusinessContext(occasion) && BUSINESS_LOW_TYPES.has(profile.item.itemType)) {
    if (profile.item.itemType === 'jean' && wardrobeHasTailoredBottom(wardrobe)) {
      score -= 18;
    } else {
      score -= 6;
    }
  }

  if (RIPPED_DENIM.test(profile.item.name) && isBusinessContext(occasion)) score -= 25;

  const role =
    profile.item.category === 'shoes'
      ? 'shoes'
      : profile.item.category === 'bottom'
        ? 'bottom'
        : profile.item.category === 'dress'
          ? 'dress'
          : profile.item.category === 'outerwear'
            ? 'outerwear'
            : 'top';

  const preferred = preferredTypesForOccasion(occasion, role, wardrobe);
  const prefIndex = preferred.indexOf(profile.item.itemType);
  if (prefIndex === 0) score += 8;
  else if (prefIndex > 0) score += 4 - prefIndex * 0.5;
  else score -= 3;

  if (role === 'shoes' && isBusinessContext(occasion)) {
    if (isFormalShoe(profile)) score += 10;
    if (isCasualShoe(profile)) {
      score -= wardrobeHasFormalShoe(wardrobe) ? 18 : 12;
    }
  }

  if (role === 'bottom' && isBusinessContext(occasion) && isFormalBottom(profile)) score += 10;

  if (occasion === 'date' || occasion === 'dinner') {
    if (profile.formality >= 0.72) score += 4;
    if (profile.item.itemType === 'hoodie' || profile.item.itemType === 'sweatshirt') score -= 10;
  }

  if (occasion === 'travel' || occasion === 'vacation') {
    if (profile.item.itemType === 'ayakkabi' || profile.item.itemType === 'bot') score += 3;
    if (profile.volume >= 0.75) score -= 2;
  }

  if (resolved) {
    if (resolved.comfortNeed >= 0.65 && profile.volume >= 0.75) score -= 3;
    if (resolved.comfortNeed >= 0.65 && profile.volume <= 0.45) score += 2;
    if (resolved.movementLevel >= 0.6 && role === 'shoes' && !isCasualShoe(profile)) score += 2;
    if (resolved.eleganceNeed >= 0.65 && profile.formality >= 0.7) score += 3;
    if (resolved.formalityLevel >= 0.75 && profile.formality < 0.5) score -= 5;
  }

  return score;
}

function scoreColorHarmonyBible(
  profiles: ItemStylingProfile[],
  resolved?: ResolvedIntent,
): number {
  if (profiles.length <= 1) return 12;

  const tones = profiles.map((p) => p.tone ?? detectItemTone(p.item.name)).filter(Boolean) as string[];
  const uniqueTones = [...new Set(tones)];
  const statementCount = uniqueTones.filter((t) => STATEMENT_TONES.has(t)).length;
  const neutralOnly =
    uniqueTones.length > 0 && uniqueTones.every((tone) => NEUTRAL_TONES.has(tone) || tone === 'denim');

  let harmony = 0;
  let comparisons = 0;
  for (let i = 0; i < uniqueTones.length; i++) {
    for (let j = i + 1; j < uniqueTones.length; j++) {
      comparisons += 1;
      const a = uniqueTones[i];
      const b = uniqueTones[j];
      if (a === b) harmony += 3;
      else if (NEUTRAL_TONES.has(a) && NEUTRAL_TONES.has(b)) harmony += 3;
      else if (NEUTRAL_TONES.has(a) || NEUTRAL_TONES.has(b)) harmony += 2.5;
      else if (HARMONIOUS_PAIRS.has(pairKey(a, b))) harmony += 3;
      else harmony += 0.5;
    }
  }

  const avg = comparisons > 0 ? harmony / comparisons : 2;
  let score = Math.min(15, avg * 4);

  if (statementCount > 3) score -= 6;
  else if (statementCount === 3) score -= 2;

  const heavyPattern = profiles.filter((p) => p.patternLevel >= 2).length;
  if (heavyPattern >= 2) score -= 5;

  if (resolved && resolved.eleganceNeed >= 0.55) {
    if (statementCount >= 1 && !neutralOnly) score += 2;
    if (neutralOnly && statementCount === 0) score -= 3;
  }
  if (statementCount >= 2 && statementCount <= 3) score += 1.5;

  return Math.max(0, Math.min(15, score));
}

function scoreForbiddenPairs(
  profiles: ItemStylingProfile[],
  occasion: StylingOccasion,
  wardrobe: StylingWardrobeItem[],
): number {
  let penalty = 0;
  const shoes = profiles.filter((p) => p.item.category === 'shoes');
  const bottoms = profiles.filter((p) => p.item.category === 'bottom');
  const shoe = shoes[0];
  const bottom = bottoms[0];

  if (shoe && bottom && isBusinessContext(occasion)) {
    if (bottom.item.itemType === 'jean' && isFormalShoe(shoe)) penalty -= 50;
    if (isCasualBottom(bottom) && isFormalShoe(shoe) && !isBusinessContext(occasion)) penalty -= 5;
  }

  if (shoe && bottom && isCasualShoe(shoe) && isFormalBottom(bottom) && !isBusinessContext(occasion)) {
    penalty -= 8;
  }

  if (isBusinessContext(occasion)) {
    for (const profile of profiles) {
      if (BUSINESS_BANNED_TYPES.has(profile.item.itemType)) penalty -= 30;
      if (profile.item.itemType === 'jean' && wardrobeHasTailoredBottom(wardrobe)) penalty -= 20;
    }
  }

  return penalty;
}

function scoreCategoryCompleteness(profiles: ItemStylingProfile[]): number {
  const hasDress = profiles.some((p) => p.item.category === 'dress');
  const hasRealTop = profiles.some(
    (p) =>
      p.item.category === 'upper' &&
      !['saat', 'kemer', 'gozluk', 'canta', 'sapka', 'aksesuar'].includes(p.item.itemType),
  );
  const hasBottom = profiles.some((p) => p.item.category === 'bottom');
  const hasShoes = profiles.some((p) => p.item.category === 'shoes');
  const outerwearOnly =
    profiles.some((p) => p.item.category === 'outerwear') && !hasRealTop && !hasDress;

  let score = 0;
  if (hasDress) score += 6;
  else {
    if (hasRealTop) score += 3;
    if (hasBottom) score += 3;
  }
  if (hasShoes) score += 4;
  if (outerwearOnly) score -= 6;
  return Math.min(10, score);
}

function scoreWeatherSuitability(
  profiles: ItemStylingProfile[],
  occasion: StylingOccasion,
  weather?: WeatherSnapshot,
): number {
  if (!weather) return occasion === 'travel' ? 6 : 5;

  let score = 5;
  const { layerHint } = weatherMoodBoost(weather.condition, weather.temperature);
  const outerwear = profiles.some((p) => p.item.category === 'outerwear');
  const hot = weather.temperature >= 24 && layerHint !== 'warm';
  const cold = weather.needsOuterwear || weather.temperature <= 14 || layerHint === 'warm';

  if (hot && profiles.filter((p) => p.volume >= 0.7).length >= 2) score -= 3;
  if (cold && !outerwear) score -= 3;
  if (weather.isRainy && outerwear) score += 3;
  if (occasion === 'travel' && profiles.some((p) => p.item.category === 'shoes')) score += 2;

  return Math.max(0, Math.min(10, score));
}

export function outfitItemSignature(itemIds: string[]): string {
  return [...itemIds].sort().join('|');
}

export function countOutfitPieceDifference(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let diff = 0;
  for (const id of setA) if (!setB.has(id)) diff += 1;
  for (const id of setB) if (!setA.has(id)) diff += 1;
  return diff;
}

export function scoreOutfitDiversity(
  itemIds: string[],
  recentOutfitSets: string[][],
  seenSignatures: Set<string>,
  recentCoreSets?: string[][],
): number {
  const signature = outfitItemSignature(itemIds);
  if (seenSignatures.has(signature)) return -40;

  let score = 5;
  const recent = recentOutfitSets.slice(-5);
  const recentCore = (recentCoreSets ?? recentOutfitSets).slice(-5);
  for (let i = 0; i < recent.length; i += 1) {
    const prior = recent[i];
    const priorCore = recentCore[i] ?? prior;
    const overlap = prior.filter((id) => itemIds.includes(id)).length;
    if (overlap >= itemIds.length) score -= 30;
    else if (overlap >= Math.max(1, itemIds.length - 1)) score -= 16;
    const diff = countOutfitPieceDifference(itemIds, prior);
    if (diff < 2) score -= 20;
    else if (diff >= 3) score += 3;
    else if (diff >= 2) score += 1;

    if (priorCore.length > 0) {
      const coreOverlap = priorCore.filter((id) => itemIds.includes(id)).length;
      const coreRatio = coreOverlap / Math.max(priorCore.length, 1);
      if (coreRatio >= 0.5) score -= 28;
      else if (coreRatio >= 0.34) score -= 14;
      else if (coreRatio === 0) score += 4;
    }
  }

  const uniqueItems = new Set(itemIds);
  for (const id of itemIds) {
    const usedInRecent = recent.filter((set) => set.includes(id)).length;
    if (usedInRecent >= 3) score -= 10;
    else if (usedInRecent >= 2) score -= 6;
  }
  if (uniqueItems.size >= 3) score += 1;

  return Math.max(-50, Math.min(5, score));
}

export function scoreOutfitBible(
  profiles: ItemStylingProfile[],
  context: Pick<OutfitStylingContext, 'intent' | 'weather' | 'mood' | 'resolvedIntent'>,
  wardrobe: StylingWardrobeItem[],
  options?: {
    recentOutfitSets?: string[][];
    recentCoreSets?: string[][];
    seenSignatures?: Set<string>;
  },
): OutfitBibleScoreBreakdown {
  const occasion = occasionFromStylingContext(context);
  const resolved = context.resolvedIntent;
  const avgFormality =
    profiles.length > 0 ? profiles.reduce((sum, p) => sum + p.formality, 0) / profiles.length : 0.5;

  const intentFormality = resolved?.formalityLevel;
  let contextFit = 12;
  if (isBusinessContext(occasion)) {
    contextFit = avgFormality >= 0.65 ? 28 : avgFormality >= 0.5 ? 18 : 8;
    if (intentFormality !== undefined && avgFormality >= intentFormality - 0.12) contextFit += 2;
    if (profiles.some((p) => BUSINESS_BANNED_TYPES.has(p.item.itemType))) contextFit -= 15;
  } else if (occasion === 'casual') {
    contextFit = 22;
  } else if (occasion === 'date' || occasion === 'dinner') {
    contextFit = avgFormality >= 0.7 ? 26 : 16;
  } else if (occasion === 'travel' || occasion === 'vacation') {
    contextFit = 20;
  } else {
    contextFit = 18;
  }
  contextFit = Math.max(0, Math.min(30, contextFit));

  let formalityMatch = 10;
  const targetFormality =
    intentFormality ??
    (isBusinessContext(occasion) ? 0.82 : occasion === 'casual' ? 0.45 : occasion === 'date' || occasion === 'dinner' ? 0.78 : 0.65);
  const formalityDelta = Math.abs(avgFormality - targetFormality);
  formalityMatch = Math.max(0, Math.min(20, 20 - formalityDelta * 35));

  const colorHarmony = scoreColorHarmonyBible(profiles, resolved);

  let shoeCompatibility = 7;
  const shoe = profiles.find((p) => p.item.category === 'shoes');
  const bottom = profiles.find((p) => p.item.category === 'bottom');
  if (shoe && bottom) {
    if (isBusinessContext(occasion) && isFormalShoe(shoe) && isFormalBottom(bottom)) shoeCompatibility = 10;
    else if (isBusinessContext(occasion) && bottom.item.itemType === 'jean' && isFormalShoe(shoe)) shoeCompatibility = 1;
    else if (!isBusinessContext(occasion) && isCasualShoe(shoe) && isCasualBottom(bottom)) shoeCompatibility = 9;
    else shoeCompatibility = 6;
  }

  const weatherSuitability = scoreWeatherSuitability(profiles, occasion, context.weather);
  const categoryCompleteness = scoreCategoryCompleteness(profiles);

  const itemIds = profiles.map((p) => p.item.id);
  const diversityScore = scoreOutfitDiversity(
    itemIds,
    options?.recentOutfitSets ?? [],
    options?.seenSignatures ?? new Set(),
    options?.recentCoreSets,
  );

  const forbiddenPairPenalty = scoreForbiddenPairs(profiles, occasion, wardrobe);

  const total =
    contextFit +
    formalityMatch +
    colorHarmony +
    shoeCompatibility +
    weatherSuitability +
    categoryCompleteness +
    diversityScore +
    forbiddenPairPenalty;

  return {
    total,
    contextFit,
    formalityMatch,
    colorHarmony,
    shoeCompatibility,
    weatherSuitability,
    categoryCompleteness,
    diversityScore,
    forbiddenPairPenalty,
  };
}

export function buildBibleOutfitExplanation(
  profiles: ItemStylingProfile[],
  intent: string,
  weather?: WeatherSnapshot,
  resolved?: ResolvedIntent,
): { whyThisWorks: string; stylingNotes: string[] } {
  const occasion = resolved?.occasion ?? classifyStylingOccasion(intent);
  const occasionLabel =
    occasion === 'business'
      ? 'business or meeting'
      : occasion === 'meeting'
        ? 'meeting'
        : occasion === 'office'
          ? 'office'
          : occasion === 'formal'
            ? 'formal occasion'
            : occasion === 'smart_casual'
              ? 'smart casual'
              : occasion === 'casual'
                ? 'casual day'
                : occasion === 'date'
                  ? 'date'
                  : occasion === 'dinner'
                    ? 'dinner'
                    : occasion === 'travel'
                      ? 'travel'
                      : 'your plans';

  const tones = [...new Set(profiles.map((p) => p.tone ?? detectItemTone(p.item.name)).filter(Boolean))];
  const toneLine =
    tones.length >= 2
      ? `Color harmony follows a ${tones.slice(0, 3).join(', ')} palette with calm contrast.`
      : 'Neutral tones keep the look polished when color cues are limited.';

  const shoe = profiles.find((p) => p.item.category === 'shoes');
  const bottom = profiles.find((p) => p.item.category === 'bottom');
  let shoeLine = 'Footwear supports the overall silhouette.';
  if (shoe && bottom) {
    if (isBusinessContext(occasion) && isFormalShoe(shoe) && isFormalBottom(bottom)) {
      shoeLine = 'Formal shoes align with tailored trousers for a meeting-ready finish.';
    } else if (bottom.item.itemType === 'jean' && shoe) {
      shoeLine = isCasualShoe(shoe)
        ? 'Relaxed shoes balance denim for an easy, modern proportion.'
        : 'Shoe choice is kept refined to avoid a casual-formal clash.';
    }
  }

  let weatherLine = '';
  if (weather) {
    const condition = weather.condition;
    if (weather.needsOuterwear || weather.temperature <= 14) {
      weatherLine = `Layering suits ${weather.temperature}° conditions${condition === 'rain' || condition === 'drizzle' ? ' and rain' : ''}.`;
    } else if (weather.temperature >= 22) {
      weatherLine = `Light layers match ${weather.temperature}° weather without overheating the look.`;
    } else {
      weatherLine = `Pieces are balanced for ${weather.temperature}° and ${condition} skies.`;
    }
  }

  const contextLine = `Chosen for ${occasionLabel}: structure and formality match the moment.`;

  return {
    whyThisWorks: [contextLine, toneLine, shoeLine, weatherLine].filter(Boolean).join(' '),
    stylingNotes: [contextLine, toneLine, shoeLine, weatherLine].filter(Boolean),
  };
}

export function buildOutfitDiversityContext(
  looks: {
    itemIds: string[];
    completeOutfit?: { role: string; item: { id: string } }[];
  }[],
): {
  recentOutfitSets: string[][];
  recentCoreSets: string[][];
  seenSignatures: Set<string>;
  recentItemIds: string[];
} {
  const sets = looks.map((look) => look.itemIds.filter(Boolean)).filter((ids) => ids.length > 0);
  const recentOutfitSets = sets.slice(-6);
  const recentCoreSets = looks
    .map((look) => {
      if (!look.completeOutfit?.length) return look.itemIds.filter(Boolean);
      return look.completeOutfit
        .filter((piece) => piece.role === 'top' || piece.role === 'bottom' || piece.role === 'dress')
        .map((piece) => piece.item.id);
    })
    .filter((ids) => ids.length > 0)
    .slice(-6);
  const seenSignatures = new Set(recentOutfitSets.map((ids) => outfitItemSignature(ids)));
  const recentItemIds = [...new Set(recentOutfitSets.slice(-5).flat())];
  return { recentOutfitSets, recentCoreSets, seenSignatures, recentItemIds };
}

export function scoreOutfitPiecesWithBible(
  pieces: { item: StylingWardrobeItem }[],
  context: Pick<OutfitStylingContext, 'intent' | 'weather' | 'mood' | 'resolvedIntent'>,
  wardrobe: StylingWardrobeItem[],
  options?: {
    recentOutfitSets?: string[][];
    recentCoreSets?: string[][];
    seenSignatures?: Set<string>;
  },
): number {
  const profiles = pieces.map((piece) => analyzeWardrobeItem(piece.item));
  return scoreOutfitBible(profiles, context, wardrobe, options).total;
}
