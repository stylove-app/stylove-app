import type { Locale, MoodId } from '@/i18n/types';
import type { StyleMemory } from '@/lib/style-memory';
import type {
  CuratedLook,
  OutfitPiece,
  OutfitPieceRole,
  WardrobeItem,
} from '@/lib/outfit-engine';
import type { WeatherSnapshot } from '@/lib/weather';
import { supabase } from '@/services/supabase';

type RemotePiece = {
  role: OutfitPieceRole;
  itemId: string;
};

type RemoteLook = {
  title?: string;
  vibe?: string;
  commentary?: string;
  missingPiece?: string;
  tags?: string[];
  weatherReason?: string;
  stylingNotes?: string;
  selectedPieces?: RemotePiece[];
};

type GenerateOutfitResponse = {
  ok?: boolean;
  look?: RemoteLook;
};

function compactWardrobe(wardrobe: WardrobeItem[]) {
  return wardrobe.slice(0, 45).map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    itemType: item.itemType,
  }));
}

function compactRecentItemIds(itemIds: string[] | undefined) {
  if (!itemIds) return [];
  return Array.from(new Set(itemIds)).slice(0, 20);
}

function compactMemory(memory: StyleMemory | undefined) {
  if (!memory) return undefined;
  return {
    totalLooksGenerated: memory.totalLooksGenerated,
    totalLooksSaved: memory.totalLooksSaved,
    favoriteTones: memory.favoriteTones?.slice(0, 5),
    moodFrequency: memory.moodFrequency,
    toneFrequency: memory.toneFrequency,
    silhouetteFrequency: memory.silhouetteFrequency,
  };
}

const BEACH_INTENT_PATTERN =
  /\b(sahil|deniz|plaj|beach|coast|coastal|summer|yaz|sıcak|sicak|hot|warm)\b/i;
const EVENING_INTENT_PATTERN = /\b(evening|night|date|dinner|akşam|aksam|gece|randevu|davet|yemek)\b/i;
const LAYERING_PATTERN =
  /\b(layer|layering|outerwear|coat|jacket|trench|winter|cold|katman|dış giyim|dis giyim|kaban|ceket|mont|kış|kis|soğuk|soguk)\b/i;
const EVENING_LANGUAGE_PATTERN =
  /\b(evening|night|nocturnal|date night|gala|refined night|akşam|aksam|gece|gece şıklığı|gece sikligi|davet)\b/i;
const GALA_LANGUAGE_PATTERN =
  /\b(gala|red carpet|couture|black tie|evening edit|night edit|resmi davet|takım elbise|takim elbise)\b/i;
const GENDERED_LANGUAGE_PATTERN =
  /\b(feminine|masculine|feminen|maskülen|maskulen|kadınsı|kadinsi|erkeksi)\b/i;

const TONE_RULES = [
  {
    id: 'black',
    item: /\b(black|siyah|noir)\b/i,
    text: /\b(black|siyah|noir)\b/i,
    tr: 'siyah',
    en: 'black',
  },
  {
    id: 'white',
    item: /\b(white|beyaz)\b/i,
    text: /\b(white|beyaz)\b/i,
    tr: 'beyaz',
    en: 'white',
  },
  {
    id: 'cream',
    item: /\b(cream|ivory|krem|fildişi|fildisi)\b/i,
    text: /\b(cream|ivory|champagne|krem|fildişi|fildisi|şampanya|sampanya)\b/i,
    tr: 'krem',
    en: 'cream',
  },
  {
    id: 'burgundy',
    item: /\b(burgundy|wine|bordo|şarap|sarap)\b/i,
    text: /\b(burgundy|wine|bordo|şarap|sarap)\b/i,
    tr: 'bordo',
    en: 'burgundy',
  },
  {
    id: 'beige',
    item: /\b(beige|taupe|bej|vizon)\b/i,
    text: /\b(beige|taupe|bej|vizon)\b/i,
    tr: 'bej',
    en: 'beige',
  },
  {
    id: 'camel',
    item: /\b(camel|taba|kahve)\b/i,
    text: /\b(camel|taba|kahve)\b/i,
    tr: 'taba',
    en: 'camel',
  },
  {
    id: 'gray',
    item: /\b(gray|grey|gri|antrasit)\b/i,
    text: /\b(gray|grey|gri|antrasit)\b/i,
    tr: 'gri',
    en: 'gray',
  },
  {
    id: 'navy',
    item: /\b(navy|lacivert)\b/i,
    text: /\b(navy|lacivert)\b/i,
    tr: 'lacivert',
    en: 'navy',
  },
  {
    id: 'blue',
    item: /\b(blue|mavi)\b/i,
    text: /\b(blue|mavi)\b/i,
    tr: 'mavi',
    en: 'blue',
  },
  {
    id: 'pink',
    item: /\b(pink|blush|pembe)\b/i,
    text: /\b(pink|blush|pembe)\b/i,
    tr: 'pembe',
    en: 'pink',
  },
] as const;

function selectedItemText(pieces: OutfitPiece[]): string {
  return pieces.map((piece) => `${piece.item.name} ${piece.item.itemType}`).join(' ');
}

function detectedTones(pieces: OutfitPiece[]) {
  const source = selectedItemText(pieces);
  return new Set(TONE_RULES.filter((tone) => tone.item.test(source)).map((tone) => tone.id));
}

function textMentionsAbsentTone(text: string, tones: Set<string>): boolean {
  return TONE_RULES.some((tone) => tone.text.test(text) && !tones.has(tone.id));
}

function isWarmWeather(weather: WeatherSnapshot | undefined): boolean {
  if (!weather) return false;
  const apparent = weather.feelsLike ?? weather.temperature;
  return apparent >= 22 && !weather.isRainy && !weather.needsOuterwear;
}

function isCasualWarmLook(pieces: OutfitPiece[], weather: WeatherSnapshot | undefined, intent: string): boolean {
  const source = selectedItemText(pieces);
  return (
    isWarmWeather(weather) &&
    BEACH_INTENT_PATTERN.test(intent) &&
    /\b(tisort|t-shirt|tişört|short|şort|sort|sneaker|ayakkabi|ayakkabı)\b/i.test(source)
  );
}

function hasContextConflict(text: string, params: {
  tones: Set<string>;
  pieces: OutfitPiece[];
  weather?: WeatherSnapshot;
  intent: string;
}): boolean {
  if (!text.trim()) return true;
  if (textMentionsAbsentTone(text, params.tones)) return true;
  if (isWarmWeather(params.weather) && LAYERING_PATTERN.test(text)) return true;
  if (BEACH_INTENT_PATTERN.test(params.intent) && !EVENING_INTENT_PATTERN.test(params.intent) && EVENING_LANGUAGE_PATTERN.test(text)) {
    return true;
  }
  if (isCasualWarmLook(params.pieces, params.weather, params.intent) && GALA_LANGUAGE_PATTERN.test(text)) return true;
  if (!GENDERED_LANGUAGE_PATTERN.test(params.intent) && GENDERED_LANGUAGE_PATTERN.test(text)) return true;
  return false;
}

function roleItemName(pieces: OutfitPiece[], role: OutfitPieceRole): string | undefined {
  return pieces.find((piece) => piece.role === role)?.item.name;
}

function fallbackTitle(locale: Locale, intent: string, weather: WeatherSnapshot | undefined): string {
  const isTurkish = locale === 'tr';
  if (BEACH_INTENT_PATTERN.test(intent) || isWarmWeather(weather)) {
    return isTurkish ? 'Sıcak Hava İçin Sade Denge' : 'Clean Warm-Weather Balance';
  }
  return isTurkish ? 'Net ve Dengeli Görünüm' : 'Clean Balanced Look';
}

function fallbackVibe(locale: Locale, intent: string, weather: WeatherSnapshot | undefined): string {
  const isTurkish = locale === 'tr';
  if (BEACH_INTENT_PATTERN.test(intent) || isWarmWeather(weather)) {
    return isTurkish ? 'Rahat yaz temposu' : 'Relaxed summer pace';
  }
  return isTurkish ? 'Modern sade çizgi' : 'Modern clean line';
}

function buildContextualFallback(params: {
  locale: Locale;
  intent: string;
  pieces: OutfitPiece[];
  weather?: WeatherSnapshot;
}) {
  const isTurkish = params.locale === 'tr';
  const top = roleItemName(params.pieces, 'top') ?? roleItemName(params.pieces, 'dress') ?? params.pieces[0]?.item.name;
  const bottom = roleItemName(params.pieces, 'bottom');
  const shoes = roleItemName(params.pieces, 'shoes');
  const bag = roleItemName(params.pieces, 'bag');
  const warmOrBeach = BEACH_INTENT_PATTERN.test(params.intent) || isWarmWeather(params.weather);

  if (isTurkish) {
    const commentary = warmOrBeach
      ? `${top ?? 'Seçilen üst parça'} görünümü hafif tutarken ${bottom ?? 'alt parça'} sade ve rahat bir denge kuruyor. ${shoes ?? 'Ayakkabı seçimi'} şehirden sahile geçişte net, kolay ve sıcak havaya uygun bir çizgi bırakıyor.`
      : `${top ?? 'Seçilen ana parça'} görünümün merkezini kuruyor; ${bottom ?? 'tamamlayıcı parça'} silueti dengeli ve sakin tutuyor. ${shoes ?? 'Ayakkabı seçimi'} kombini günlük kullanıma yakın, özenli bir çizgide tamamlıyor.`;
    return {
      title: fallbackTitle(params.locale, params.intent, params.weather),
      vibe: fallbackVibe(params.locale, params.intent, params.weather),
      commentary,
      weatherReason: warmOrBeach
        ? 'Sıcak hava için görünüm hafif, rahat ve hareketi kolay bir tempoda kalıyor.'
        : 'Hava durumu görünümün ağırlığını dengede tutacak sade bir styling gerektiriyor.',
      stylingNotes: bag
        ? `${bag} görünümü pratik bir dokunuşla tamamlıyor; genel etki sade, net ve gündelik şıklığa yakın duruyor.`
        : 'Parçalar fazla detay gerektirmeden sade kontrast ve rahat yapı üzerinden birlikte çalışıyor.',
      tags: warmOrBeach ? ['hafif', 'rahat', 'sade kontrast'] : ['dengeli', 'sade', 'modern'],
    };
  }

  const commentary = warmOrBeach
    ? `${top ?? 'The main piece'} keeps the look light while ${bottom ?? 'the lower half'} creates a clean, relaxed balance. ${shoes ?? 'The shoes'} make the outfit feel easy from city movement to a coastal setting.`
    : `${top ?? 'The main piece'} anchors the outfit while ${bottom ?? 'the supporting piece'} keeps the silhouette clean and balanced. ${shoes ?? 'The shoes'} finish it with a polished everyday line.`;
  return {
    title: fallbackTitle(params.locale, params.intent, params.weather),
    vibe: fallbackVibe(params.locale, params.intent, params.weather),
    commentary,
    weatherReason: warmOrBeach
      ? 'For warm weather, the styling stays light, comfortable, and easy to move in.'
      : 'The weather calls for a clean balance rather than unnecessary weight.',
    stylingNotes: bag
      ? `${bag} adds a practical finish while the overall mood stays clean and realistic.`
      : 'The pieces work through simple contrast and relaxed structure without unnecessary detail.',
    tags: warmOrBeach ? ['light', 'relaxed', 'clean contrast'] : ['balanced', 'clean', 'modern'],
  };
}

function buildRemotePieces(
  remote: RemoteLook,
  wardrobe: WardrobeItem[],
  roleLabels: Record<OutfitPieceRole, string>,
): OutfitPiece[] {
  const itemById = new Map(wardrobe.map((item) => [item.id, item]));
  const used = new Set<string>();
  return (remote.selectedPieces ?? [])
    .filter((piece) => itemById.has(piece.itemId) && !used.has(piece.itemId))
    .slice(0, 8)
    .map((piece) => {
      used.add(piece.itemId);
      const item = itemById.get(piece.itemId) as WardrobeItem;
      return {
        id: `${item.id}-${piece.role}`,
        role: piece.role,
        label: roleLabels[piece.role],
        item,
      };
    });
}

function applyRemoteLook(
  fallback: CuratedLook,
  remote: RemoteLook,
  wardrobe: WardrobeItem[],
  roleLabels: Record<OutfitPieceRole, string>,
  locale: Locale,
  intent: string,
  weather: WeatherSnapshot | undefined,
): CuratedLook {
  const completeOutfit = buildRemotePieces(remote, wardrobe, roleLabels);
  if (completeOutfit.length === 0) return fallback;
  const itemIds = completeOutfit.map((piece) => piece.item.id);
  const image = completeOutfit[0]?.item.imageUri ?? fallback.image;
  const tones = detectedTones(completeOutfit);
  const textContext = { tones, pieces: completeOutfit, weather, intent };
  const fallbackCopy = buildContextualFallback({ locale, intent, pieces: completeOutfit, weather });

  const remoteTitle = remote.title?.trim();
  const remoteVibe = remote.vibe?.trim();
  const remoteCommentary = remote.commentary?.trim();
  const remoteWeatherReason = remote.weatherReason?.trim();
  const remoteStylingNotes = remote.stylingNotes?.trim();
  const remoteMissingPiece = remote.missingPiece?.trim();
  const commentary = remoteCommentary && !hasContextConflict(remoteCommentary, textContext)
    ? remoteCommentary
    : fallbackCopy.commentary;
  const weatherReason = remoteWeatherReason && !hasContextConflict(remoteWeatherReason, textContext)
    ? remoteWeatherReason
    : fallbackCopy.weatherReason;
  const stylingNotes = remoteStylingNotes && !hasContextConflict(remoteStylingNotes, textContext)
    ? remoteStylingNotes
    : fallbackCopy.stylingNotes;
  const fallbackMissingPieces = fallback.missingOutfitPieces?.filter((piece) => !hasContextConflict(piece, textContext));

  return {
    ...fallback,
    title: remoteTitle && !hasContextConflict(remoteTitle, textContext) ? remoteTitle : fallbackCopy.title,
    occasion: remoteVibe && !hasContextConflict(remoteVibe, textContext) ? remoteVibe : fallbackCopy.vibe,
    description: commentary,
    weatherStyling: weatherReason,
    whyThisWorks: stylingNotes,
    editorialReasoning: undefined,
    vibes: remote.tags?.length ? remote.tags.slice(0, 4) : fallbackCopy.tags,
    itemIds,
    image,
    usesWardrobeImage: true,
    completeOutfit,
    missingOutfitPieces:
      remoteMissingPiece && !hasContextConflict(remoteMissingPiece, textContext)
        ? [remoteMissingPiece]
        : fallbackMissingPieces,
  };
}

export async function generateOutfitSecurely(params: {
  locale: Locale;
  intent: string;
  wardrobe: WardrobeItem[];
  weather?: WeatherSnapshot;
  mood?: MoodId;
  styleMemory?: StyleMemory;
  recentItemIds?: string[];
  roleLabels: Record<OutfitPieceRole, string>;
  fallback: CuratedLook;
}): Promise<CuratedLook> {
  try {
    const { data, error } = await supabase.functions.invoke<GenerateOutfitResponse>('generate-outfit', {
      body: {
        locale: params.locale,
        intent: params.intent,
        mood: params.mood,
        wardrobe: compactWardrobe(params.wardrobe),
        weather: params.weather,
        styleMemory: compactMemory(params.styleMemory),
        recentItemIds: compactRecentItemIds(params.recentItemIds),
      },
    });

    if (error || !data?.ok || !data.look) return params.fallback;
    return applyRemoteLook(
      params.fallback,
      data.look,
      params.wardrobe,
      params.roleLabels,
      params.locale,
      params.intent,
      params.weather,
    );
  } catch {
    return params.fallback;
  }
}
