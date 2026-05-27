import type { MoodId } from '@/i18n/types';

export const AURA_BY_TIME = {
  morning: [
    'Quiet clarity with composed intention.',
    'Morning poise — soft structure, luminous ease.',
    'Refined awakening — minimal elegance for the day ahead.',
  ],
  afternoon: [
    'Effortless sophistication in daylight.',
    'Polished ease — confidence without announcement.',
    'Afternoon edit — balanced, breathable, assured.',
  ],
  evening: [
    'Quiet luxury with confident energy.',
    'Minimal elegance for tonight.',
    'Evening poise — cinematic, composed, unmistakably yours.',
  ],
  night: [
    'After-dark allure with restrained power.',
    'Nocturnal confidence — editorial and intimate.',
    'Midnight edit — bold silence, golden restraint.',
  ],
} as const;

export const AURA_BY_TONE: Record<MoodId, string[]> = {
  elegant: [
    'Quiet luxury with confident energy.',
    'Refined evening poise — silk hour energy.',
    'Elegant restraint that speaks before you do.',
  ],
  soft: [
    'Tender luminosity — romance in muted tones.',
    'Soft grace for an intimate evening.',
    'Blush-hour energy — gentle, magnetic, true.',
  ],
  confident: [
    'Decisive lines, quiet power.',
    'Confident energy — structured, assured, modern.',
    'Bold silence — presence without spectacle.',
  ],
  oldMoney: [
    'Quiet luxury — heritage poise, zero excess.',
    'Understated fortune — timeless, never trendy.',
    'Old-world refinement for a new evening.',
  ],
  seductive: [
    'Controlled allure — suggestion over statement.',
    'After-dark magnetism with editorial restraint.',
    'Sensual poise — tension, drape, intention.',
  ],
  minimal: [
    'Minimal elegance for tonight.',
    'Pure form — every element essential.',
    'Restraint as the ultimate luxury.',
  ],
};

export const EDITORIAL_COLOR_HARMONY: Record<MoodId, string[]> = {
  elegant: [
    'Champagne and burgundy move in tonal dialogue — warm depth against cool poise.',
    'Ivory and gold accents create luminous contrast without breaking harmony.',
  ],
  soft: [
    'Blush and cream layers breathe together — intimate, never saccharine.',
    'Muted rose tones against ivory create soft-focus romance.',
  ],
  confident: [
    'Noir and camel in sharp proportion — authority with warmth.',
    'Monochrome base with a single gold accent — focus, not flash.',
  ],
  oldMoney: [
    'Camel, navy, and ivory — the heritage palette of quiet fortune.',
    'Neutral tones in perfect proportion; nothing competes, everything complements.',
  ],
  seductive: [
    'Wine and black in deliberate tension — allure through contrast.',
    'Deep burgundy against skin-toned neutrals — intimacy in shadow.',
  ],
  minimal: [
    'Monochrome ivory to charcoal — distraction eliminated, presence amplified.',
    'Single-tone layering creates depth through texture, not color.',
  ],
};

export const EDITORIAL_EMOTIONAL_TONE: Record<MoodId, string[]> = {
  elegant: ['The mood reads refined and self-assured — evening femininity without effort.'],
  soft: ['Emotional register: tender, graceful, quietly magnetic.'],
  confident: ['Projects authority and composure — power dressed in poetry.'],
  oldMoney: ['Signals taste that transcends trends — the quiet mark of true luxury.'],
  seductive: ['Controlled tension — allure lives in what is suggested, not shown.'],
  minimal: ['Restraint creates space for your presence to become the statement.'],
};

export const EDITORIAL_SILHOUETTE: Record<MoodId, string[]> = {
  elegant: [
    'Elongated proportions and clean vertical lines refine the silhouette.',
    'Balanced volume — structured top, fluid base — creates editorial poise.',
  ],
  soft: [
    'Fluid lines follow the body gently — romance through movement, not volume.',
    'Soft drape creates intimacy while maintaining graceful structure.',
  ],
  confident: [
    'Structured shoulders and defined waist project presence with precision.',
    'Sharp tailoring balanced by one soft element — power without aggression.',
  ],
  oldMoney: [
    'Classic proportions — nothing trendy, everything timeless.',
    'Understated fit that whispers rather than announces.',
  ],
  seductive: [
    'Controlled reveals and deliberate drape create editorial tension.',
    'The silhouette follows natural lines while maintaining mystery.',
  ],
  minimal: [
    'Clean lines and essential volume — every proportion intentional.',
    'When nothing is excess, silhouette becomes the entire statement.',
  ],
};

export const MISSING_NOTES = {
  watches: ['A slim gold timepiece completes the quiet-luxury register.'],
  rings: ['A single statement ring — refinement in miniature.'],
  shoes: ['The right heel height transforms posture and presence.'],
  perfume: ['Scent is the invisible layer of your edit.'],
  bags: ['A structured clutch anchors the composition.'],
} as const;
