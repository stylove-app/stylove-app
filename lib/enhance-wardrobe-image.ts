/**
 * @deprecated Server-side processing via Supabase Edge Function + Storage.
 * Guest/offline uploads use local URIs directly in WardrobeProvider.
 */
export type EnhancedWardrobeImage = {
  originalUri: string;
  displayUri: string;
  backgroundRemoved: boolean;
};
