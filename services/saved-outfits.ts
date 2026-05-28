import type { CuratedLook } from '@/lib/outfit-engine';
import { supabase } from '@/services/supabase';

type SavedOutfitRow = {
  id: string;
  title: string | null;
  occasion: string | null;
  category: string | null;
  outfit_json: CuratedLook | null;
  favorite: boolean | null;
  created_at: string | null;
};

const SAVED_OUTFIT_SELECT = 'id, title, occasion, category, outfit_json, favorite, created_at';

function logSavedOutfitError(action: string, error: unknown, context?: Record<string, unknown>) {
  if (!__DEV__) return;
  console.error('[saved_outfits]', action, {
    error,
    ...context,
  });
}

function toJsonSafeLook(look: CuratedLook): CuratedLook {
  return JSON.parse(JSON.stringify({
    ...look,
    saved: true,
  })) as CuratedLook;
}

function safeCreatedAt(row: SavedOutfitRow): number {
  const rowTime = row.created_at ? new Date(row.created_at).getTime() : NaN;
  if (Number.isFinite(rowTime)) return rowTime;
  const outfitTime = row.outfit_json?.createdAt;
  return Number.isFinite(outfitTime) ? (outfitTime as number) : Date.now();
}

function rowToLook(row: SavedOutfitRow): CuratedLook {
  const source = row.outfit_json ?? ({} as Partial<CuratedLook>);
  const completeOutfit = Array.isArray(source.completeOutfit) ? source.completeOutfit : [];
  const itemIds = Array.isArray(source.itemIds) && source.itemIds.length > 0
    ? source.itemIds
    : completeOutfit.map((piece) => piece.item?.id).filter((id): id is string => Boolean(id));

  return {
    ...source,
    id: row.id,
    title: row.title ?? source.title ?? 'Kaydedilen stil',
    occasion: row.occasion ?? source.occasion ?? row.category ?? 'Seçili görünüm',
    description: source.description ?? source.whyThisWorks ?? '',
    eleganceScore: source.eleganceScore ?? 0,
    luxuryScores: source.luxuryScores ?? {
      elegance: 0,
      confidence: 0,
      minimalism: 0,
      nightEnergy: 0,
      streetLuxury: 0,
    },
    vibes: Array.isArray(source.vibes) ? source.vibes : [],
    image: source.image ?? completeOutfit[0]?.item?.imageUri ?? '',
    mood: source.mood ?? 'elegant',
    itemIds,
    completeOutfit,
    archiveCategory: row.category ?? source.archiveCategory,
    saved: row.favorite ?? true,
    createdAt: safeCreatedAt(row),
  };
}

async function withRetry<T>(operation: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Saved looks request failed');
}

export async function fetchSavedOutfits(userId: string): Promise<CuratedLook[]> {
  const { data, error } = await withRetry(async () =>
    supabase
      .from('saved_outfits')
      .select(SAVED_OUTFIT_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  );

  if (error) {
    logSavedOutfitError('fetch failed', error, { userId });
    throw error;
  }
  return (data ?? []).map((row) => rowToLook(row as SavedOutfitRow));
}

export async function createSavedOutfit(userId: string, look: CuratedLook): Promise<CuratedLook> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const sessionUserId = authData.user?.id ?? null;

  if (authError || !sessionUserId) {
    logSavedOutfitError('auth user missing before insert', authError, { userId, sessionUserId });
    throw authError ?? new Error('Authenticated user is required to save looks');
  }

  if (sessionUserId !== userId) {
    logSavedOutfitError('auth user mismatch before insert', null, { userId, sessionUserId });
  }

  const savedLook = toJsonSafeLook(look);
  const insertPayload = {
    user_id: sessionUserId,
    title: savedLook.title,
    occasion: savedLook.occasion,
    category: savedLook.archiveCategory ?? null,
    outfit_json: savedLook,
    favorite: true,
  };
  const { data, error } = await supabase
    .from('saved_outfits')
    .insert(insertPayload)
    .select(SAVED_OUTFIT_SELECT)
    .single();

  if (error || !data) {
    logSavedOutfitError('insert failed', error, {
      userId,
      sessionUserId,
      payloadColumns: Object.keys(insertPayload),
      outfitId: savedLook.id,
    });
    throw error ?? new Error('Saved look could not be created');
  }
  return rowToLook(data as SavedOutfitRow);
}

export async function deleteSavedOutfit(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('saved_outfits').delete().eq('user_id', userId).eq('id', id);
  if (error) {
    logSavedOutfitError('delete failed', error, { userId, id });
    throw error;
  }
}

export async function updateSavedOutfitCategory(
  userId: string,
  id: string,
  category: string,
): Promise<CuratedLook> {
  const { data, error } = await supabase
    .from('saved_outfits')
    .update({ category })
    .eq('user_id', userId)
    .eq('id', id)
    .select(SAVED_OUTFIT_SELECT)
    .single();

  if (error || !data) {
    logSavedOutfitError('update category failed', error, { userId, id });
    throw error ?? new Error('Saved look could not be updated');
  }
  return rowToLook(data as SavedOutfitRow);
}
