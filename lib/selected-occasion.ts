import { analyzeIntent, type ResolvedIntent } from '@/lib/intent-engine';

/** Home occasion cards — engine uses normalized phrase, not free text. */
export type SelectedOccasionId =
  | 'daily'
  | 'office'
  | 'dinner'
  | 'date'
  | 'shopping'
  | 'coffee'
  | 'beach'
  | 'vacation'
  | 'wedding'
  | 'sport_walk'
  | 'travel'
  | 'family_visit';

export const SELECTED_OCCASION_ORDER: SelectedOccasionId[] = [
  'daily',
  'office',
  'dinner',
  'date',
  'shopping',
  'coffee',
  'beach',
  'vacation',
  'wedding',
  'sport_walk',
  'travel',
  'family_visit',
];

/** Stable phrases tuned for intent-engine scoring (not shown as primary UI). */
const OCCASION_ENGINE_PHRASE: Record<SelectedOccasionId, string> = {
  daily: 'Günlük şık bir kombin istiyorum, rahat ve modern.',
  office: 'Yarın ofiste önemli bir toplantım var, profesyonel görünmek istiyorum.',
  dinner: 'Akşam şık bir yemeğe gidiyorum, elegant bir görünüm.',
  date: 'Romantik bir buluşmaya çıkıyorum, zarif ve feminen.',
  shopping: 'AVMde alışveriş yapacağım, rahat yürüyebileceğim kombin.',
  coffee: 'Kahve içmeye gidiyorum, smart casual.',
  beach: 'Arkadaşlarımla sahile gidiyorum, yazlık rahat kombin.',
  vacation: 'Şehir dışında tatile çıkacağım, relaxed vacation style.',
  wedding: 'Düğüne gidiyorum, resmi davet kombini.',
  sport_walk: 'Bugün çok yürüyeceğim, konforlu spor-günlük.',
  travel: 'Seyahat ediyorum, havalimanı ve yürüyüşe uygun.',
  family_visit: 'Aile ziyaretine gidiyorum, sıcak ama düzenli görünüm.',
};

export function enginePhraseForOccasion(id: SelectedOccasionId): string {
  return OCCASION_ENGINE_PHRASE[id];
}

export function resolveSelectedOccasion(id: SelectedOccasionId): ResolvedIntent {
  return analyzeIntent(enginePhraseForOccasion(id));
}
