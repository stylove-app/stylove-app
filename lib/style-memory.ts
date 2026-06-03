import type { CuratedLook, WardrobeItem } from '@/lib/outfit-engine';
import type { MoodId, WardrobeCategoryId } from '@/i18n/types';

export type StyleMemory = {
  moodFrequency: Record<MoodId, number>;
  categoryFrequency: Record<WardrobeCategoryId, number>;
  toneFrequency: Record<string, number>;
  silhouetteFrequency: Record<string, number>;
  /** -1 = minimal, +1 = maximal */
  minimalMaximalBalance: number;
  /** -1 = quiet luxury, +1 = street luxury */
  luxuryStreetBalance: number;
  favoriteTones: string[];
  totalLooksGenerated: number;
  totalLooksSaved: number;
  lastUpdated: number;
};

export const STYLE_MEMORY_KEY = '@stylove/style-memory';

export const EMPTY_STYLE_MEMORY: StyleMemory = {
  moodFrequency: {
    elegant: 0,
    soft: 0,
    confident: 0,
    oldMoney: 0,
    seductive: 0,
    minimal: 0,
  },
  categoryFrequency: {
    upper: 0,
    outerwear: 0,
    bottom: 0,
    dress: 0,
    shoes: 0,
    bag: 0,
    accessory: 0,
  },
  toneFrequency: {},
  silhouetteFrequency: {},
  minimalMaximalBalance: 0,
  luxuryStreetBalance: -0.3,
  favoriteTones: [],
  totalLooksGenerated: 0,
  totalLooksSaved: 0,
  lastUpdated: Date.now(),
};

const TONE_BY_MOOD: Record<MoodId, string> = {
  elegant: 'Champagne',
  soft: 'Blush',
  confident: 'Noir',
  oldMoney: 'Camel',
  seductive: 'Wine',
  minimal: 'Ivory',
};

const SILHOUETTE_BY_MOOD: Record<MoodId, string> = {
  elegant: 'Refined Line',
  soft: 'Soft Contrast',
  confident: 'Urban Clean',
  oldMoney: 'Relaxed Tailoring',
  seductive: 'Monochrome',
  minimal: 'Minimal',
};

const TONE_LEXICON: { label: string; patterns: RegExp[] }[] = [
  { label: 'Noir', patterns: [/\bblack\b/i, /\bsiyah\b/i] },
  { label: 'Ivory', patterns: [/\bwhite\b/i, /\bcream\b/i, /\bivory\b/i, /\bbeyaz\b/i, /\bkrem\b/i, /\bfildisi\b/i, /\bfildişi\b/i] },
  { label: 'Wine', patterns: [/\bburgundy\b/i, /\bwine\b/i, /\bbordo\b/i, /\bşarap\b/i] },
  { label: 'Camel', patterns: [/\bcamel\b/i, /\bbeige\b/i, /\btaupe\b/i, /\bkahve\b/i, /\bbej\b/i, /\bvizon\b/i] },
  { label: 'Blush', patterns: [/\bpink\b/i, /\bblush\b/i, /\bpembe\b/i] },
  { label: 'Navy', patterns: [/\bnavy\b/i, /\blacivert\b/i] },
  { label: 'Charcoal', patterns: [/\bgray\b/i, /\bgrey\b/i, /\bgri\b/i, /\bantrasit\b/i] },
  { label: 'Gold', patterns: [/\bgold\b/i, /\baltın\b/i, /\baltin\b/i] },
];

export function recordLookGenerated(memory: StyleMemory, look: CuratedLook): StyleMemory {
  const next = cloneMemory(memory);
  next.moodFrequency[look.mood] = (next.moodFrequency[look.mood] ?? 0) + 1;
  const lookTones = detectLookTones(look);
  if (lookTones.length > 0) {
    lookTones.forEach((tone) => {
      next.toneFrequency[tone] = (next.toneFrequency[tone] ?? 0) + 1;
    });
  } else {
    next.toneFrequency[TONE_BY_MOOD[look.mood]] = (next.toneFrequency[TONE_BY_MOOD[look.mood]] ?? 0) + 1;
  }

  const silhouette = resolveLookSilhouette(look) ?? SILHOUETTE_BY_MOOD[look.mood];
  next.silhouetteFrequency[silhouette] = (next.silhouetteFrequency[silhouette] ?? 0) + 1;
  look.completeOutfit?.forEach((piece) => {
    next.categoryFrequency[piece.item.category] = (next.categoryFrequency[piece.item.category] ?? 0) + 1;
  });
  next.totalLooksGenerated += 1;

  if (look.mood === 'minimal') next.minimalMaximalBalance = Math.max(-1, next.minimalMaximalBalance - 0.08);
  else if (look.mood === 'seductive' || look.mood === 'confident') {
    next.minimalMaximalBalance = Math.min(1, next.minimalMaximalBalance + 0.06);
  }

  if (look.mood === 'oldMoney' || look.mood === 'elegant') {
    next.luxuryStreetBalance = Math.max(-1, next.luxuryStreetBalance - 0.05);
  } else if (look.mood === 'confident') {
    next.luxuryStreetBalance = Math.min(1, next.luxuryStreetBalance + 0.04);
  }

  next.favoriteTones = mergeTones(next.favoriteTones, lookTones[0] ?? TONE_BY_MOOD[look.mood]);
  next.lastUpdated = Date.now();
  return next;
}

export function recordLookSaved(memory: StyleMemory, look: CuratedLook): StyleMemory {
  const next = recordLookGenerated(memory, look);
  next.totalLooksSaved += 1;
  next.minimalMaximalBalance =
    look.mood === 'minimal'
      ? Math.max(-1, next.minimalMaximalBalance - 0.12)
      : next.minimalMaximalBalance;
  return next;
}

export function recordWardrobeItem(memory: StyleMemory, item: WardrobeItem): StyleMemory {
  const next = cloneMemory(memory);
  next.categoryFrequency[item.category] = (next.categoryFrequency[item.category] ?? 0) + 1;
  detectWardrobeTones(item).forEach((tone) => {
    next.toneFrequency[tone] = (next.toneFrequency[tone] ?? 0) + 1;
  });
  next.lastUpdated = Date.now();
  return next;
}

export function getSignatureFromMemory(
  memory: StyleMemory,
  t: {
    moods: Record<MoodId, string>;
    signature: {
      energyUrban: string;
      energyQuiet: string;
      energyRefined: string;
      dnaMinimal: string;
      dnaStreet: string;
      dnaParisian: string;
      tones: Record<MoodId, string>;
    };
  },
): {
  phase: 'empty' | 'forming' | 'emerging' | 'complete';
  activityCount: number;
  signature?: string;
  energy?: string;
  tones: string[];
  styleDna?: string;
} {
  const normalized = cloneMemory(memory);
  const wardrobeCount = Object.values(normalized.categoryFrequency).reduce((total, count) => total + count, 0);
  const activityCount = wardrobeCount + normalized.totalLooksGenerated + normalized.totalLooksSaved;
  const moods = Object.entries(normalized.moodFrequency) as [MoodId, number][];
  const topMood = moods.sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'elegant';
  const topMoodCount = normalized.moodFrequency[topMood] ?? 0;

  if (activityCount < 3 || (wardrobeCount < 2 && normalized.totalLooksGenerated < 2)) {
    return { phase: 'empty', activityCount, tones: [] };
  }

  const phase =
    activityCount < 7
      ? 'forming'
      : normalized.totalLooksGenerated < 5 || topMoodCount < 2
        ? 'emerging'
        : 'complete';

  const signature = phase === 'forming' ? undefined : t.moods[topMood];
  const energy =
    normalized.totalLooksGenerated < 4
      ? undefined
      : normalized.luxuryStreetBalance > 0.2
      ? t.signature.energyUrban
      : normalized.minimalMaximalBalance < -0.2
        ? t.signature.energyQuiet
        : t.signature.energyRefined;

  const tones = Object.entries(normalized.toneFrequency)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([tone]) => {
      const moodEntry = (Object.entries(TONE_BY_MOOD) as [MoodId, string][]).find(
        ([, v]) => v === tone,
      );
      return moodEntry ? t.signature.tones[moodEntry[0]] : tone;
    });

  const dna =
    phase !== 'complete'
      ? undefined
      : normalized.minimalMaximalBalance < -0.15
        ? t.signature.dnaMinimal
        : normalized.luxuryStreetBalance > 0.15
          ? t.signature.dnaStreet
          : resolveSilhouetteDna(normalized, t);

  return { phase, activityCount, signature, energy, tones: tones.slice(0, 4), styleDna: dna };
}

function mergeTones(existing: string[], tone: string): string[] {
  const next = [tone, ...existing.filter((t) => t !== tone)];
  return next.slice(0, 5);
}

function cloneMemory(memory: StyleMemory): StyleMemory {
  return {
    ...EMPTY_STYLE_MEMORY,
    ...memory,
    moodFrequency: { ...EMPTY_STYLE_MEMORY.moodFrequency, ...memory.moodFrequency },
    categoryFrequency: { ...EMPTY_STYLE_MEMORY.categoryFrequency, ...memory.categoryFrequency },
    toneFrequency: { ...(memory.toneFrequency ?? {}) },
    silhouetteFrequency: { ...(memory.silhouetteFrequency ?? {}) },
    favoriteTones: memory.favoriteTones ?? [],
  };
}

function detectWardrobeTones(item: WardrobeItem): string[] {
  const source = `${item.name} ${item.itemType}`.trim();
  return TONE_LEXICON.filter((tone) => tone.patterns.some((pattern) => pattern.test(source))).map(
    (tone) => tone.label,
  );
}

function detectLookTones(look: CuratedLook): string[] {
  const pieces = look.completeOutfit?.map((piece) => piece.item) ?? [];
  return Array.from(new Set(pieces.flatMap((item) => detectWardrobeTones(item))));
}

function resolveLookSilhouette(look: CuratedLook): string | undefined {
  const roles = new Set(look.completeOutfit?.map((piece) => piece.role) ?? []);
  if (roles.has('dress')) return 'One-Piece Edit';
  if (roles.has('outerwear')) return 'Layered Polish';
  if (roles.has('top') && roles.has('bottom')) return 'Balanced Separates';
  if (roles.has('shoes') && (roles.has('bag') || roles.has('accessory'))) return 'Accessory-Led';
  return undefined;
}

function resolveSilhouetteDna(
  memory: StyleMemory,
  t: Parameters<typeof getSignatureFromMemory>[1],
): string {
  const topSilhouette = Object.entries(memory.silhouetteFrequency).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topSilhouette === 'Minimal' || topSilhouette === 'Monochrome') return t.signature.dnaMinimal;
  if (topSilhouette === 'Urban Clean') return t.signature.dnaStreet;
  return t.signature.dnaParisian;
}
