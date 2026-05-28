import type { TranslationKeys } from '@/i18n/types';
import type { CuratedLook, WardrobeItem } from '@/lib/outfit-engine';

export type WeeklyStyleSummary = {
  hasData: boolean;
  aura: string;
  mood: string;
  tones: string[];
  favoriteLook?: CuratedLook;
  insights: string[];
  metrics: {
    looksCreated: number;
    savedLooks: number;
    favoriteCategory: string;
    activeDays: number;
  };
  editorialSummary: string;
  nextWeekSuggestion: string;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const TONE_PATTERNS = [
  { tone: 'Noir', patterns: [/\bblack\b/i, /\bsiyah\b/i] },
  { tone: 'Ivory', patterns: [/\bwhite\b/i, /\bbeyaz\b/i, /\bivory\b/i, /\bcream\b/i, /\bkrem\b/i] },
  { tone: 'Camel', patterns: [/\bcamel\b/i, /\bbeige\b/i, /\btaba\b/i, /\bbej\b/i] },
  { tone: 'Wine', patterns: [/\bburgundy\b/i, /\bbordo\b/i, /\bwine\b/i] },
  { tone: 'Navy', patterns: [/\bnavy\b/i, /\blacivert\b/i] },
  { tone: 'Grey', patterns: [/\bgray\b/i, /\bgrey\b/i, /\bgri\b/i] },
  { tone: 'Blue', patterns: [/\bblue\b/i, /\bmavi\b/i] },
  { tone: 'Blush', patterns: [/\bpink\b/i, /\bpembe\b/i, /\bblush\b/i] },
] as const;

function isThisWeek(look: CuratedLook, now: number): boolean {
  return now - look.createdAt <= WEEK_MS;
}

function increment(map: Map<string, number>, key: string | undefined) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + 1);
}

function topKey(map: Map<string, number>): string | undefined {
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function detectTones(items: WardrobeItem[]): string[] {
  const source = items.map((item) => `${item.name} ${item.itemType}`).join(' ');
  return TONE_PATTERNS.filter((entry) => entry.patterns.some((pattern) => pattern.test(source))).map((entry) => entry.tone);
}

function moodFromLook(t: TranslationKeys, look: CuratedLook): string {
  const source = `${look.archiveCategory ?? ''} ${look.occasion} ${look.vibes.join(' ')}`.toLowerCase();
  if (/business|iş|is|meeting|toplantı/.test(source)) return t.weeklySummary.moods.business;
  if (/romantic|romantik|date/.test(source)) return t.weeklySummary.moods.romantic;
  if (/relaxed|rahat|summer|sahil|beach/.test(source)) return t.weeklySummary.moods.relaxed;
  if (/minimal/.test(source)) return t.weeklySummary.moods.minimal;
  return t.weeklySummary.moods.chic;
}

function resolveAura(t: TranslationKeys, mood: string, favoriteCategory: string, tones: string[]): string {
  const source = `${mood} ${favoriteCategory}`.toLowerCase();
  if (/romantic|romantik|date/.test(source)) return t.weeklySummary.auras.nightRomance;
  if (/business|minimal/.test(source)) return t.weeklySummary.auras.minimalPower;
  if (/travel|seyahat|city|şehir/.test(source)) return t.weeklySummary.auras.cityElegance;
  if (tones.includes('Camel') || tones.includes('Ivory')) return t.weeklySummary.auras.modernCashmere;
  return t.weeklySummary.auras.quietLuxury;
}

function buildInsights(t: TranslationKeys, mood: string, favoriteCategory: string, tones: string[]): string[] {
  const insights = [t.weeklySummary.insights.strongSilhouettes];
  if (tones.some((tone) => ['Noir', 'Ivory', 'Camel', 'Grey'].includes(tone))) {
    insights.push(t.weeklySummary.insights.neutralCenter);
  }
  if (/travel|seyahat/i.test(favoriteCategory)) insights.push(t.weeklySummary.insights.travelRhythm);
  if (/romantic|romantik/i.test(mood)) insights.push(t.weeklySummary.insights.romanticLine);
  if (/relaxed|rahat/i.test(mood)) insights.push(t.weeklySummary.insights.relaxedEase);
  return [...new Set(insights)].slice(0, 3);
}

export function buildWeeklyStyleSummary(
  t: TranslationKeys,
  params: {
    looks: CuratedLook[];
    savedLooks: CuratedLook[];
    now?: number;
  },
): WeeklyStyleSummary {
  const now = params.now ?? Date.now();
  const weeklyLooks = params.looks.filter((look) => isThisWeek(look, now));
  const weeklySaved = params.savedLooks.filter((look) => isThisWeek(look, now));
  const hasData = weeklyLooks.length > 0 || weeklySaved.length > 0;

  if (!hasData) {
    return {
      hasData: false,
      aura: t.weeklySummary.auras.quietLuxury,
      mood: t.weeklySummary.moods.chic,
      tones: [],
      insights: [],
      metrics: {
        looksCreated: 0,
        savedLooks: 0,
        favoriteCategory: '—',
        activeDays: 0,
      },
      editorialSummary: t.weeklySummary.editorialFallback,
      nextWeekSuggestion: t.weeklySummary.nextWeekSuggestions.contrast,
    };
  }

  const categoryMap = new Map<string, number>();
  const moodMap = new Map<string, number>();
  const toneMap = new Map<string, number>();
  const activeDays = new Set<string>();
  const allWeekly = Array.from(
    new Map([...weeklyLooks, ...weeklySaved].map((look) => [look.id, look])).values(),
  );

  allWeekly.forEach((look) => {
    increment(categoryMap, look.archiveCategory ?? look.occasion);
    increment(moodMap, moodFromLook(t, look));
    detectTones(look.completeOutfit?.map((piece) => piece.item) ?? []).forEach((tone) => increment(toneMap, tone));
    activeDays.add(new Date(look.createdAt).toISOString().slice(0, 10));
  });

  const mood = topKey(moodMap) ?? t.weeklySummary.moods.chic;
  const favoriteCategory = topKey(categoryMap) ?? t.weeklySummary.noFavorite;
  const tones = [...toneMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tone]) => tone);
  const favoriteLook = weeklySaved[0] ?? weeklyLooks[0];
  const aura = resolveAura(t, mood, favoriteCategory, tones);
  const insights = buildInsights(t, mood, favoriteCategory, tones);
  const nextWeekSuggestion =
    tones.length >= 3
      ? t.weeklySummary.nextWeekSuggestions.texture
      : mood === t.weeklySummary.moods.minimal
        ? t.weeklySummary.nextWeekSuggestions.color
        : t.weeklySummary.nextWeekSuggestions.contrast;

  return {
    hasData,
    aura,
    mood,
    tones,
    favoriteLook,
    insights,
    metrics: {
      looksCreated: weeklyLooks.length,
      savedLooks: weeklySaved.length,
      favoriteCategory,
      activeDays: activeDays.size,
    },
    editorialSummary: insights[0] ?? t.weeklySummary.editorialFallback,
    nextWeekSuggestion,
  };
}
