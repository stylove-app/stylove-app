import type { ColorFamilyId } from '@/lib/color-harmony-intelligence';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import type { WeatherSnapshot } from '@/lib/weather';

/** Hue angle on the color wheel (0–360). Null = neutral (pairs with anything). */
const COLOR_HUE: Partial<Record<ColorFamilyId, number>> = {
  red: 0,
  burgundy: 350,
  dusty_rose: 345,
  pink: 340,
  orange: 30,
  gold: 45,
  yellow: 55,
  camel: 38,
  brown: 28,
  olive: 75,
  sage: 120,
  emerald: 150,
  sky_blue: 205,
  denim_blue: 215,
  navy: 225,
  lavender: 275,
  purple: 285,
};

export const NEUTRAL_COLOR_FAMILIES = new Set<ColorFamilyId>([
  'black',
  'white',
  'cream',
  'beige',
  'camel',
  'brown',
  'gray',
  'navy',
  'denim_blue',
  'silver',
]);

export const STRONG_COLOR_FAMILIES = new Set<ColorFamilyId>([
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
  'olive',
  'sage',
]);

export const NEON_COLOR_FAMILIES = new Set<ColorFamilyId>([
  'pink',
  'yellow',
  'orange',
  'red',
  'purple',
]);

export type WardrobePaletteMode =
  | 'monochrome'
  | 'tonal'
  | 'analogous'
  | 'complementary'
  | 'split_complementary'
  | 'triadic'
  | 'neutral_plus_accent';

export type WardrobeDrivenPalette = {
  mode: WardrobePaletteMode;
  primary: ColorFamilyId[];
  neutrals: ColorFamilyId[];
  accent: ColorFamilyId | null;
  allowBoldAccent: boolean;
};

export function isNeutralColorFamily(color: ColorFamilyId): boolean {
  return NEUTRAL_COLOR_FAMILIES.has(color);
}

export function isStrongColorFamily(color: ColorFamilyId): boolean {
  return STRONG_COLOR_FAMILIES.has(color) && !NEUTRAL_COLOR_FAMILIES.has(color);
}

function hueOf(color: ColorFamilyId): number | null {
  return COLOR_HUE[color] ?? (NEUTRAL_COLOR_FAMILIES.has(color) ? null : null);
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function chromaticColors(available: ColorFamilyId[]): ColorFamilyId[] {
  return available.filter((c) => hueOf(c) != null);
}

function neutralsIn(available: ColorFamilyId[]): ColorFamilyId[] {
  return available.filter((c) => isNeutralColorFamily(c));
}

function pickBySeed<T>(arr: T[], seed: number): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[seed % arr.length];
}

function findAnalogousCluster(available: ColorFamilyId[], seed: number): ColorFamilyId[] {
  const chromatic = chromaticColors(available);
  if (chromatic.length === 0) return available.slice(0, 2);

  const anchor = pickBySeed(chromatic, seed)!;
  const anchorHue = hueOf(anchor)!;

  const cluster = chromatic.filter((c) => {
    const h = hueOf(c);
    return h != null && hueDistance(anchorHue, h) <= 40;
  });

  const neutrals = neutralsIn(available).slice(0, 1);
  return [...new Set([...cluster, ...neutrals])].slice(0, 3);
}

function findComplementaryPair(available: ColorFamilyId[], seed: number): ColorFamilyId[] | null {
  const chromatic = chromaticColors(available);
  for (let i = 0; i < chromatic.length; i++) {
    const a = chromatic[(seed + i) % chromatic.length];
    const ha = hueOf(a);
    if (ha == null) continue;
    for (const b of chromatic) {
      if (a === b) continue;
      const hb = hueOf(b);
      if (hb == null) continue;
      const dist = hueDistance(ha, hb);
      if (dist >= 150 && dist <= 210) {
        const neutrals = neutralsIn(available).slice(0, 1);
        return [a, b, ...neutrals];
      }
    }
  }
  return null;
}

function findSplitComplementary(available: ColorFamilyId[], seed: number): ColorFamilyId[] | null {
  const chromatic = chromaticColors(available);
  const anchor = pickBySeed(chromatic, seed);
  if (!anchor) return null;
  const ha = hueOf(anchor);
  if (ha == null) return null;

  const targets = [(ha + 150) % 360, (ha + 210) % 360];
  const matches = chromatic.filter((c) => {
    if (c === anchor) return false;
    const h = hueOf(c);
    if (h == null) return false;
    return targets.some((t) => hueDistance(h, t) <= 25);
  });

  if (matches.length >= 1) {
    return [anchor, matches[0], ...neutralsIn(available).slice(0, 1)].slice(0, 3);
  }
  return null;
}

function findTriadic(available: ColorFamilyId[], seed: number): ColorFamilyId[] | null {
  const chromatic = chromaticColors(available);
  const anchor = pickBySeed(chromatic, seed);
  if (!anchor) return null;
  const ha = hueOf(anchor);
  if (ha == null) return null;

  const legB = chromatic.find((c) => {
    const h = hueOf(c);
    return c !== anchor && h != null && hueDistance(h, (ha + 120) % 360) <= 25;
  });
  const legC = chromatic.find((c) => {
    const h = hueOf(c);
    return c !== anchor && c !== legB && h != null && hueDistance(h, (ha + 240) % 360) <= 25;
  });

  if (legB && legC) return [anchor, legB, legC];
  if (legB) return [anchor, legB, ...neutralsIn(available).slice(0, 1)];
  return null;
}

export function buildWardrobePalette(
  mode: WardrobePaletteMode,
  available: ColorFamilyId[],
  seed: number,
  allowBoldAccent: boolean,
): WardrobeDrivenPalette {
  const neutrals = neutralsIn(available);
  const chromatic = chromaticColors(available);
  const dominant = available[seed % available.length] ?? available[0];

  switch (mode) {
    case 'monochrome': {
      const base = dominant;
      const tonalNeighbors = available.filter((c) => c === base || (isNeutralColorFamily(c) && c !== 'multicolor'));
      return {
        mode,
        primary: [base],
        neutrals: tonalNeighbors.length > 0 ? tonalNeighbors.slice(0, 2) : [base],
        accent: null,
        allowBoldAccent,
      };
    }
    case 'tonal': {
      const cluster = findAnalogousCluster(available, seed);
      return {
        mode,
        primary: cluster.slice(0, 2),
        neutrals: cluster,
        accent: null,
        allowBoldAccent,
      };
    }
    case 'analogous': {
      const cluster = findAnalogousCluster(available, seed);
      return {
        mode,
        primary: cluster,
        neutrals: neutrals.slice(0, 2),
        accent: null,
        allowBoldAccent,
      };
    }
    case 'complementary': {
      const pair = findComplementaryPair(available, seed);
      if (pair) {
        const accent = pair.find((c) => isStrongColorFamily(c)) ?? pair[1];
        return {
          mode,
          primary: pair.slice(0, 2),
          neutrals: neutrals.slice(0, 2),
          accent: allowBoldAccent ? accent : null,
          allowBoldAccent,
        };
      }
      return buildWardrobePalette('neutral_plus_accent', available, seed, allowBoldAccent);
    }
    case 'split_complementary': {
      const split = findSplitComplementary(available, seed);
      if (split) {
        return {
          mode,
          primary: split.slice(0, 2),
          neutrals: neutrals.slice(0, 2),
          accent: split.find((c) => isStrongColorFamily(c)) ?? null,
          allowBoldAccent,
        };
      }
      return buildWardrobePalette('complementary', available, seed, allowBoldAccent);
    }
    case 'triadic': {
      const triad = findTriadic(available, seed);
      if (triad) {
        return {
          mode,
          primary: triad,
          neutrals: neutrals.slice(0, 1),
          accent: triad.find((c) => isStrongColorFamily(c)) ?? null,
          allowBoldAccent,
        };
      }
      return buildWardrobePalette('analogous', available, seed, allowBoldAccent);
    }
    case 'neutral_plus_accent': {
      const neutral = neutrals[0] ?? dominant;
      const accentCandidates = allowBoldAccent
        ? chromatic
        : chromatic.filter((c) => !NEON_COLOR_FAMILIES.has(c));
      const accent = pickBySeed(accentCandidates.length > 0 ? accentCandidates : chromatic, seed) ?? null;
      return {
        mode,
        primary: accent ? [neutral, accent] : [neutral],
        neutrals: [neutral],
        accent,
        allowBoldAccent,
      };
    }
    default:
      return buildWardrobePalette('neutral_plus_accent', available, seed, allowBoldAccent);
  }
}

const REFINED_OCCASIONS = new Set<SelectedOccasionId>(['wedding', 'dinner', 'date', 'office']);
const RELAXED_OCCASIONS = new Set<SelectedOccasionId>(['daily', 'coffee', 'shopping', 'beach', 'sport_walk']);
const LIGHT_OCCASIONS = new Set<SelectedOccasionId>(['beach', 'vacation']);

export function rankPaletteModesForContext(
  available: ColorFamilyId[],
  occasion?: SelectedOccasionId,
  weather?: WeatherSnapshot,
): WardrobePaletteMode[] {
  const chromatic = chromaticColors(available);
  const hasComplement = findComplementaryPair(available, 0) != null;
  const hasAnalogous = findAnalogousCluster(available, 0).length >= 2;
  const hasTriadic = findTriadic(available, 0) != null;
  const hasSplit = findSplitComplementary(available, 0) != null;

  const modes: WardrobePaletteMode[] = [];

  if (occasion && REFINED_OCCASIONS.has(occasion)) {
    modes.push('monochrome', 'tonal', 'neutral_plus_accent', 'complementary');
  } else if (occasion && LIGHT_OCCASIONS.has(occasion)) {
    modes.push('analogous', 'neutral_plus_accent', 'tonal', 'triadic');
  } else if (occasion && RELAXED_OCCASIONS.has(occasion)) {
    modes.push('analogous', 'triadic', 'split_complementary', 'neutral_plus_accent', 'tonal');
  } else {
    modes.push('neutral_plus_accent', 'tonal', 'analogous', 'monochrome');
  }

  if (hasComplement && !modes.includes('complementary')) modes.push('complementary');
  if (hasAnalogous && !modes.includes('analogous')) modes.push('analogous');
  if (hasTriadic && !modes.includes('triadic')) modes.push('triadic');
  if (hasSplit && !modes.includes('split_complementary')) modes.push('split_complementary');

  if (weather && weather.temperature >= 26) {
    modes.sort((a, b) => {
      const lightFirst = (m: WardrobePaletteMode) =>
        ['analogous', 'neutral_plus_accent', 'tonal'].includes(m) ? -1 : 0;
      return lightFirst(a) - lightFirst(b);
    });
  }

  return [...new Set(modes)];
}

export function scoreColorAgainstPalette(color: ColorFamilyId, palette: WardrobeDrivenPalette): number {
  let score = 0;

  if (palette.primary.includes(color)) score += 14;
  if (palette.neutrals.includes(color)) score += 11;
  if (palette.accent === color) score += 12;

  const colorHue = hueOf(color);
  for (const primary of palette.primary) {
    if (color === primary) continue;
    const primaryHue = hueOf(primary);
    if (colorHue == null || primaryHue == null) {
      if (isNeutralColorFamily(color) || isNeutralColorFamily(primary)) score += 5;
      continue;
    }
    const dist = hueDistance(colorHue, primaryHue);
    if (dist <= 40) score += 8;
    else if (palette.mode === 'complementary' && dist >= 150 && dist <= 210) score += 9;
    else if (palette.mode === 'triadic' && (dist >= 110 && dist <= 130 || dist >= 230 && dist <= 250)) score += 7;
    else if (dist > 90 && dist < 150) score += 2;
    else if (dist > 60) score -= 4;
  }

  if (isNeutralColorFamily(color) && palette.neutrals.length > 0) score += 4;
  if (color === 'multicolor') score -= 6;
  if (!palette.allowBoldAccent && NEON_COLOR_FAMILIES.has(color) && palette.accent !== color) score -= 10;

  return score;
}

export function countPalettePrimaries(items: ColorFamilyId[]): { primaries: number; accents: number } {
  const unique = [...new Set(items)];
  const primaries = unique.filter((c) => isStrongColorFamily(c)).length;
  const accents = unique.filter((c) => NEON_COLOR_FAMILIES.has(c)).length;
  return { primaries, accents };
}

export function detectWardrobeHarmonyMode(colors: ColorFamilyId[]): WardrobePaletteMode | 'mixed' {
  const unique = [...new Set(colors)];
  if (unique.length <= 1) return 'monochrome';

  const chromatic = unique.filter((c) => hueOf(c) != null);
  const neutralCount = unique.filter((c) => isNeutralColorFamily(c)).length;
  const accentCount = unique.filter((c) => isStrongColorFamily(c)).length;

  if (accentCount <= 1 && neutralCount >= 1) return 'neutral_plus_accent';

  if (chromatic.length >= 2) {
    const hues = chromatic.map((c) => hueOf(c)!);
    const distances: number[] = [];
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        distances.push(hueDistance(hues[i], hues[j]));
      }
    }
    if (distances.length > 0) {
      const maxDist = Math.max(...distances);
      const minDist = Math.min(...distances);
      if (maxDist <= 40) return 'analogous';
      if (minDist >= 150 && minDist <= 210) return 'complementary';
      if (chromatic.length >= 3 && maxDist >= 100 && maxDist <= 140) return 'triadic';
    }
  }

  if (unique.every((c) => isNeutralColorFamily(c))) return 'tonal';
  return 'mixed';
}

export function paletteDisciplineViolation(
  itemColors: ColorFamilyId[],
  palette: WardrobeDrivenPalette,
): string | null {
  const unique = [...new Set(itemColors)];
  const strong = unique.filter((c) => isStrongColorFamily(c));
  const neon = unique.filter((c) => NEON_COLOR_FAMILIES.has(c));

  const maxStrong = palette.allowBoldAccent ? 2 : 1;
  if (strong.length > maxStrong) return 'too_many_primary_colors';
  if (strong.length >= 3) return 'three_plus_unrelated_strong';
  if (neon.length >= 2 && !palette.allowBoldAccent) return 'neon_overload';
  if (unique.length >= 5 && palette.mode !== 'triadic') return 'too_many_color_families';

  const allowed = new Set([
    ...palette.primary,
    ...palette.neutrals,
    ...(palette.accent ? [palette.accent] : []),
  ]);
  const offPaletteStrong = strong.filter((c) => !allowed.has(c));
  if (offPaletteStrong.length >= 2) return 'off_palette_noise';

  return null;
}
