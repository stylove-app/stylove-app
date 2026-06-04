import type { ColorFamilyId } from '@/lib/color-harmony-intelligence';
import type { OutfitConcept } from '@/lib/outfit-concept-planner';
import type { WardrobeItem } from '@/lib/outfit-engine';
import { getEffectiveStyleProfile, type WardrobeColorId } from '@/lib/wardrobe-style-profile';

export type PaletteMode =
  | 'monochrome'
  | 'tonal'
  | 'neutral_accent'
  | 'analogous'
  | 'complementary'
  | 'soft_pastel'
  | 'dark_elegant'
  | 'summer_light'
  | 'warm_earthy'
  | 'cool_classic';

export type PlannedPalette = {
  mode: PaletteMode;
  anchor: ColorFamilyId[];
  neutrals: ColorFamilyId[];
  accent: ColorFamilyId | null;
  allowBoldAccent: boolean;
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
  'denim_blue',
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
  'gold',
  'multicolor',
  'lavender',
  'dusty_rose',
]);

const ANALOGOUS_GROUPS: ColorFamilyId[][] = [
  ['navy', 'denim_blue', 'sky_blue'],
  ['sage', 'olive', 'emerald'],
  ['cream', 'beige', 'camel', 'brown', 'white'],
  ['dusty_rose', 'pink', 'burgundy', 'red'],
  ['lavender', 'purple', 'burgundy'],
  ['black', 'gray', 'navy'],
  ['yellow', 'orange', 'camel'],
  ['purple', 'lavender', 'pink'],
  ['orange', 'red', 'burgundy'],
  ['sky_blue', 'sage', 'emerald'],
];

const COMPLEMENTARY_PAIRS: [ColorFamilyId, ColorFamilyId][] = [
  ['navy', 'camel'],
  ['denim_blue', 'cream'],
  ['burgundy', 'cream'],
  ['emerald', 'cream'],
  ['sage', 'beige'],
  ['orange', 'navy'],
  ['purple', 'cream'],
  ['yellow', 'navy'],
  ['pink', 'gray'],
];

function normalizeColorFamily(color: WardrobeColorId | string): ColorFamilyId {
  const map: Partial<Record<WardrobeColorId, ColorFamilyId>> = {
    blue: 'sky_blue',
    green: 'sage',
    denim_blue: 'denim_blue',
    pink: 'pink',
    dusty_rose: 'dusty_rose',
    multicolor: 'multicolor',
  };
  return (map[color as WardrobeColorId] ?? color) as ColorFamilyId;
}

export function getItemColorFamily(item: WardrobeItem): ColorFamilyId {
  const profile = getEffectiveStyleProfile(item);
  return normalizeColorFamily(profile.color);
}

export function collectWardrobeColorFamilies(items: WardrobeItem[]): ColorFamilyId[] {
  const counts = new Map<ColorFamilyId, number>();
  for (const item of items) {
    const c = getItemColorFamily(item);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
}

function pickModeFromConcept(concept: OutfitConcept, available: ColorFamilyId[], seed: number): PaletteMode {
  for (const preferred of concept.paletteModes) {
    if (modeFitsWardrobe(preferred, available)) return preferred;
  }
  return concept.paletteModes[seed % concept.paletteModes.length] ?? 'neutral_accent';
}

function modeFitsWardrobe(mode: PaletteMode, available: ColorFamilyId[]): boolean {
  const neutrals = available.filter((c) => NEUTRAL_FAMILIES.has(c));
  const strong = available.filter((c) => STRONG_FAMILIES.has(c));
  switch (mode) {
    case 'monochrome':
    case 'tonal':
      return available.length >= 1;
    case 'neutral_accent':
      return neutrals.length >= 1;
    case 'summer_light':
      return available.some((c) => ['white', 'cream', 'beige', 'sky_blue', 'sage', 'pink', 'yellow'].includes(c));
    case 'dark_elegant':
      return available.some((c) => ['black', 'navy', 'burgundy', 'gray', 'emerald'].includes(c));
    case 'warm_earthy':
      return available.some((c) => ['camel', 'brown', 'beige', 'orange', 'burgundy'].includes(c));
    case 'cool_classic':
      return available.some((c) => ['navy', 'gray', 'cream', 'white', 'black'].includes(c));
    case 'soft_pastel':
      return available.some((c) => ['dusty_rose', 'lavender', 'pink', 'sage', 'cream'].includes(c));
    case 'analogous':
      return ANALOGOUS_GROUPS.some((g) => g.filter((c) => available.includes(c)).length >= 2);
    case 'complementary':
      return COMPLEMENTARY_PAIRS.some(([a, b]) => available.includes(a) && available.includes(b));
    default:
      return neutrals.length + strong.length >= 1;
  }
}

function buildPaletteForMode(
  mode: PaletteMode,
  available: ColorFamilyId[],
  seed: number,
  allowBold: boolean,
): PlannedPalette {
  const neutrals = available.filter((c) => NEUTRAL_FAMILIES.has(c));
  const strong = available.filter((c) => STRONG_FAMILIES.has(c) && !NEUTRAL_FAMILIES.has(c));
  const dominant = available[seed % available.length] ?? 'cream';

  switch (mode) {
    case 'monochrome': {
      const anchor = [dominant];
      return { mode, anchor, neutrals: anchor, accent: null, allowBoldAccent: allowBold };
    }
    case 'tonal': {
      const group = ANALOGOUS_GROUPS.find((g) => g.includes(dominant)) ?? [dominant, ...neutrals.slice(0, 2)];
      const anchor = group.filter((c) => available.includes(c)).slice(0, 3);
      const resolvedAnchor = anchor.length > 0 ? anchor : [dominant];
      return { mode, anchor: resolvedAnchor, neutrals: resolvedAnchor, accent: null, allowBoldAccent: allowBold };
    }
    case 'neutral_accent': {
      const neutral = neutrals[0] ?? dominant;
      const accent = allowBold
        ? strong[seed % Math.max(1, strong.length)] ?? null
        : strong.find((c) => !['orange', 'yellow', 'red', 'purple'].includes(c)) ?? strong[0] ?? null;
      return {
        mode,
        anchor: [neutral, ...(accent ? [accent] : [])],
        neutrals: [neutral],
        accent,
        allowBoldAccent: allowBold,
      };
    }
    case 'analogous': {
      const group =
        ANALOGOUS_GROUPS.find((g) => g.filter((c) => available.includes(c)).length >= 2) ??
        [dominant, neutrals[0] ?? 'cream'].filter(Boolean) as ColorFamilyId[];
      const anchor = group.filter((c) => available.includes(c)).slice(0, 3);
      return { mode, anchor, neutrals: neutrals.slice(0, 2), accent: null, allowBoldAccent: allowBold };
    }
    case 'complementary': {
      const pair = COMPLEMENTARY_PAIRS.find(([a, b]) => available.includes(a) && available.includes(b));
      if (pair) {
        return {
          mode,
          anchor: [...pair],
          neutrals: neutrals.slice(0, 2),
          accent: pair[1],
          allowBoldAccent: allowBold,
        };
      }
      return buildPaletteForMode('neutral_accent', available, seed, allowBold);
    }
    case 'summer_light': {
      const summerAnchor = (['white', 'cream', 'beige', 'sky_blue', 'sage'] as ColorFamilyId[]).filter((c) =>
        available.includes(c),
      );
      const summerNeutrals = (['white', 'cream', 'beige'] as ColorFamilyId[]).filter((c) => available.includes(c));
      return {
        mode,
        anchor: summerAnchor.slice(0, 3),
        neutrals: summerNeutrals,
        accent: strong.find((c) => (['pink', 'yellow', 'sky_blue'] as ColorFamilyId[]).includes(c)) ?? null,
        allowBoldAccent: allowBold,
      };
    }
    case 'dark_elegant': {
      const darkAnchor = (['black', 'navy', 'burgundy', 'gray', 'emerald'] as ColorFamilyId[]).filter((c) =>
        available.includes(c),
      );
      const darkNeutrals = (['black', 'navy', 'gray'] as ColorFamilyId[]).filter((c) => available.includes(c));
      return {
        mode,
        anchor: darkAnchor.slice(0, 3),
        neutrals: darkNeutrals,
        accent: strong[0] ?? null,
        allowBoldAccent: allowBold,
      };
    }
    case 'warm_earthy': {
      const warmAnchor = (['camel', 'brown', 'beige', 'orange', 'burgundy'] as ColorFamilyId[]).filter((c) =>
        available.includes(c),
      );
      const warmNeutrals = (['beige', 'camel', 'cream'] as ColorFamilyId[]).filter((c) => available.includes(c));
      return {
        mode,
        anchor: warmAnchor.slice(0, 3),
        neutrals: warmNeutrals,
        accent: strong.find((c) => (['orange', 'burgundy', 'red'] as ColorFamilyId[]).includes(c)) ?? null,
        allowBoldAccent: allowBold,
      };
    }
    case 'cool_classic': {
      const coolAnchor = (['navy', 'gray', 'cream', 'white', 'black'] as ColorFamilyId[]).filter((c) =>
        available.includes(c),
      );
      const coolNeutrals = (['navy', 'gray', 'cream', 'white', 'black'] as ColorFamilyId[]).filter((c) =>
        available.includes(c),
      );
      return {
        mode,
        anchor: coolAnchor.slice(0, 3),
        neutrals: coolNeutrals,
        accent: strong.find((c) => !(['orange', 'yellow'] as ColorFamilyId[]).includes(c)) ?? null,
        allowBoldAccent: allowBold,
      };
    }
    case 'soft_pastel': {
      const pastelAnchor = (['dusty_rose', 'lavender', 'pink', 'sage', 'cream'] as ColorFamilyId[]).filter((c) =>
        available.includes(c),
      );
      const pastelNeutrals = (['cream', 'beige', 'white'] as ColorFamilyId[]).filter((c) => available.includes(c));
      return {
        mode,
        anchor: pastelAnchor.slice(0, 3),
        neutrals: pastelNeutrals,
        accent: strong[0] ?? null,
        allowBoldAccent: allowBold,
      };
    }
    default:
      return buildPaletteForMode('neutral_accent', available, seed, allowBold);
  }
}

export function planOutfitPalette(params: {
  wardrobe: WardrobeItem[];
  corePool: WardrobeItem[];
  concept: OutfitConcept;
  seed: number;
}): PlannedPalette {
  const available = collectWardrobeColorFamilies(
    params.corePool.length > 0 ? params.corePool : params.wardrobe,
  );
  if (available.length === 0) {
    return {
      mode: 'neutral_accent',
      anchor: ['cream', 'navy'],
      neutrals: ['cream'],
      accent: null,
      allowBoldAccent: params.concept.allowBoldAccent,
    };
  }
  const mode = pickModeFromConcept(params.concept, available, params.seed);
  const palette = buildPaletteForMode(mode, available, params.seed, params.concept.allowBoldAccent);
  if (palette.anchor.length === 0) {
    palette.anchor = [available[0]];
  }
  return palette;
}

function colorsInSameGroup(a: ColorFamilyId, b: ColorFamilyId): boolean {
  if (a === b) return true;
  if (NEUTRAL_FAMILIES.has(a) && NEUTRAL_FAMILIES.has(b)) return true;
  return ANALOGOUS_GROUPS.some((g) => g.includes(a) && g.includes(b));
}

function isComplementary(a: ColorFamilyId, b: ColorFamilyId): boolean {
  return COMPLEMENTARY_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export function scoreItemPaletteFit(item: WardrobeItem, palette: PlannedPalette): number {
  const color = getItemColorFamily(item);
  let score = 0;

  if (palette.anchor.includes(color)) score += 12;
  if (palette.neutrals.includes(color)) score += 10;
  if (palette.accent === color) score += 11;

  for (const anchor of palette.anchor) {
    if (colorsInSameGroup(color, anchor)) score += 6;
    if (palette.mode === 'complementary' && isComplementary(color, anchor)) score += 7;
  }

  if (!palette.allowBoldAccent && STRONG_FAMILIES.has(color) && !palette.accent) {
    if (!['burgundy', 'emerald', 'dusty_rose'].includes(color)) score -= 8;
  }

  if (NEUTRAL_FAMILIES.has(color) && palette.neutrals.length > 0) score += 4;

  if (color === 'multicolor') score -= 4;

  return score;
}

export function countStrongColors(items: WardrobeItem[]): number {
  const unique = new Set(items.map(getItemColorFamily));
  return [...unique].filter((c) => STRONG_FAMILIES.has(c) && !NEUTRAL_FAMILIES.has(c)).length;
}

export function paletteRejectionReason(
  items: WardrobeItem[],
  palette: PlannedPalette,
): string | null {
  const strong = countStrongColors(items);
  const maxStrong = palette.allowBoldAccent ? 2 : 1;
  if (strong > maxStrong) return 'too_many_strong_colors';
  if (strong >= 3) return 'three_plus_unrelated_strong';
  const families = new Set(items.map(getItemColorFamily));
  if (families.size >= 5 && palette.mode !== 'analogous') return 'too_many_color_families';
  return null;
}

export function formatPaletteColors(palette: PlannedPalette): string {
  return [...new Set([...palette.anchor, ...palette.neutrals, ...(palette.accent ? [palette.accent] : [])])].join(
    '+',
  );
}
