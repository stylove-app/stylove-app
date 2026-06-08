/**
 * Service layer — editorial and commerce integrations.
 */
export { supabase } from '@/services/supabase';
export {
  ensureAuthSession,
  getSession,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  isAnonymousUser,
} from '@/services/auth';
export {
  fetchWardrobeItems,
  createWardrobeItemFromLocalImage,
  deleteWardrobeItem,
  syncLocalWardrobeToRemote,
} from '@/services/wardrobe-db';
export {
  uploadWardrobeOriginal,
  getWardrobeStoragePublicUrl,
  WARDROBE_ORIGINALS_BUCKET,
} from '@/services/wardrobe-storage';
export { fetchProfile, upsertProfile, syncLocalProfileToRemote } from '@/services/profile-db';
export { getTodaysAura, inferWardrobeTone } from '@/lib/aura-engine';
export { computeLuxuryScores, type LuxuryScores } from '@/lib/luxury-scores';
export { inferEventContext, getVenueMoodBias, type EventContext } from '@/lib/event-intelligence';
export { buildEditorialReasoning, type EditorialReasoning } from '@/lib/editorial-reasoning';
export {
  EMPTY_STYLE_MEMORY,
  recordLookGenerated,
  recordLookSaved,
  recordWardrobeItem,
  getSignatureFromMemory,
  type StyleMemory,
} from '@/lib/style-memory';
export {
  restorePurchases,
  type PurchasePlan,
  type PurchaseResult,
} from '@/services/payments';

/** Future: connect fragrance affiliate / catalog API. */
export async function fetchFragranceCatalog(_locale: string): Promise<null> {
  return null;
}

/** Future: connect venue intelligence API. */
export async function fetchVenueGuidance(_destination: string): Promise<null> {
  return null;
}

/** Future: connect luxury shopping affiliate API. */
export async function fetchShoppingSelections(_lookId: string): Promise<null> {
  return null;
}
