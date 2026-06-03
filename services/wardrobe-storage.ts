import { supabase } from '@/services/supabase';

export const WARDROBE_ORIGINALS_BUCKET = 'wardrobe-originals';

/** Orphan object cleanup for legacy storage paths (best-effort on item removal). */
const LEGACY_STORAGE_BUCKET = 'wardrobe-cleaned';

export function wardrobeOriginalPath(userId: string, itemId: string): string {
  return `${userId}/${itemId}.jpg`;
}

function wardrobeLegacyCleanedPath(userId: string, itemId: string): string {
  return `${userId}/${itemId}.png`;
}

export function getWardrobeStoragePublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function localUriToArrayBuffer(localUri: string): Promise<ArrayBuffer> {
  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error('Could not read the selected image');
  }
  return response.arrayBuffer();
}

/** Uploads the user's photo to wardrobe-originals. */
export async function uploadWardrobeOriginal(
  userId: string,
  itemId: string,
  localUri: string,
): Promise<{ path: string; publicUrl: string }> {
  const path = wardrobeOriginalPath(userId, itemId);
  const bytes = await localUriToArrayBuffer(localUri);

  const { error } = await supabase.storage.from(WARDROBE_ORIGINALS_BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) throw error;

  return {
    path,
    publicUrl: getWardrobeStoragePublicUrl(WARDROBE_ORIGINALS_BUCKET, path),
  };
}

export async function deleteWardrobeStorageObjects(userId: string, itemId: string): Promise<void> {
  const originalPath = wardrobeOriginalPath(userId, itemId);
  const legacyCleanedPath = wardrobeLegacyCleanedPath(userId, itemId);
  await Promise.all([
    supabase.storage.from(WARDROBE_ORIGINALS_BUCKET).remove([originalPath]),
    supabase.storage.from(LEGACY_STORAGE_BUCKET).remove([legacyCleanedPath]),
  ]);
}
