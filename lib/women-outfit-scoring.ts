import type { ItemStylingProfile } from '@/lib/outfit-styling-intelligence';
import type { SelectedOccasionId } from '@/lib/selected-occasion';
import type { WardrobeStyleProfile } from '@/lib/wardrobe-style-profile';
import { formalityScore, getEffectiveStyleProfile } from '@/lib/wardrobe-style-profile';
import type { WardrobeItem } from '@/lib/outfit-engine';

const SPORTY_CATEGORIES = new Set([
  't_shirt',
  'sneaker',
  'shorts',
  'crop_top',
]);

const OFFICE_BOOST = new Set([
  'blouse',
  'shirt',
  'blazer',
  'tailored_trousers',
  'skirt',
  'office_dress',
  'midi_dress',
  'loafer',
  'heel',
]);

const EVENING_BOOST = new Set([
  'evening_dress',
  'midi_dress',
  'blouse',
  'skirt',
  'blazer',
  'heel',
  'boot',
  'bag',
  'necklace',
  'earrings',
]);

const BEACH_BOOST = new Set(['summer_dress', 'shorts', 'sandal', 'sneaker', 'flat', 't_shirt']);
const BEACH_BAN = new Set(['evening_dress', 'heel', 'blazer', 'office_dress']);

const WEDDING_BOOST = new Set([
  'evening_dress',
  'midi_dress',
  'heel',
  'bag',
  'necklace',
  'earrings',
  'blazer',
]);
const WEDDING_BAN = new Set(['sneaker', 't_shirt', 'shorts', 'crop_top']);

export function scoreWomenPieceForOccasion(
  item: WardrobeItem,
  profile: ItemStylingProfile,
  occasion: SelectedOccasionId,
): number {
  const style = getEffectiveStyleProfile(item);
  let score = 0;
  const cat = style.category;
  const tags = new Set(style.styleTags);
  const useCases = new Set(style.useCases);
  const formality = formalityScore(style.formality);

  switch (occasion) {
    case 'daily':
      if (tags.has('casual') || tags.has('smart_casual') || tags.has('minimal')) score += 6;
      if (['sneaker', 'flat', 'loafer'].includes(cat)) score += 4;
      if (formality <= 0.6) score += 2;
      break;
    case 'office':
      if (OFFICE_BOOST.has(cat)) score += 8;
      if (tags.has('office') || useCases.has('office')) score += 5;
      if (SPORTY_CATEGORIES.has(cat) || tags.has('sporty')) score -= 12;
      if (formality >= 0.7) score += 4;
      break;
    case 'dinner':
    case 'date':
      if (EVENING_BOOST.has(cat)) score += 7;
      if (tags.has('elegant') || tags.has('romantic') || tags.has('evening')) score += 6;
      if (useCases.has('dinner') || useCases.has('date')) score += 4;
      if (SPORTY_CATEGORIES.has(cat)) score -= 10;
      break;
    case 'shopping':
    case 'sport_walk':
      if (['sneaker', 'flat', 'sandal'].includes(cat)) score += 7;
      if (useCases.has('walking') || useCases.has('shopping')) score += 2;
      if (cat === 'heel') score -= 8;
      if (tags.has('sporty') || useCases.has('walking')) score += 4;
      break;
    case 'coffee':
      if (tags.has('smart_casual') || tags.has('casual')) score += 5;
      if (['blouse', 'shirt', 'midi_dress', 'jeans'].includes(cat)) score += 3;
      break;
    case 'beach':
      if (BEACH_BOOST.has(cat) || tags.has('vacation')) score += 7;
      if (style.season === 'summer') score += 3;
      if (BEACH_BAN.has(cat)) score -= 15;
      break;
    case 'vacation':
      if (tags.has('vacation') || useCases.has('vacation') || useCases.has('beach')) score += 6;
      if (['summer_dress', 'shorts', 'sandal', 'sneaker'].includes(cat)) score += 5;
      break;
    case 'wedding':
      if (WEDDING_BOOST.has(cat)) score += 9;
      if (tags.has('elegant') || tags.has('evening') || useCases.has('wedding')) score += 6;
      if (WEDDING_BAN.has(cat)) score -= 20;
      break;
    case 'travel':
      if (['sneaker', 'flat', 'boot', 'jacket'].includes(cat)) score += 5;
      if (tags.has('casual') || tags.has('smart_casual')) score += 3;
      break;
    case 'family_visit':
      if (tags.has('smart_casual') || tags.has('classic')) score += 5;
      if (useCases.has('daily') || useCases.has('office')) score += 2;
      if (SPORTY_CATEGORIES.has(cat)) score -= 4;
      break;
    default:
      break;
  }

  if (style.isStatementPiece && (occasion === 'date' || occasion === 'dinner' || occasion === 'wedding')) {
    score += 2;
  }

  if (profile.tone && style.colorFamily !== 'neutral') {
    score += 1;
  }

  return score;
}

export function scoreWomenProfileCoherence(
  profiles: ItemStylingProfile[],
  items: WardrobeItem[],
  occasion: SelectedOccasionId,
): number {
  let total = 0;
  for (let i = 0; i < profiles.length; i++) {
    total += scoreWomenPieceForOccasion(items[i], profiles[i], occasion);
  }
  return total / Math.max(1, profiles.length);
}
