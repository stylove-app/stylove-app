import type { MoodId, StyleMoodId } from '@/i18n/types';

export const STYLE_MOODS: StyleMoodId[] = [
  'elegant',
  'minimal',
  'confident',
  'romantic',
  'dailyChic',
];

export function styleMoodToEngine(mood: StyleMoodId): MoodId {
  const map: Record<StyleMoodId, MoodId> = {
    elegant: 'elegant',
    minimal: 'minimal',
    confident: 'confident',
    romantic: 'soft',
    dailyChic: 'oldMoney',
  };
  return map[mood];
}
