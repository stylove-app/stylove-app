import type { CuratedLook, WardrobeItem } from '@/lib/outfit-engine';
import type { MoodId, WardrobeCategoryId } from '@/i18n/types';

export type StyleMemory = {
  moodFrequency: Record<MoodId, number>;
  categoryFrequency: Record<WardrobeCategoryId, number>;
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
  minimalMaximalBalance: 0,
  luxuryStreetBalance: -0.3,
  favoriteTones: ['Ivory', 'Burgundy', 'Gold'],
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

export function recordLookGenerated(memory: StyleMemory, look: CuratedLook): StyleMemory {
  const next = { ...memory, moodFrequency: { ...memory.moodFrequency } };
  next.moodFrequency[look.mood] = (next.moodFrequency[look.mood] ?? 0) + 1;
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

  next.favoriteTones = mergeTones(next.favoriteTones, TONE_BY_MOOD[look.mood]);
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
  const next = {
    ...memory,
    categoryFrequency: { ...memory.categoryFrequency },
  };
  next.categoryFrequency[item.category] = (next.categoryFrequency[item.category] ?? 0) + 1;
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
  signature: string;
  energy: string;
  tones: string[];
  styleDna: string;
} {
  const moods = Object.entries(memory.moodFrequency) as [MoodId, number][];
  const topMood = moods.sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'elegant';

  const signature = t.moods[topMood];
  const energy =
    memory.luxuryStreetBalance > 0.2
      ? t.signature.energyUrban
      : memory.minimalMaximalBalance < -0.2
        ? t.signature.energyQuiet
        : t.signature.energyRefined;

  const tones =
    memory.favoriteTones.length > 0
      ? memory.favoriteTones.map((tone) => {
          const moodEntry = (Object.entries(TONE_BY_MOOD) as [MoodId, string][]).find(
            ([, v]) => v === tone,
          );
          return moodEntry ? t.signature.tones[moodEntry[0]] : tone;
        })
      : [t.signature.tones.elegant, t.signature.tones.oldMoney, t.signature.tones.confident];

  const dna =
    memory.minimalMaximalBalance < -0.15
      ? t.signature.dnaMinimal
      : memory.luxuryStreetBalance > 0.15
        ? t.signature.dnaStreet
        : t.signature.dnaParisian;

  return { signature, energy, tones: tones.slice(0, 4), styleDna: dna };
}

function mergeTones(existing: string[], tone: string): string[] {
  const next = [tone, ...existing.filter((t) => t !== tone)];
  return next.slice(0, 5);
}
