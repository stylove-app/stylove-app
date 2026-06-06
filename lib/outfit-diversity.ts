import { isQaTestMode } from '@/lib/qa-test-mode';
import type { OutfitPiece } from '@/lib/outfit-engine';
import type { StylingWardrobeItem } from '@/lib/outfit-styling-intelligence';
import { getEffectiveStyleProfile } from '@/lib/wardrobe-style-profile';

export const RECENT_LOOKS_WINDOW = 5;
export const RECENT_ITEM_WINDOW = 5;

export type DiversityLogSource = 'home' | 'replace' | 'looks' | 'engine';

export type StyloveDiversityLog = {
  source: DiversityLogSource;
  occasion?: string;
  regenerate: boolean;
  previousItemIds: string[];
  newItemIds: string[];
  repeatedItemIds: string[];
  changedCorePercent: number;
  conceptChanged: boolean;
  paletteChanged: boolean;
  diversityPenaltyApplied: number;
  previousConceptId?: string;
  newConceptId?: string;
  previousPaletteMode?: string;
  newPaletteMode?: string;
};

function scalePenaltyForPoolSize(penalty: number, poolSize?: number): number {
  if (!poolSize || poolSize <= 1) return penalty * 0.3;
  if (poolSize === 2) return penalty * 0.55;
  if (poolSize === 3) return penalty * 0.75;
  return penalty;
}

export function countItemUsesInRecentLooks(
  itemId: string,
  recentOutfitSets: string[][],
  window = RECENT_LOOKS_WINDOW,
): number {
  return recentOutfitSets.slice(-window).filter((set) => set.includes(itemId)).length;
}

export function stylingComboSignature(pieces: OutfitPiece[]): string {
  const top = pieces.find((p) => p.role === 'top')?.item.id ?? '-';
  const bottom = pieces.find((p) => p.role === 'bottom')?.item.id ?? '-';
  const dress = pieces.find((p) => p.role === 'dress')?.item.id ?? '-';
  const shoes = pieces.find((p) => p.role === 'shoes')?.item.id ?? '-';
  const bag = pieces.find((p) => p.role === 'bag')?.item.id ?? '-';
  return `${top}|${bottom}|${dress}|${shoes}|${bag}`;
}

export function corePieceIdsFromPieces(pieces: OutfitPiece[]): string[] {
  return pieces
    .filter((p) => p.role === 'top' || p.role === 'bottom' || p.role === 'dress')
    .map((p) => p.item.id);
}

const REGENERATE_CORE_ROLES = new Set<OutfitPiece['role']>([
  'top',
  'bottom',
  'dress',
  'shoes',
  'outerwear',
  'bag',
]);

const DRESS_SUPPORT_ROLES = new Set<OutfitPiece['role']>(['shoes', 'bag', 'outerwear']);

export function regenerateCorePieceIds(pieces: OutfitPiece[]): string[] {
  return pieces.filter((piece) => REGENERATE_CORE_ROLES.has(piece.role)).map((piece) => piece.item.id);
}

export function countChangedCorePieces(previousIds: string[], nextIds: string[]): number {
  const prior = new Set(previousIds);
  return nextIds.filter((id) => !prior.has(id)).length;
}

export function isDressOutfitPieces(pieces: OutfitPiece[]): boolean {
  return pieces.some((piece) => piece.role === 'dress');
}

export function isHomeRegenerateFlow(
  regenerate?: boolean,
  diversitySource?: DiversityLogSource,
): boolean {
  return Boolean(
    regenerate &&
      (diversitySource === 'home' || diversitySource === 'replace' || diversitySource === 'looks'),
  );
}

export function wardrobeHasRegenerateAlternatives(pools: {
  tops: unknown[];
  bottoms: unknown[];
  onePieces: unknown[];
  shoes: unknown[];
  bags: unknown[];
  outerwear: unknown[];
}): boolean {
  return (
    pools.onePieces.length >= 2 ||
    (pools.tops.length >= 2 && pools.bottoms.length >= 2) ||
    pools.shoes.length >= 2 ||
    pools.bags.length >= 2 ||
    pools.outerwear.length >= 2 ||
    (pools.onePieces.length >= 1 && pools.tops.length >= 1 && pools.bottoms.length >= 1)
  );
}

export function evaluateRegenerateCoreTarget(
  previousPieces: OutfitPiece[],
  nextPieces: OutfitPiece[],
  wardrobeHasAlternatives: boolean,
): { meetsTarget: boolean; requiredMin: number; changed: number } {
  const prevCore = regenerateCorePieceIds(previousPieces);
  const nextCore = regenerateCorePieceIds(nextPieces);
  const changed = countChangedCorePieces(prevCore, nextCore);

  if (!wardrobeHasAlternatives) {
    return { meetsTarget: true, requiredMin: 0, changed };
  }

  if (isDressOutfitPieces(previousPieces)) {
    const prevDressId = previousPieces.find((piece) => piece.role === 'dress')?.item.id;
    const nextDressId = nextPieces.find((piece) => piece.role === 'dress')?.item.id;
    if (prevDressId && nextDressId && prevDressId !== nextDressId) {
      return { meetsTarget: true, requiredMin: 1, changed };
    }

    const prevSupport = previousPieces
      .filter((piece) => DRESS_SUPPORT_ROLES.has(piece.role))
      .map((piece) => piece.item.id);
    const nextSupport = nextPieces
      .filter((piece) => DRESS_SUPPORT_ROLES.has(piece.role))
      .map((piece) => piece.item.id);
    const supportChanged = countChangedCorePieces(prevSupport, nextSupport);
    return { meetsTarget: supportChanged >= 2, requiredMin: 2, changed: supportChanged };
  }

  const prevCount = prevCore.length;
  if (prevCount >= 4) {
    return { meetsTarget: changed >= 2, requiredMin: 2, changed };
  }
  if (prevCount === 3) {
    if (changed >= 2) {
      return { meetsTarget: true, requiredMin: 2, changed };
    }
    return { meetsTarget: changed >= 1, requiredMin: 1, changed };
  }

  return { meetsTarget: changed >= 1, requiredMin: 1, changed };
}

export function scoreRegenerateCoreDiversityV2(options: {
  pieces: OutfitPiece[];
  regenerate?: boolean;
  diversitySource?: DiversityLogSource;
  previousOutfitPieces?: OutfitPiece[];
  wardrobeHasAlternatives?: boolean;
}): number {
  if (!isHomeRegenerateFlow(options.regenerate, options.diversitySource)) return 0;

  const previousPieces = options.previousOutfitPieces;
  if (!previousPieces?.length) return 0;

  const prevCore = regenerateCorePieceIds(previousPieces);
  const nextCore = regenerateCorePieceIds(options.pieces);
  const changed = countChangedCorePieces(prevCore, nextCore);
  const target = evaluateRegenerateCoreTarget(
    previousPieces,
    options.pieces,
    options.wardrobeHasAlternatives ?? false,
  );

  let score = 0;
  const prevAllIds = new Set(previousPieces.map((piece) => piece.item.id));
  const nextAllIds = options.pieces.map((piece) => piece.item.id);
  const outfitChanged = nextAllIds.some((id) => !prevAllIds.has(id)) || previousPieces.some(
    (piece) => !nextAllIds.includes(piece.item.id),
  );

  if (outfitChanged && changed === 0) {
    score -= 68;
  }

  if (options.wardrobeHasAlternatives) {
    if (!target.meetsTarget) {
      if (changed === 0) score -= 78;
      else if (changed === 1 && target.requiredMin >= 2) score -= 56;
      else score -= 42;
    } else {
      score += 14;
    }
  } else if (changed === 0 && prevCore.length > 0) {
    score -= 50;
  }

  if (changed >= 2) score += 10;
  if (changed >= 3) score += 5;

  return score;
}

export function computeChangedCorePercent(currentCore: string[], previousCore: string[]): number {
  if (previousCore.length === 0) return 100;
  const priorSet = new Set(previousCore);
  const changed = currentCore.filter((id) => !priorSet.has(id)).length;
  return Math.round((changed / Math.max(previousCore.length, 1)) * 100);
}

export function repeatedItemIds(previous: string[], next: string[]): string[] {
  const prior = new Set(previous);
  return [...new Set(next.filter((id) => prior.has(id)))];
}

export function isWatchItem(item: StylingWardrobeItem): boolean {
  const profile = getEffectiveStyleProfile(item);
  return item.itemType === 'saat' || profile.category === 'watch';
}

export function isSunglassesItem(item: StylingWardrobeItem): boolean {
  const profile = getEffectiveStyleProfile(item);
  return item.itemType === 'gozluk' || profile.category === 'sunglasses';
}

export function isBagItem(item: StylingWardrobeItem): boolean {
  return getEffectiveStyleProfile(item).slot === 'bag';
}

export function isShoeItem(item: StylingWardrobeItem): boolean {
  return getEffectiveStyleProfile(item).slot === 'shoes';
}

export function scoreEnhancedItemUsageDiversity(
  item: StylingWardrobeItem,
  recentOutfitSets: string[][],
  recentItemIds: Set<string>,
  options?: { slotPoolSize?: number },
): number {
  let score = 0;
  const id = item.id;
  const poolScale = options?.slotPoolSize;
  const recentWindow = recentOutfitSets.slice(-RECENT_LOOKS_WINDOW);
  const recentUses = countItemUsesInRecentLooks(id, recentOutfitSets);

  if (recentItemIds.has(id)) {
    score += scalePenaltyForPoolSize(-20, poolScale);
  }
  if (recentUses >= 3) score += scalePenaltyForPoolSize(-22, poolScale);
  else if (recentUses === 2) score += scalePenaltyForPoolSize(-14, poolScale);
  else if (recentUses === 1) score += scalePenaltyForPoolSize(-7, poolScale);

  if (isBagItem(item)) {
    const bagUses = countItemUsesInRecentLooks(id, recentOutfitSets, 4);
    if (bagUses >= 2) score += scalePenaltyForPoolSize(-28, poolScale);
    else if (bagUses === 1) score += scalePenaltyForPoolSize(-16, poolScale);
  }

  if (isShoeItem(item)) {
    const shoeUses = countItemUsesInRecentLooks(id, recentOutfitSets, 4);
    if (shoeUses >= 3) score += scalePenaltyForPoolSize(-20, poolScale);
    else if (shoeUses === 2) score += scalePenaltyForPoolSize(-12, poolScale);
    else if (shoeUses === 1) score += scalePenaltyForPoolSize(-6, poolScale);
  }

  if (isWatchItem(item)) {
    const watchUses = recentWindow.slice(-3).filter((set) => set.includes(id)).length;
    if (watchUses >= 2) score += scalePenaltyForPoolSize(-32, poolScale);
    else if (watchUses === 1) score += scalePenaltyForPoolSize(-22, poolScale);
  }

  if (isSunglassesItem(item)) {
    const sunUses = recentWindow.slice(-4).filter((set) => set.includes(id)).length;
    if (sunUses >= 2) score += scalePenaltyForPoolSize(-26, poolScale);
    else if (sunUses === 1) score += scalePenaltyForPoolSize(-14, poolScale);
  }

  const usesEver = recentOutfitSets.flat().filter((x) => x === id).length;
  if (usesEver === 0) score += 5;

  return score;
}

export function scoreOutfitComboRepeat(
  pieces: OutfitPiece[],
  recentOutfitSets: string[][],
  options?: {
    regenerate?: boolean;
    previousComboSignature?: string;
    previousItemIds?: string[];
    slotPoolSizes?: { bags: number; shoes: number };
  },
): number {
  let score = 0;
  const signature = stylingComboSignature(pieces);
  const itemIds = pieces.map((p) => p.item.id);

  if (options?.regenerate && options.previousComboSignature && signature === options.previousComboSignature) {
    score -= 58;
  }

  const lastSet = recentOutfitSets[recentOutfitSets.length - 1];
  if (lastSet?.length) {
    const lastSig = options?.previousComboSignature;
    if (lastSig && signature === lastSig) score -= 45;
  }

  for (let i = recentOutfitSets.length - 1; i >= Math.max(0, recentOutfitSets.length - 3); i -= 1) {
    const prior = recentOutfitSets[i];
    if (!prior?.length) continue;
    const overlap = itemIds.filter((id) => prior.includes(id)).length;
    if (overlap >= itemIds.length - 1 && itemIds.length >= 3) score -= 18;
  }

  if (options?.regenerate && options.previousItemIds?.length) {
    const repeat = repeatedItemIds(options.previousItemIds, itemIds);
    const bag = pieces.find((p) => p.role === 'bag')?.item.id;
    const shoes = pieces.find((p) => p.role === 'shoes')?.item.id;
    if (bag && repeat.includes(bag)) {
      score += scalePenaltyForPoolSize(-24, options.slotPoolSizes?.bags);
    }
    if (shoes && repeat.includes(shoes)) {
      score += scalePenaltyForPoolSize(-16, options.slotPoolSizes?.shoes);
    }
  }

  return score;
}

export function scoreRegenerateCoreChange(
  coreIds: string[],
  recentCoreSets: string[][],
  regenerate?: boolean,
  wardrobeHasAlternatives?: boolean,
): number {
  if (!regenerate || recentCoreSets.length === 0 || coreIds.length === 0) return 0;

  const lastCore = recentCoreSets[recentCoreSets.length - 1];
  if (!lastCore?.length) return 0;

  const priorSet = new Set(lastCore);
  const shared = coreIds.filter((id) => priorSet.has(id)).length;
  const changeRatio = 1 - shared / Math.max(lastCore.length, coreIds.length, 1);
  const changedPercent = Math.round(changeRatio * 100);

  if (wardrobeHasAlternatives && changeRatio < 0.5) return -48;
  if (changeRatio < 0.5) return -32;
  if (changeRatio < 0.34) return -20;
  if (shared === 0) return 8;
  if (changedPercent >= 50) return 4;
  return 0;
}

export function logStyloveDiversity(log: StyloveDiversityLog): void {
  if (!isQaTestMode() && !__DEV__) return;
  console.log('[Stylove Diversity]', {
    source: log.source,
    occasion: log.occasion ?? 'none',
    regenerate: log.regenerate,
    previousItemIds: log.previousItemIds.join(',') || 'none',
    newItemIds: log.newItemIds.join(',') || 'none',
    repeatedItemIds: log.repeatedItemIds.join(',') || 'none',
    changedCorePercent: log.changedCorePercent,
    conceptChanged: log.conceptChanged,
    paletteChanged: log.paletteChanged,
    diversityPenaltyApplied: log.diversityPenaltyApplied,
    previousConceptId: log.previousConceptId ?? 'none',
    newConceptId: log.newConceptId ?? 'none',
    previousPaletteMode: log.previousPaletteMode ?? 'none',
    newPaletteMode: log.newPaletteMode ?? 'none',
  });
}
