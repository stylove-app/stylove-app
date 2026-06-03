import type { WardrobeCategoryId } from '@/i18n/types';
import type { WardrobeItem } from '@/lib/outfit-engine';
import { getCategoryForItemType, normalizeWardrobeItems } from '@/lib/wardrobe-item-types';
import { isDemoWardrobeItem, stripDemoWardrobe } from '@/lib/wardrobe-utils';
import { supabase } from '@/services/supabase';
import { deleteWardrobeStorageObjects, uploadWardrobeOriginal } from '@/services/wardrobe-storage';

type WardrobeRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  item_type: string | null;
  image_uri: string;
  original_image_uri: string | null;
  created_at: number;
};

/** Placeholder until Storage upload completes; never shown to user long-term. */
const PENDING_IMAGE_URI = 'pending';

function rowToItem(row: WardrobeRow): WardrobeItem {
  const imageUri = row.original_image_uri ?? row.image_uri;

  return {
    id: row.id,
    name: row.name,
    itemType: (row.item_type ?? row.category) as WardrobeItem['itemType'],
    category: row.category as WardrobeCategoryId,
    originalImageUri: imageUri,
    imageUri,
    createdAt: row.created_at,
  };
}

const WARDROBE_SELECT =
  'id, user_id, name, category, item_type, image_uri, original_image_uri, created_at';

export async function fetchWardrobeItems(userId: string): Promise<WardrobeItem[]> {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select(WARDROBE_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return normalizeWardrobeItems(
    stripDemoWardrobe((data ?? []).map((row) => rowToItem(row as WardrobeRow))),
  );
}

/** Deletes demo/sample rows for this user (idempotent). */
export async function purgeDemoWardrobeItems(userId: string): Promise<void> {
  const { data, error } = await supabase.from('wardrobe_items').select(WARDROBE_SELECT).eq('user_id', userId);

  if (error) throw error;

  const demoIds = (data ?? [])
    .filter((row) => isDemoWardrobeItem(rowToItem(row as WardrobeRow)))
    .map((row) => (row as WardrobeRow).id);

  if (demoIds.length === 0) return;

  const { error: deleteError } = await supabase
    .from('wardrobe_items')
    .delete()
    .eq('user_id', userId)
    .in('id', demoIds);

  if (deleteError) throw deleteError;
}

export type CreateWardrobeItemFromImageInput = {
  name: string;
  itemType: WardrobeItem['itemType'];
  localImageUri: string;
};

/**
 * Inserts a wardrobe row (Supabase-generated UUID), uploads the original to Storage,
 * then updates URIs and marks the item ready for styling.
 */
export async function createWardrobeItemFromLocalImage(
  userId: string,
  input: CreateWardrobeItemFromImageInput,
): Promise<WardrobeItem> {
  const category = getCategoryForItemType(input.itemType);
  const createdAt = Date.now();

  const { data: draft, error: insertError } = await supabase
    .from('wardrobe_items')
    .insert({
      user_id: userId,
      name: input.name,
      category,
      item_type: input.itemType,
      image_uri: PENDING_IMAGE_URI,
      original_image_uri: null,
      cleaned_image_uri: null,
      processing_status: 'done',
      processing_error: null,
      created_at: createdAt,
    })
    .select(WARDROBE_SELECT)
    .single();

  if (insertError || !draft) {
    throw insertError ?? new Error('Failed to create wardrobe item');
  }

  const itemId = (draft as WardrobeRow).id;

  try {
    const { publicUrl } = await uploadWardrobeOriginal(userId, itemId, input.localImageUri);

    const candidate = rowToItem({
      ...(draft as WardrobeRow),
      original_image_uri: publicUrl,
      image_uri: publicUrl,
    });

    if (isDemoWardrobeItem(candidate)) {
      throw new Error('Demo wardrobe items cannot be saved');
    }

    const { data: updated, error: updateError } = await supabase
      .from('wardrobe_items')
      .update({
        original_image_uri: publicUrl,
        image_uri: publicUrl,
        processing_status: 'done',
        processing_error: null,
      })
      .eq('id', itemId)
      .eq('user_id', userId)
      .select(WARDROBE_SELECT)
      .single();

    if (updateError || !updated) {
      throw updateError ?? new Error('Failed to update wardrobe item image');
    }

    return normalizeWardrobeItems([rowToItem(updated as WardrobeRow)])[0];
  } catch (error) {
    try {
      await supabase.from('wardrobe_items').delete().eq('id', itemId).eq('user_id', userId);
      await deleteWardrobeStorageObjects(userId, itemId);
    } catch {
      // best-effort rollback
    }
    throw error;
  }
}

export async function deleteWardrobeItem(userId: string, itemId: string): Promise<void> {
  const { error } = await supabase
    .from('wardrobe_items')
    .delete()
    .eq('user_id', userId)
    .eq('id', itemId);

  if (error) throw error;

  try {
    await deleteWardrobeStorageObjects(userId, itemId);
  } catch {
    // Storage cleanup is best-effort
  }
}

export async function syncLocalWardrobeToRemote(
  userId: string,
  localItems: WardrobeItem[],
): Promise<WardrobeItem[]> {
  await purgeDemoWardrobeItems(userId);
  const remote = await fetchWardrobeItems(userId);
  if (remote.length > 0) return remote;

  return normalizeWardrobeItems(stripDemoWardrobe(localItems));
}
