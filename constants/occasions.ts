import type { OccasionId } from '@/i18n/types';

export const OCCASIONS: OccasionId[] = ['dinner', 'date', 'gala', 'brunch', 'evening', 'meeting'];

export const AFFILIATE_PLACEHOLDERS = [
  {
    id: 'shoes',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80',
    labelKey: 'shoes' as const,
  },
  {
    id: 'accessories',
    image: 'https://images.unsplash.com/photo-1611591434697-8bf2ee5475a2?w=400&q=80',
    labelKey: 'accessories' as const,
  },
  {
    id: 'watches',
    image: 'https://images.unsplash.com/photo-1524805440900-6a0837637c47?w=400&q=80',
    labelKey: 'watches' as const,
  },
  {
    id: 'perfume',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80',
    labelKey: 'perfume' as const,
  },
];
