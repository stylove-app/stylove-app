/**
 * Premium-exclusive Stylove privileges.
 * UI copy lives in i18n; recommendation payloads can later swap to API/affiliate feeds.
 */

export type PremiumPrivilegeId = 'fragrance' | 'venues' | 'shopping';

export type PremiumPrivilege = {
  id: PremiumPrivilegeId;
  icon: 'sparkles-outline' | 'location-outline' | 'diamond-outline';
};

export const PREMIUM_PRIVILEGES: PremiumPrivilege[] = [
  { id: 'fragrance', icon: 'sparkles-outline' },
  { id: 'venues', icon: 'location-outline' },
  { id: 'shopping', icon: 'diamond-outline' },
];

/** Connect real fragrance API / affiliate catalog here. */
export function getFragranceRecommendations(items: readonly string[]): string[] {
  return [...items];
}

/** Connect venue intelligence API here. */
export function getVenueRecommendations(items: readonly string[]): string[] {
  return [...items];
}

/** Connect luxury shopping / affiliate API here. */
export function getShoppingRecommendations(items: readonly string[]): string[] {
  return [...items];
}

export function getPrivilegeRecommendations(
  id: PremiumPrivilegeId,
  items: readonly string[],
): string[] {
  switch (id) {
    case 'fragrance':
      return getFragranceRecommendations(items);
    case 'venues':
      return getVenueRecommendations(items);
    case 'shopping':
      return getShoppingRecommendations(items);
  }
}
