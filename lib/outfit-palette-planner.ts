import type { ColorFamilyId } from '@/lib/color-harmony-intelligence';
import type { OutfitConcept } from '@/lib/outfit-concept-planner';
import type { WardrobeItem } from '@/lib/outfit-engine';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import {
  buildWardrobePalette,
  isNeutralColorFamily,
  isStrongColorFamily,
  paletteDisciplineViolation,
  rankPaletteModesForContext,
  scoreColorAgainstPalette,
  type WardrobePaletteMode,
} from '@/lib/wardrobe-color-theory';
import { getEffectiveStyleProfile, type WardrobeColorId } from '@/lib/wardrobe-style-profile';
import type { WeatherSnapshot } from '@/lib/weather';

export type PaletteMode =
  | WardrobePaletteMode
  | 'neutral_accent'
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

const LEGACY_MODE_MAP: Record<string, WardrobePaletteMode> = {
  neutral_accent: 'neutral_plus_accent',
  soft_pastel: 'tonal',
  dark_elegant: 'monochrome',
  summer_light: 'analogous',
  warm_earthy: 'analogous',
  cool_classic: 'tonal',
};

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

function resolvePaletteMode(mode: PaletteMode): WardrobePaletteMode {
  return LEGACY_MODE_MAP[mode] ?? (mode as WardrobePaletteMode);
}

function modeFitsWardrobe(mode: WardrobePaletteMode, available: ColorFamilyId[]): boolean {
  if (available.length === 0) return false;
  const neutrals = available.filter((c) => isNeutralColorFamily(c));
  const chromatic = available.filter((c) => !isNeutralColorFamily(c) && c !== 'multicolor');

  switch (mode) {
    case 'monochrome':
    case 'tonal':
      return available.length >= 1;
    case 'neutral_plus_accent':
      return neutrals.length >= 1 || chromatic.length >= 1;
    case 'analogous':
    case 'complementary':
    case 'split_complementary':
    case 'triadic':
      return available.length >= 2;
    default:
      return available.length >= 1;
  }
}

function pickModeFromConcept(
  concept: OutfitConcept,
  available: ColorFamilyId[],
  seed: number,
  occasion?: SelectedOccasionId,
  weather?: WeatherSnapshot,
): WardrobePaletteMode {
  const contextModes = rankPaletteModesForContext(available, occasion, weather);

  for (const preferred of concept.paletteModes) {
    const resolved = resolvePaletteMode(preferred);
    if (modeFitsWardrobe(resolved, available)) return resolved;
  }

  for (const mode of contextModes) {
    if (modeFitsWardrobe(mode, available)) return mode;
  }

  const fallback = concept.paletteModes.map(resolvePaletteMode);
  return fallback[seed % Math.max(1, fallback.length)] ?? contextModes[0] ?? 'neutral_plus_accent';
}

function toPlannedPalette(
  built: ReturnType<typeof buildWardrobePalette>,
  displayMode: PaletteMode,
): PlannedPalette {
  return {
    mode: displayMode,
    anchor: built.primary,
    neutrals: built.neutrals,
    accent: built.accent,
    allowBoldAccent: built.allowBoldAccent,
  };
}

export function planOutfitPalette(params: {
  wardrobe: WardrobeItem[];
  corePool: WardrobeItem[];
  concept: OutfitConcept;
  seed: number;
  occasion?: SelectedOccasionId;
  weather?: WeatherSnapshot;
}): PlannedPalette {
  const sourceItems = params.corePool.length > 0 ? params.corePool : params.wardrobe;
  const available = collectWardrobeColorFamilies(sourceItems);

  if (available.length === 0) {
    const wardrobeFallback = collectWardrobeColorFamilies(params.wardrobe);
    const fallbackColor = wardrobeFallback[0] ?? 'cream';
    return {
      mode: 'neutral_plus_accent',
      anchor: [fallbackColor],
      neutrals: [fallbackColor],
      accent: null,
      allowBoldAccent: params.concept.allowBoldAccent,
    };
  }

  const wardrobeMode = pickModeFromConcept(
    params.concept,
    available,
    params.seed,
    params.occasion,
    params.weather,
  );

  const conceptPreferred = params.concept.paletteModes
    .map(resolvePaletteMode)
    .find((m) => m === wardrobeMode);
  const displayMode: PaletteMode =
    params.concept.paletteModes.find((m) => resolvePaletteMode(m) === wardrobeMode) ??
    conceptPreferred ??
    wardrobeMode;

  const built = buildWardrobePalette(
    wardrobeMode,
    available,
    params.seed,
    params.concept.allowBoldAccent,
  );

  const palette = toPlannedPalette(built, displayMode);
  if (palette.anchor.length === 0) {
    palette.anchor = [available[0]];
  }
  return palette;
}

export function scoreItemPaletteFit(item: WardrobeItem, palette: PlannedPalette): number {
  const color = getItemColorFamily(item);
  const wardrobePalette = {
    mode: resolvePaletteMode(palette.mode),
    primary: palette.anchor,
    neutrals: palette.neutrals,
    accent: palette.accent,
    allowBoldAccent: palette.allowBoldAccent,
  };
  return scoreColorAgainstPalette(color, wardrobePalette);
}

export function countStrongColors(items: WardrobeItem[]): number {
  const unique = new Set(items.map(getItemColorFamily));
  return [...unique].filter((c) => isStrongColorFamily(c)).length;
}

export function paletteRejectionReason(
  items: WardrobeItem[],
  palette: PlannedPalette,
): string | null {
  const itemColors = items.map(getItemColorFamily);
  const wardrobePalette = {
    mode: resolvePaletteMode(palette.mode),
    primary: palette.anchor,
    neutrals: palette.neutrals,
    accent: palette.accent,
    allowBoldAccent: palette.allowBoldAccent,
  };
  return paletteDisciplineViolation(itemColors, wardrobePalette);
}

export function formatPaletteColors(palette: PlannedPalette): string {
  return [...new Set([...palette.anchor, ...palette.neutrals, ...(palette.accent ? [palette.accent] : [])])].join(
    '+',
  );
}
