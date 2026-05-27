import type { MoodId, OccasionId } from '@/i18n/types';

export type ParsedIntent = {
  mood: MoodId;
  occasion: OccasionId;
  label: string;
};

const MOOD_SIGNALS: { mood: MoodId; patterns: RegExp[] }[] = [
  { mood: 'minimal', patterns: [/minimal/i, /clean/i, /simple/i, /monochrome/i] },
  { mood: 'confident', patterns: [/confident/i, /powerful/i, /bold/i, /strong/i, /boardroom/i] },
  { mood: 'soft', patterns: [/soft/i, /romantic/i, /tender/i, /feminine/i] },
  { mood: 'seductive', patterns: [/seductive/i, /alluring/i, /after dark/i, /sexy/i] },
  { mood: 'oldMoney', patterns: [/old money/i, /heritage/i, /understated/i, /quiet luxury/i] },
  { mood: 'elegant', patterns: [/elegant/i, /refined/i, /sophisticated/i, /grace/i] },
];

const OCCASION_SIGNALS: { occasion: OccasionId; patterns: RegExp[] }[] = [
  { occasion: 'date', patterns: [/date/i, /romantic/i, /first date/i] },
  { occasion: 'gala', patterns: [/gala/i, /ball/i, /black tie/i] },
  { occasion: 'brunch', patterns: [/brunch/i, /lunch/i, /café/i, /cafe/i] },
  { occasion: 'meeting', patterns: [/meeting/i, /work/i, /office/i, /boardroom/i] },
  { occasion: 'dinner', patterns: [/dinner/i, /restaurant/i, /nişantaşı/i, /nisantasi/i] },
  { occasion: 'evening', patterns: [/evening/i, /tonight/i, /club/i, /bodrum/i, /beach/i, /party/i] },
];

export function parseIntent(raw: string): ParsedIntent {
  const text = raw.trim();
  const lower = text.toLowerCase();

  let mood: MoodId = 'elegant';
  for (const signal of MOOD_SIGNALS) {
    if (signal.patterns.some((p) => p.test(lower))) {
      mood = signal.mood;
      break;
    }
  }

  let occasion: OccasionId = 'evening';
  for (const signal of OCCASION_SIGNALS) {
    if (signal.patterns.some((p) => p.test(lower))) {
      occasion = signal.occasion;
      break;
    }
  }

  const label = text.length > 0 ? text : 'Evening out';
  return { mood, occasion, label };
}

export const INTENT_SUGGESTIONS = [
  'Dinner in Nişantaşı tonight',
  'I want to feel confident',
  'Beach club in Bodrum',
  'Romantic date',
  'Minimal and powerful',
];
