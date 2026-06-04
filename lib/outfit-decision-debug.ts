import type { OutfitPiece, WardrobeItem } from '@/lib/outfit-engine';
import { scoreOutfitHarmonyLayer } from '@/lib/color-harmony-intelligence';
import type { ItemStylingProfile, StylingWardrobeItem } from '@/lib/outfit-styling-intelligence';
import {
  analyzeWardrobeItem,
  scorePieceCandidate,
  scoreOutfitCoherence,
  type OutfitStylingContext,
} from '@/lib/outfit-styling-intelligence';
import { getEffectiveStyleProfile } from '@/lib/wardrobe-style-profile';
import {
  getItemSlot,
  isRealTopItem,
  validateOutfitStructure,
  scoreItemUsageDiversity,
  scoreHotWeatherItem,
  corePieceIdsFromOutfit,
} from '@/lib/outfit-assembly-rules';
import { scoreWomenPieceForOccasion } from '@/lib/women-outfit-scoring';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import type { WeatherSnapshot } from '@/lib/weather';
import { scoreOutfitDiversity, scoreOutfitPiecesWithBible } from '@/lib/styling-bible';
import { isQaTestMode } from '@/lib/qa-test-mode';

export type OutfitDecisionPath = 'local_engine' | 'remote_openai' | 'travel_local';

export type OutfitPieceDiagnostic = {
  id: string;
  name: string;
  rawCategory: string;
  itemType: string;
  styleProfile: WardrobeStyleProfileSummary | null;
  inferredSlot: string;
  assignedRole: string;
  isRealTop: boolean;
  pieceScore?: number;
  occasionPieceScore?: number;
  weatherPieceScore?: number;
  diversityPieceScore?: number;
};

type WardrobeStyleProfileSummary = {
  slot: string;
  category: string;
  color: string;
  formality: string;
  season: string;
};

export type OutfitDecisionReport = {
  path: OutfitDecisionPath;
  occasion?: SelectedOccasionId;
  weatherTemp?: number;
  validation: { valid: boolean; reason?: string };
  itemIds: string[];
  pieces: OutfitPieceDiagnostic[];
  scores: {
    harmonyTotal: number;
    harmonyBreakdown: Record<string, number>;
    bibleTotal: number;
    coherence: number;
    diversity: number;
    accessoryCount: number;
  };
  notes: string[];
};

export function isOutfitDecisionDebugEnabled(): boolean {
  return __DEV__ || isQaTestMode();
}

function summarizeProfile(item: WardrobeItem): WardrobeStyleProfileSummary | null {
  if (!item.styleProfile) return null;
  const p = item.styleProfile;
  return {
    slot: p.slot,
    category: p.category,
    color: p.color,
    formality: p.formality,
    season: p.season,
  };
}

export function diagnoseWardrobeItem(item: WardrobeItem, role?: string): OutfitPieceDiagnostic {
  const profile = getEffectiveStyleProfile(item);
  return {
    id: item.id,
    name: item.name,
    rawCategory: item.category,
    itemType: item.itemType,
    styleProfile: summarizeProfile(item),
    inferredSlot: profile.slot,
    assignedRole: role ?? profile.slot,
    isRealTop: isRealTopItem(item),
  };
}

export function buildOutfitDecisionReport(params: {
  path: OutfitDecisionPath;
  pieces: OutfitPiece[];
  occasion?: SelectedOccasionId;
  weather?: WeatherSnapshot;
  stylingContext?: Pick<
    OutfitStylingContext,
    'mood' | 'intent' | 'resolvedIntent' | 'recentItemIds' | 'recentOutfitSets' | 'selectedOccasion'
  >;
  recentOutfitSets?: string[][];
  recentCoreSets?: string[][];
  seenSignatures?: Set<string>;
  stylingWardrobe?: StylingWardrobeItem[];
  extraNotes?: string[];
}): OutfitDecisionReport {
  const items = params.pieces.map((p) => p.item);
  const validation = validateOutfitStructure(params.pieces, params.occasion);
  const harmony = scoreOutfitHarmonyLayer({
    items,
    selectedOccasion: params.occasion,
    weather: params.weather,
  });

  const profiles = params.pieces.map((p) => analyzeWardrobeItem(p.item));
  const bibleContext = {
    mood: params.stylingContext?.mood ?? 'elegant',
    intent: params.stylingContext?.intent ?? '',
    resolvedIntent: params.stylingContext?.resolvedIntent,
    weather: params.weather,
  };
  const bibleTotal = params.stylingWardrobe
    ? scoreOutfitPiecesWithBible(params.pieces, bibleContext, params.stylingWardrobe, {
        recentOutfitSets: params.recentOutfitSets,
        recentCoreSets: params.recentCoreSets,
        seenSignatures: params.seenSignatures,
      })
    : 0;
  const coherence = scoreOutfitCoherence(profiles, bibleContext);
  const itemIds = items.map((i) => i.id);
  const diversity = scoreOutfitDiversity(
    itemIds,
    params.recentOutfitSets ?? [],
    params.seenSignatures ?? new Set(),
    params.recentCoreSets,
  );
  const accessoryCount = params.pieces.filter(
    (p) => p.role === 'accessory' || p.role === 'jewelry',
  ).length;

  const pieceDiagnostics = params.pieces.map((piece) => {
    const base = diagnoseWardrobeItem(piece.item, piece.role);
    const profile = analyzeWardrobeItem(piece.item);
    let occasionPieceScore: number | undefined;
    if (params.occasion) {
      occasionPieceScore = scoreWomenPieceForOccasion(piece.item, profile, params.occasion);
    }
    const recentIds = params.stylingContext?.recentItemIds ?? new Set<string>();
    const diversityPieceScore = params.stylingContext?.recentOutfitSets
      ? scoreItemUsageDiversity(piece.item, params.stylingContext.recentOutfitSets, recentIds)
      : undefined;
    const weatherPieceScore = scoreHotWeatherItem(
      piece.item,
      params.weather,
      params.occasion ?? params.stylingContext?.selectedOccasion,
    );
    return {
      ...base,
      occasionPieceScore,
      weatherPieceScore,
      diversityPieceScore,
    };
  });

  const notes = [
    ...(params.extraNotes ?? []),
    `corePieceIds=${corePieceIdsFromOutfit(params.pieces).join(',') || 'none'}`,
    `harmonyMode=${harmony.harmonyMode}`,
    `matchedPalette=${harmony.matchedPalette ?? 'none'}`,
  ];

  return {
    path: params.path,
    occasion: params.occasion,
    weatherTemp: params.weather?.temperature,
    validation,
    itemIds,
    pieces: pieceDiagnostics,
    scores: {
      harmonyTotal: harmony.total,
      harmonyBreakdown: {
        occasionFit: harmony.occasionFit,
        colorHarmony: harmony.colorHarmony,
        occasionColorFit: harmony.occasionColorFit,
        materialHarmony: harmony.materialHarmony,
        silhouetteBalance: harmony.silhouetteBalance,
        accessoryBalance: harmony.accessoryBalance,
        weatherFit: harmony.weatherFit,
        styleProfileFit: harmony.styleProfileFit,
        shoeNoteScore: harmony.shoeNoteScore,
      },
      bibleTotal,
      coherence,
      diversity,
      accessoryCount,
    },
    notes,
  };
}

/** Readable multi-line report for Metro / Xcode console. */
export function formatOutfitDecisionReport(report: OutfitDecisionReport): string {
  const lines: string[] = [
    '──────── Stylove Outfit Decision Report ────────',
    `path: ${report.path}`,
    `occasion: ${report.occasion ?? 'none'}`,
    `weatherTemp: ${report.weatherTemp ?? 'n/a'}°C`,
    `validation: ${report.validation.valid ? 'PASS' : `FAIL (${report.validation.reason})`}`,
    `itemIds: ${report.itemIds.join(', ') || 'none'}`,
    'scores:',
    `  harmony.total: ${report.scores.harmonyTotal.toFixed(2)}`,
    `  harmony.color: ${report.scores.harmonyBreakdown.colorHarmony}`,
    `  harmony.weather: ${report.scores.harmonyBreakdown.weatherFit}`,
    `  harmony.accessoryBalance: ${report.scores.harmonyBreakdown.accessoryBalance}`,
    `  bible.total: ${report.scores.bibleTotal.toFixed(2)}`,
    `  coherence: ${report.scores.coherence.toFixed(2)}`,
    `  diversity: ${report.scores.diversity}`,
    `  accessoryCount: ${report.scores.accessoryCount}`,
    'pieces:',
  ];

  for (const piece of report.pieces) {
    lines.push(
      `  - [${piece.assignedRole}] ${piece.name}`,
      `      id=${piece.id} rawCategory=${piece.rawCategory} itemType=${piece.itemType}`,
      `      inferredSlot=${piece.inferredSlot} isRealTop=${piece.isRealTop}`,
      `      styleProfile=${piece.styleProfile ? JSON.stringify(piece.styleProfile) : 'MISSING (legacy fallback)'}`,
      `      occasion=${piece.occasionPieceScore ?? 'n/a'} weather=${piece.weatherPieceScore ?? 'n/a'} diversity=${piece.diversityPieceScore ?? 'n/a'}`,
    );
  }

  if (report.notes.length > 0) {
    lines.push('notes:');
    for (const note of report.notes) {
      lines.push(`  - ${note}`);
    }
  }

  lines.push('────────────────────────────────────────────────');
  return lines.join('\n');
}

export function logOutfitDecisionReport(report: OutfitDecisionReport): void {
  if (!isOutfitDecisionDebugEnabled()) return;
  console.log(formatOutfitDecisionReport(report));
}

export function formatFinalItemTokens(pieces: OutfitPiece[]): string {
  if (pieces.length === 0) return 'none';
  return pieces
    .map((piece) => {
      const slot = getItemSlot(piece.item);
      return `${piece.role}:${piece.item.name}:${slot}:${piece.item.category}:${piece.item.itemType}`;
    })
    .join(', ');
}

export type SecureOutfitFinalPath =
  | 'local_validated_openai_copy_only'
  | 'local_validated';

/** Diagnostic for Home create / replace (dev + preview only). */
export function logSecureOutfitFinalDiagnostic(params: {
  path: SecureOutfitFinalPath;
  occasion?: SelectedOccasionId;
  temp?: number;
  remoteOk: boolean;
  localValidation: 'PASS' | 'FAIL';
  finalPieces: OutfitPiece[];
}): void {
  if (!isOutfitDecisionDebugEnabled()) return;

  console.log(
    [
      '[Stylove Outfit FINAL]',
      `path=${params.path}`,
      `occasion=${params.occasion ?? 'none'}`,
      `temp=${params.temp ?? 'n/a'}`,
      `remoteOk=${params.remoteOk}`,
      `localValidation=${params.localValidation}`,
      `remoteValidation=N/A`,
      `finalItems=${formatFinalItemTokens(params.finalPieces)}`,
    ].join('\n'),
  );
}

export function logOutfitCandidateRejection(params: {
  attempt: number;
  reason: string;
  pieceCount: number;
}): void {
  if (!isOutfitDecisionDebugEnabled()) return;
  console.log(
    `[Stylove Outfit] candidate #${params.attempt} rejected: ${params.reason} (pieces=${params.pieceCount})`,
  );
}

export function logPiecePickRationale(params: {
  slot: string;
  chosen?: WardrobeItem;
  topCandidates: { item: WardrobeItem; score: number }[];
}): void {
  if (!isOutfitDecisionDebugEnabled()) return;
  const chosenName = params.chosen?.name ?? 'none';
  const ranked = params.topCandidates
    .slice(0, 4)
    .map((c) => `${c.item.name}(${c.score.toFixed(2)})`)
    .join(', ');
  console.log(`[Stylove Pick] ${params.slot} → ${chosenName} | top: ${ranked}`);
}

export function rankCandidatesWithScores(
  items: WardrobeItem[],
  context: OutfitStylingContext,
): { item: WardrobeItem; score: number }[] {
  return items
    .map((item) => ({
      item,
      score: scorePieceCandidate(analyzeWardrobeItem(item), context),
    }))
    .sort((a, b) => b.score - a.score);
}
