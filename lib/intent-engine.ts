import { isQaTestMode } from '@/lib/qa-test-mode';
import type { MoodId } from '@/i18n/types';
import type { StylingOccasion } from '@/lib/styling-bible';

export type ActivityType =
  | 'work'
  | 'meeting'
  | 'interview'
  | 'presentation'
  | 'office'
  | 'school'
  | 'university'
  | 'shopping'
  | 'market'
  | 'errands'
  | 'coffee'
  | 'cafe'
  | 'restaurant'
  | 'dinner'
  | 'date'
  | 'family_visit'
  | 'wedding'
  | 'engagement'
  | 'ceremony'
  | 'party'
  | 'birthday'
  | 'beach'
  | 'vacation'
  | 'travel'
  | 'airport'
  | 'business_trip'
  | 'museum'
  | 'concert'
  | 'picnic'
  | 'walking'
  | 'daily_life'
  | 'sport'
  | 'gym'
  | 'nightlife';

export type PlaceType =
  | 'office'
  | 'corporate'
  | 'school'
  | 'campus'
  | 'mall'
  | 'market'
  | 'restaurant'
  | 'cafe'
  | 'beach'
  | 'park'
  | 'street'
  | 'airport'
  | 'hotel'
  | 'home'
  | 'wedding_venue'
  | 'formal_event'
  | 'vacation_resort';

export type SocialContext =
  | 'alone'
  | 'friends'
  | 'family'
  | 'partner'
  | 'date'
  | 'coworkers'
  | 'clients'
  | 'formal_group'
  | 'casual_group';

export type StyleOutcomeType =
  | 'business_formal'
  | 'business_casual'
  | 'smart_casual'
  | 'casual'
  | 'elegant'
  | 'evening'
  | 'vacation'
  | 'sporty'
  | 'minimal'
  | 'classic'
  | 'modern'
  | 'streetwear';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type ResolvedIntent = {
  rawText: string;
  normalizedIntent: string;
  activityType: ActivityType | null;
  placeType: PlaceType | null;
  socialContext: SocialContext[];
  formalityLevel: number;
  comfortNeed: number;
  eleganceNeed: number;
  movementLevel: number;
  practicality: number;
  weatherSensitivity: number;
  timeOfDay: TimeOfDay | null;
  confidenceScore: number;
  styleOutcome: StyleOutcomeType;
  occasion: StylingOccasion;
  moodHint: MoodId;
};

type DimensionScores = {
  formality: number;
  comfort: number;
  elegance: number;
  movement: number;
  practicality: number;
  weatherSensitivity: number;
};

type SignalHit = {
  pattern: RegExp;
  activity?: Partial<Record<ActivityType, number>>;
  place?: Partial<Record<PlaceType, number>>;
  social?: Partial<Record<SocialContext, number>>;
  outcome?: Partial<Record<StyleOutcomeType, number>>;
  formality?: number;
  comfort?: number;
  elegance?: number;
  movement?: number;
  practicality?: number;
  weatherSensitivity?: number;
  timeOfDay?: TimeOfDay;
};

function normalizeText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, ' ');
}

function pickTopKey<T extends string>(scores: Partial<Record<T, number>>): T | null {
  let best: T | null = null;
  let bestScore = 0;
  for (const [key, value] of Object.entries(scores) as [T, number][]) {
    if (value > bestScore) {
      bestScore = value;
      best = key;
    }
  }
  return bestScore > 0 ? best : null;
}

function collectSocial(scores: Partial<Record<SocialContext, number>>): SocialContext[] {
  const threshold = 1.2;
  return (Object.entries(scores) as [SocialContext, number][])
    .filter(([, value]) => value >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Multi-layer semantic signals — scores accumulate; nothing is a single-keyword decision. */
const INTENT_SIGNALS: SignalHit[] = [
  // Work & business
  {
    pattern:
      /\b(iş görüşmes|is gorusmes|mülakat|mulakat|job interview|interview|görüşme|gorusme|müşteri|musteri|client meeting)\b/i,
    activity: { interview: 4, meeting: 3 },
    social: { clients: 2.5, coworkers: 1.5 },
    outcome: { business_formal: 4 },
    formality: 0.35,
    elegance: 0.2,
  },
  {
    pattern: /\b(sunum|presentation|pitch|board|toplantı|toplanti|meeting|conference)\b/i,
    activity: { presentation: 4, meeting: 3 },
    place: { office: 2, corporate: 2 },
    social: { coworkers: 2, clients: 2 },
    outcome: { business_formal: 3.5, business_casual: 1 },
    formality: 0.3,
  },
  {
    pattern: /\b(ofis|office|işe|ise gide|iş yer|is yer|kurumsal|corporate|business day|workday)\b/i,
    activity: { office: 4, work: 3 },
    place: { office: 3, corporate: 2 },
    outcome: { business_casual: 3, business_formal: 1.5 },
    formality: 0.22,
  },
  {
    pattern: /\b(iş|is\b|work\b|business\b|profesyonel|professional)\b/i,
    activity: { work: 2.5, office: 2 },
    outcome: { business_casual: 2 },
    formality: 0.15,
  },

  // Education
  {
    pattern: /\b(üniversite|universite|ünide|kampüs|kampus|college|university|lecture|ders)\b/i,
    activity: { university: 4 },
    place: { campus: 3, school: 2 },
    social: { casual_group: 1.5, friends: 1 },
    outcome: { casual: 2, smart_casual: 1.5 },
    comfort: 0.15,
    movement: 0.12,
  },
  {
    pattern: /\b(okul|school|lise|high school|sınıf|sinif)\b/i,
    activity: { school: 4 },
    place: { school: 3, campus: 2 },
    outcome: { casual: 2.5 },
    comfort: 0.18,
  },

  // Shopping & errands
  {
    pattern: /\b(avm|avmde|avm'[deye]|alışveriş|alisveris|shopping mall|mall\b|mağaza|magaza)\b/i,
    activity: { shopping: 4 },
    place: { mall: 4 },
    social: { friends: 1, family: 1, casual_group: 1 },
    outcome: { casual: 2.5, smart_casual: 1 },
    comfort: 0.2,
    movement: 0.18,
  },
  {
    pattern: /\b(pazar|market\b|bazaar|sunday market|manav)\b/i,
    activity: { market: 4, errands: 2 },
    place: { market: 4 },
    outcome: { casual: 3 },
    comfort: 0.28,
    movement: 0.25,
    practicality: 0.3,
  },
  {
    pattern: /\b(errand|grocery|marketten|alışverişe|alisverise|işler|isler)\b/i,
    activity: { errands: 3, shopping: 2 },
    outcome: { casual: 2 },
    comfort: 0.15,
    practicality: 0.2,
  },

  // Food & social dining
  {
    pattern: /\b(kahve|coffee|latte|espresso|café|cafe|kafe)\b/i,
    activity: { coffee: 4, cafe: 3 },
    place: { cafe: 4 },
    outcome: { smart_casual: 2, casual: 2 },
    comfort: 0.1,
  },
  {
    pattern: /\b(yemek|dinner|restaurant|restoran|fine dining|akşam yemeği|aksam yemegi)\b/i,
    activity: { dinner: 4, restaurant: 3 },
    place: { restaurant: 3 },
    outcome: { elegant: 2.5, evening: 2, smart_casual: 1.5 },
    formality: 0.18,
    elegance: 0.22,
    timeOfDay: 'evening',
  },
  {
    pattern: /\b(brunch|öğle yemeği|ogle yemegi|lunch)\b/i,
    activity: { restaurant: 2, dinner: 1 },
    outcome: { smart_casual: 2, casual: 1.5 },
    timeOfDay: 'afternoon',
  },

  // Dating & family
  {
    pattern:
      /\b(ilk buluşma|ilk bulusma|first date|randevu|date night|flört|flort|sevgili|kız arkadaş|kiz arkadas|erkek arkadaş|erkek arkadas|boyfriend|girlfriend)\b/i,
    activity: { date: 4 },
    social: { date: 3, partner: 2.5 },
    outcome: { elegant: 3, smart_casual: 2 },
    formality: 0.2,
    elegance: 0.35,
  },
  {
    pattern:
      /\b(ailesiyle|aile ile|ailemle|meet the parents|tanış|tanis|kız arkadaşımın ailesi|kiz arkadasimin ailesi|erkek arkadaşımın ailesi)\b/i,
    activity: { family_visit: 4, dinner: 2 },
    social: { family: 3, partner: 2.5 },
    outcome: { smart_casual: 3, elegant: 2.5, classic: 1.5 },
    formality: 0.25,
    elegance: 0.3,
  },
  {
    pattern: /\b(annemle|babamla|ailemle|aile ile|family visit|aile ziyareti|akraba|relatives)\b/i,
    activity: { family_visit: 3, market: 1, errands: 1 },
    social: { family: 3.5 },
    outcome: { casual: 2.5, smart_casual: 1 },
    comfort: 0.22,
    practicality: 0.18,
  },

  // Celebrations & formal events
  {
    pattern: /\b(düğün|dugun|wedding|nikah|gelin|damat)\b/i,
    activity: { wedding: 4, ceremony: 2 },
    place: { wedding_venue: 4, formal_event: 2 },
    outcome: { elegant: 3.5, classic: 2 },
    formality: 0.35,
    elegance: 0.35,
  },
  {
    pattern: /\b(nişan|nisan|engagement party|engagement)\b/i,
    activity: { engagement: 4, ceremony: 2 },
    outcome: { elegant: 3, smart_casual: 1.5 },
    formality: 0.28,
    elegance: 0.28,
  },
  {
    pattern: /\b(doğum günü|dogum gunu|birthday party|birthday\b|kutlama)\b/i,
    activity: { birthday: 4, party: 2 },
    social: { friends: 2, family: 1.5, casual_group: 1.5 },
    outcome: { smart_casual: 2.5, elegant: 1.5, evening: 1.5 },
    elegance: 0.15,
  },
  {
    pattern: /\b(parti|party|kutlama|celebration|kokteyl|cocktail)\b/i,
    activity: { party: 3, nightlife: 2 },
    outcome: { evening: 2.5, elegant: 2 },
    elegance: 0.2,
    timeOfDay: 'evening',
  },

  // Beach, travel, movement
  {
    pattern: /\b(sahil|sahile|plaj|beach|deniz kenarı|deniz kenari|kumsal)\b/i,
    activity: { beach: 4 },
    place: { beach: 4 },
    social: { friends: 2, casual_group: 1.5 },
    outcome: { casual: 3, vacation: 2 },
    comfort: 0.3,
    movement: 0.15,
  },
  {
    pattern: /\b(tatil|vacation|holiday|resort|otelde|şehir dışı|sehir disi|getaway)\b/i,
    activity: { vacation: 4, travel: 2 },
    place: { vacation_resort: 3, hotel: 2 },
    outcome: { vacation: 4, casual: 2 },
    comfort: 0.25,
  },
  {
    pattern: /\b(havalimanı|havalimani|airport|uçak|ucak|flight|business trip|iş seyahati|is seyahati)\b/i,
    activity: { airport: 4, travel: 3, business_trip: 2 },
    place: { airport: 4 },
    outcome: { smart_casual: 2, business_casual: 1.5, vacation: 1 },
    comfort: 0.22,
    movement: 0.2,
  },
  {
    pattern: /\b(seyahat|travel|gezi|trip\b|touring|backpack)\b/i,
    activity: { travel: 4 },
    outcome: { vacation: 2, casual: 2, smart_casual: 1 },
    comfort: 0.2,
    movement: 0.18,
  },
  {
    pattern: /\b(yürüyeceğim|yuruyecegim|yürüyüş|yuruyus|çok yürü|cok yuru|walking a lot|long walk|city walk)\b/i,
    activity: { walking: 4, daily_life: 2 },
    outcome: { casual: 2.5, sporty: 1 },
    comfort: 0.32,
    movement: 0.38,
    practicality: 0.25,
  },
  {
    pattern: /\b(piknik|picnic|parka|park\b|bahçe|bahce)\b/i,
    activity: { picnic: 3, walking: 1 },
    place: { park: 3 },
    outcome: { casual: 2.5 },
    comfort: 0.2,
    movement: 0.15,
  },

  // Night & culture
  {
    pattern: /\b(gece kulübü|gece kulubu|clubbing|nightclub|gece dışarı|gece disari|night out|akşam dışarı|aksam disari)\b/i,
    activity: { nightlife: 4 },
    outcome: { evening: 3.5, elegant: 2, modern: 1.5 },
    formality: 0.15,
    elegance: 0.25,
    timeOfDay: 'night',
  },
  {
    pattern: /\b(konser|concert|müze|muze|museum|galeri|gallery|tiyatro|theater)\b/i,
    activity: { concert: 3, museum: 3 },
    place: { formal_event: 1 },
    outcome: { smart_casual: 2.5, elegant: 2 },
    elegance: 0.18,
  },

  // Sport
  {
    pattern: /\b(spor|gym|fitness|workout|koşu|kosu|antrenman|training|yoga|pilates)\b/i,
    activity: { sport: 4, gym: 4 },
    outcome: { sporty: 4, casual: 1 },
    comfort: 0.35,
    movement: 0.3,
  },

  // Social groups (additive)
  {
    pattern: /\b(arkadaş|arkadas|friends|kankalar|crew|ekiple)\b/i,
    social: { friends: 3, casual_group: 2 },
    outcome: { casual: 1.5, smart_casual: 1 },
  },
  {
    pattern: /\b(tek başıma|tek basima|alone|solo|kendi başıma)\b/i,
    social: { alone: 3 },
  },
  {
    pattern: /\b(ekip|takım arkadaş|team|colleague|iş arkadaş|is arkadas|coworker)\b/i,
    social: { coworkers: 3 },
    formality: 0.1,
  },

  // Modifiers (no single activity — shape dimensions)
  {
    pattern: /\b(önemli|onemli|important|critical|büyük gün|buyuk gun|resmi|formal|profesyonel)\b/i,
    formality: 0.22,
    elegance: 0.15,
    outcome: { business_formal: 1.5, elegant: 1.5 },
  },
  {
    pattern: /\b(rahat|comfortable|relaxed|chill|sade|low key|günlük|gunluk)\b/i,
    comfort: 0.25,
    outcome: { casual: 2 },
    formality: -0.12,
  },
  {
    pattern: /\b(şık|sik|elegant|chic|polished|zarif|refined|gösteriş|gosteris)\b/i,
    elegance: 0.28,
    outcome: { elegant: 2.5, smart_casual: 1.5, classic: 1 },
    formality: 0.12,
  },
  {
    pattern: /\b(minimal|minimalist|sade kombin|clean look)\b/i,
    outcome: { minimal: 3.5, classic: 1.5 },
    elegance: 0.1,
  },
  {
    pattern: /\b(modern|trendy|contemporary|street style|streetwear)\b/i,
    outcome: { modern: 2.5, streetwear: 2.5 },
  },

  // Weather sensitivity (user-stated)
  {
    pattern: /\b(yağmur|yagmur|rainy|rain\b|ıslak|islak|wet weather)\b/i,
    weatherSensitivity: 0.45,
    practicality: 0.2,
  },
  {
    pattern: /\b(sıcak|sicak|hot\b|heat|kavurucu|scorching)\b/i,
    weatherSensitivity: 0.4,
    comfort: 0.15,
  },
  {
    pattern: /\b(soğuk|soguk|cold|chilly|freezing|üşüyeceğim|usuyecegim)\b/i,
    weatherSensitivity: 0.35,
    comfort: 0.1,
  },

  // Time of day
  {
    pattern: /\b(akşam|aksam|evening|tonight|bu gece|gece)\b/i,
    timeOfDay: 'evening',
    outcome: { evening: 2, elegant: 1 },
    formality: 0.08,
  },
  {
    pattern: /\b(sabah|morning|early)\b/i,
    timeOfDay: 'morning',
  },
  {
    pattern: /\b(öğleden sonra|ogleden sonra|afternoon)\b/i,
    timeOfDay: 'afternoon',
  },
  {
    pattern: /\b(yarın|yarin|tomorrow|bugün|bugun|today)\b/i,
    practicality: 0.05,
  },

  // Daily life fallback boost when going somewhere generic
  {
    pattern: /\b(gidiyorum|gideceğim|gidecegim|going to|heading to|çıkacağım|cikacagim|çıkıyorum|cikiyorum)\b/i,
    activity: { daily_life: 1.5 },
    movement: 0.08,
  },
];

const ACTIVITY_FORMALITY: Partial<Record<ActivityType, number>> = {
  interview: 0.88,
  presentation: 0.85,
  meeting: 0.82,
  work: 0.78,
  office: 0.75,
  business_trip: 0.72,
  wedding: 0.8,
  engagement: 0.75,
  ceremony: 0.78,
  dinner: 0.68,
  date: 0.65,
  family_visit: 0.55,
  restaurant: 0.6,
  museum: 0.58,
  concert: 0.55,
  university: 0.35,
  school: 0.32,
  shopping: 0.38,
  market: 0.28,
  errands: 0.3,
  coffee: 0.45,
  beach: 0.25,
  vacation: 0.3,
  travel: 0.4,
  walking: 0.32,
  picnic: 0.3,
  sport: 0.15,
  gym: 0.12,
  nightlife: 0.58,
  party: 0.5,
  birthday: 0.48,
  daily_life: 0.42,
};

const OUTCOME_TO_OCCASION: Record<StyleOutcomeType, StylingOccasion> = {
  business_formal: 'business',
  business_casual: 'office',
  smart_casual: 'smart_casual',
  casual: 'casual',
  elegant: 'dinner',
  evening: 'dinner',
  vacation: 'vacation',
  sporty: 'sport',
  minimal: 'smart_casual',
  classic: 'formal',
  modern: 'smart_casual',
  streetwear: 'casual',
};

const OUTCOME_TO_MOOD: Partial<Record<StyleOutcomeType, MoodId>> = {
  business_formal: 'confident',
  business_casual: 'confident',
  smart_casual: 'elegant',
  casual: 'minimal',
  elegant: 'elegant',
  evening: 'seductive',
  vacation: 'soft',
  sporty: 'confident',
  minimal: 'minimal',
  classic: 'oldMoney',
  modern: 'confident',
  streetwear: 'confident',
};

function applySignal(
  text: string,
  hit: SignalHit,
  activityScores: Partial<Record<ActivityType, number>>,
  placeScores: Partial<Record<PlaceType, number>>,
  socialScores: Partial<Record<SocialContext, number>>,
  outcomeScores: Partial<Record<StyleOutcomeType, number>>,
  dimensions: DimensionScores,
  timeVotes: Partial<Record<TimeOfDay, number>>,
): void {
  if (!hit.pattern.test(text)) return;

  if (hit.activity) {
    for (const [key, weight] of Object.entries(hit.activity) as [ActivityType, number][]) {
      activityScores[key] = (activityScores[key] ?? 0) + weight;
    }
  }
  if (hit.place) {
    for (const [key, weight] of Object.entries(hit.place) as [PlaceType, number][]) {
      placeScores[key] = (placeScores[key] ?? 0) + weight;
    }
  }
  if (hit.social) {
    for (const [key, weight] of Object.entries(hit.social) as [SocialContext, number][]) {
      socialScores[key] = (socialScores[key] ?? 0) + weight;
    }
  }
  if (hit.outcome) {
    for (const [key, weight] of Object.entries(hit.outcome) as [StyleOutcomeType, number][]) {
      outcomeScores[key] = (outcomeScores[key] ?? 0) + weight;
    }
  }
  if (hit.formality) dimensions.formality += hit.formality;
  if (hit.comfort) dimensions.comfort += hit.comfort;
  if (hit.elegance) dimensions.elegance += hit.elegance;
  if (hit.movement) dimensions.movement += hit.movement;
  if (hit.practicality) dimensions.practicality += hit.practicality;
  if (hit.weatherSensitivity) dimensions.weatherSensitivity += hit.weatherSensitivity;
  if (hit.timeOfDay) {
    timeVotes[hit.timeOfDay] = (timeVotes[hit.timeOfDay] ?? 0) + 2;
  }
}

function buildNormalizedIntent(
  activity: ActivityType | null,
  place: PlaceType | null,
  social: SocialContext[],
  outcome: StyleOutcomeType,
  formality: number,
): string {
  const activityLabel = activity ?? 'daily_life';
  const placeLabel = place ? ` at ${place}` : '';
  const socialLabel = social.length > 0 ? ` with ${social.slice(0, 2).join('+')}` : '';
  return `${outcome} styling for ${activityLabel}${placeLabel}${socialLabel} (formality ${Math.round(formality * 100)}%)`;
}

function computeConfidence(
  activityScores: Partial<Record<ActivityType, number>>,
  outcomeScores: Partial<Record<StyleOutcomeType, number>>,
  signalHits: number,
): number {
  const activityValues = Object.values(activityScores);
  const outcomeValues = Object.values(outcomeScores);
  const topActivity = activityValues.length ? Math.max(...activityValues) : 0;
  const secondActivity =
    activityValues.length > 1
      ? activityValues.sort((a, b) => b - a)[1]
      : 0;
  const topOutcome = outcomeValues.length ? Math.max(...outcomeValues) : 0;
  const margin = topActivity - secondActivity;
  const hitBoost = Math.min(0.25, signalHits * 0.02);
  const marginBoost = Math.min(0.35, margin * 0.08);
  const outcomeBoost = Math.min(0.2, topOutcome * 0.04);
  return clamp01(0.35 + hitBoost + marginBoost + outcomeBoost);
}

export function analyzeIntent(raw: string): ResolvedIntent {
  const text = normalizeText(raw);
  if (!text) {
    const resolved: ResolvedIntent = {
      rawText: '',
      normalizedIntent: 'smart_casual styling for daily_life (formality 42%)',
      activityType: 'daily_life',
      placeType: null,
      socialContext: [],
      formalityLevel: 0.42,
      comfortNeed: 0.35,
      eleganceNeed: 0.3,
      movementLevel: 0.3,
      practicality: 0.25,
      weatherSensitivity: 0,
      timeOfDay: null,
      confidenceScore: 0.35,
      styleOutcome: 'smart_casual',
      occasion: 'smart_casual',
      moodHint: 'elegant',
    };
    logIntentResolution(resolved);
    return resolved;
  }
  const activityScores: Partial<Record<ActivityType, number>> = {};
  const placeScores: Partial<Record<PlaceType, number>> = {};
  const socialScores: Partial<Record<SocialContext, number>> = {};
  const outcomeScores: Partial<Record<StyleOutcomeType, number>> = {};
  const dimensions: DimensionScores = {
    formality: 0,
    comfort: 0,
    elegance: 0,
    movement: 0,
    practicality: 0,
    weatherSensitivity: 0,
  };
  const timeVotes: Partial<Record<TimeOfDay, number>> = {};
  let signalHits = 0;

  for (const hit of INTENT_SIGNALS) {
    if (hit.pattern.test(text)) {
      signalHits += 1;
      applySignal(text, hit, activityScores, placeScores, socialScores, outcomeScores, dimensions, timeVotes);
    }
  }

  const activityType = pickTopKey(activityScores);
  const placeType = pickTopKey(placeScores);
  let styleOutcome = pickTopKey(outcomeScores) ?? 'smart_casual';

  if (activityType && ACTIVITY_FORMALITY[activityType] !== undefined) {
    dimensions.formality += ACTIVITY_FORMALITY[activityType]! * 0.45;
  }

  if (
    (activityType === 'interview' || activityType === 'presentation' || activityType === 'meeting') &&
    styleOutcome !== 'business_formal'
  ) {
    outcomeScores.business_formal = (outcomeScores.business_formal ?? 0) + 2;
    styleOutcome = pickTopKey(outcomeScores) ?? 'business_formal';
  }

  if (activityType === 'market' || activityType === 'walking' || activityType === 'picnic') {
    outcomeScores.casual = (outcomeScores.casual ?? 0) + 1.5;
    if (styleOutcome === 'smart_casual' && (outcomeScores.casual ?? 0) >= (outcomeScores.smart_casual ?? 0)) {
      styleOutcome = 'casual';
    }
  }

  if (socialScores.family && socialScores.partner) {
    outcomeScores.smart_casual = (outcomeScores.smart_casual ?? 0) + 2;
    outcomeScores.elegant = (outcomeScores.elegant ?? 0) + 1.5;
    dimensions.elegance += 0.15;
    dimensions.formality += 0.12;
    styleOutcome = pickTopKey(outcomeScores) ?? 'smart_casual';
  }

  const formalityLevel = clamp01(0.42 + dimensions.formality);
  const comfortNeed = clamp01(0.35 + dimensions.comfort + (activityType === 'market' ? 0.2 : 0));
  const eleganceNeed = clamp01(0.3 + dimensions.elegance);
  const movementLevel = clamp01(0.3 + dimensions.movement);
  const practicality = clamp01(0.25 + dimensions.practicality);
  const weatherSensitivity = clamp01(dimensions.weatherSensitivity);
  const timeOfDay = pickTopKey(timeVotes);
  const socialContext = collectSocial(socialScores);
  const confidenceScore = computeConfidence(activityScores, outcomeScores, signalHits);

  let occasion = OUTCOME_TO_OCCASION[styleOutcome];
  if (activityType === 'meeting' || activityType === 'presentation' || activityType === 'interview') {
    occasion = activityType === 'interview' ? 'business' : 'meeting';
  } else if (activityType === 'date') {
    occasion = 'date';
  } else if (activityType === 'beach' || activityType === 'vacation') {
    occasion = 'vacation';
  } else if (activityType === 'sport' || activityType === 'gym') {
    occasion = 'sport';
  } else if (activityType === 'wedding' || activityType === 'ceremony') {
    occasion = 'formal';
  }

  const moodHint = OUTCOME_TO_MOOD[styleOutcome] ?? 'elegant';
  const normalizedIntent = buildNormalizedIntent(
    activityType,
    placeType,
    socialContext,
    styleOutcome,
    formalityLevel,
  );

  const resolved: ResolvedIntent = {
    rawText: raw.trim(),
    normalizedIntent,
    activityType,
    placeType,
    socialContext,
    formalityLevel,
    comfortNeed,
    eleganceNeed,
    movementLevel,
    practicality,
    weatherSensitivity,
    timeOfDay,
    confidenceScore,
    styleOutcome,
    occasion,
    moodHint,
  };

  logIntentResolution(resolved);
  return resolved;
}

/** QA-only: never surfaces in production UI. */
export function logIntentResolution(resolved: ResolvedIntent): void {
  if (!isQaTestMode()) return;
  console.log('[Stylove Intent]', {
    raw: resolved.rawText,
    normalized: resolved.normalizedIntent,
    activity: resolved.activityType,
    place: resolved.placeType,
    social: resolved.socialContext,
    styleOutcome: resolved.styleOutcome,
    occasion: resolved.occasion,
    formality: resolved.formalityLevel.toFixed(2),
    comfort: resolved.comfortNeed.toFixed(2),
    elegance: resolved.eleganceNeed.toFixed(2),
    movement: resolved.movementLevel.toFixed(2),
    confidence: resolved.confidenceScore.toFixed(2),
  });
}

export function resolveIntentForStyling(raw: string, cached?: ResolvedIntent): ResolvedIntent {
  return cached ?? analyzeIntent(raw);
}
