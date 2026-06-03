import type { TranslationKeys } from '@/i18n/types';
import type { CuratedLook } from '@/lib/outfit-engine';
import { buildPersonalizedSummaryLine } from '@/lib/personalized-look-copy';

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

function detectTonesFromLook(look: CuratedLook): string[] {
  const items = look.completeOutfit?.map((piece) => piece.item) ?? [];
  const source = items.map((item) => `${item.name} ${item.itemType}`).join(' ');
  return TONE_PATTERNS.filter((entry) => entry.patterns.some((pattern) => pattern.test(source))).map(
    (entry) => entry.tone,
  );
}

function pickFavoriteLook(weeklySaved: CuratedLook[], weeklyLooks: CuratedLook[]): CuratedLook | undefined {
  const merged = Array.from(
    new Map([...weeklySaved, ...weeklyLooks].map((look) => [look.id, look])).values(),
  );
  if (merged.length === 0) return undefined;
  const savedSet = new Set(weeklySaved.map((look) => look.id));
  return (
    [...merged]
      .filter((look) => savedSet.has(look.id))
      .sort((a, b) => b.createdAt - a.createdAt)[0] ??
    [...merged].sort((a, b) => b.createdAt - a.createdAt)[0]
  );
}

function buildInsightsFromLooks(looks: CuratedLook[], t: TranslationKeys): string[] {
  const insights: string[] = [];
  const allTones = new Set(looks.flatMap((look) => detectTonesFromLook(look)));

  if (looks.length >= 2) {
    insights.push(t.weeklySummary.insights.strongSilhouettes);
  }
  if (allTones.size >= 2) {
    insights.push(t.weeklySummary.insights.neutralCenter);
  }

  const moodLabels = looks.map((look) => t.moods[look.mood] ?? look.mood);
  if (moodLabels.some((label) => /romantic|soft|seductive/i.test(label))) {
    insights.push(t.weeklySummary.insights.romanticLine);
  }
  if (moodLabels.some((label) => /minimal/i.test(label))) {
    insights.push(t.weeklySummary.insights.relaxedEase);
  }

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
  const allWeekly = Array.from(
    new Map([...weeklyLooks, ...weeklySaved].map((look) => [look.id, look])).values(),
  );
  const favoriteLook = pickFavoriteLook(weeklySaved, weeklyLooks);
  const hasData = Boolean(favoriteLook);

  if (!hasData || !favoriteLook) {
    return {
      hasData: false,
      aura: '',
      mood: '',
      tones: [],
      insights: [],
      metrics: {
        looksCreated: weeklyLooks.length,
        savedLooks: weeklySaved.length,
        favoriteCategory: '—',
        activeDays: 0,
      },
      editorialSummary: '',
      nextWeekSuggestion: '',
    };
  }

  const categoryMap = new Map<string, number>();
  const toneMap = new Map<string, number>();
  const activeDays = new Set<string>();

  allWeekly.forEach((look) => {
    increment(categoryMap, look.archiveCategory ?? look.occasion);
    detectTonesFromLook(look).forEach((tone) => increment(toneMap, tone));
    activeDays.add(new Date(look.createdAt).toISOString().slice(0, 10));
  });

  const mood = t.moods[favoriteLook.mood] ?? favoriteLook.mood;
  const favoriteCategory = topKey(categoryMap) ?? lookCategoryLabel(favoriteLook, t);
  const tones = [...toneMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tone]) => tone);
  const insights = buildInsightsFromLooks(allWeekly, t);
  const aura = favoriteLook.title;
  const editorialSummary = buildPersonalizedSummaryLine({
    lookTitle: favoriteLook.title,
    description: favoriteLook.description,
    whyThisWorks: favoriteLook.whyThisWorks,
    intent: favoriteLook.intent,
  });

  const nextWeekSuggestion =
    tones.length >= 3
      ? t.weeklySummary.nextWeekSuggestions.texture
      : favoriteLook.mood === 'minimal'
        ? t.weeklySummary.nextWeekSuggestions.color
        : t.weeklySummary.nextWeekSuggestions.contrast;

  return {
    hasData: true,
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
    editorialSummary,
    nextWeekSuggestion,
  };
}

function lookCategoryLabel(look: CuratedLook, t: TranslationKeys): string {
  const piece = look.completeOutfit?.[0];
  if (piece?.label) return piece.label;
  return t.moods[look.mood] ?? look.mood;
}
