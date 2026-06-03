import type { MoodId } from '@/i18n/types';

export const AURA_BY_TIME = {
  morning: [
    'Quiet clarity.',
    'Soft structure, luminous ease.',
    'Minimal elegance for the day.',
  ],
  afternoon: [
    'Effortless sophistication.',
    'Polished ease — assured.',
    'Balanced, breathable, assured.',
  ],
  evening: [
    'Quiet luxury, confident energy.',
    'Minimal elegance for tonight.',
    'Cinematic, composed, yours.',
  ],
  night: [
    'After-dark allure.',
    'Nocturnal confidence.',
    'Bold silence, golden restraint.',
  ],
} as const;

export const AURA_BY_TONE: Record<MoodId, string[]> = {
  elegant: [
    'Quiet luxury, confident energy.',
    'Refined evening poise.',
    'Elegant restraint.',
  ],
  soft: [
    'Tender luminosity.',
    'Soft grace for evening.',
    'Blush-hour energy.',
  ],
  confident: [
    'Decisive lines, quiet power.',
    'Structured, assured, modern.',
    'Bold silence.',
  ],
  oldMoney: [
    'Quiet luxury — heritage poise.',
    'Understated fortune.',
    'Old-world refinement.',
  ],
  seductive: [
    'Controlled allure.',
    'After-dark magnetism.',
    'Sensual poise.',
  ],
  minimal: [
    'Minimal elegance for tonight.',
    'Pure form — essential.',
    'Restraint as luxury.',
  ],
};

export const EDITORIAL_COLOR_HARMONY: Record<MoodId, string[]> = {
  elegant: ['Champagne and burgundy in tonal dialogue.'],
  soft: ['Blush and cream — intimate, never sweet.'],
  confident: ['Noir and camel — authority with warmth.'],
  oldMoney: ['Camel, navy, ivory — quiet fortune.'],
  seductive: ['Wine and black — allure through contrast.'],
  minimal: ['Ivory to charcoal — presence amplified.'],
};

export const EDITORIAL_EMOTIONAL_TONE: Record<MoodId, string[]> = {
  elegant: ['Refined, self-assured evening femininity.'],
  soft: ['Tender, graceful, quietly magnetic.'],
  confident: ['Authority and composure.'],
  oldMoney: ['Taste beyond trends.'],
  seductive: ['Allure in what is suggested.'],
  minimal: ['Your presence is the statement.'],
};

export const EDITORIAL_SILHOUETTE: Record<MoodId, string[]> = {
  elegant: ['Clean vertical lines refine the silhouette.'],
  soft: ['Fluid lines — romance through movement.'],
  confident: ['Structured shoulders, defined waist.'],
  oldMoney: ['Classic proportions — timeless.'],
  seductive: ['Controlled drape, editorial tension.'],
  minimal: ['Clean lines — every proportion intentional.'],
};

export const MISSING_NOTES = {
  watches: ['A slim gold timepiece completes the register.'],
  rings: ['One statement ring — refinement in miniature.'],
  shoes: ['The right heel transforms posture.'],
  perfume: ['Scent — the invisible layer.'],
  bags: ['A structured clutch anchors the edit.'],
} as const;
