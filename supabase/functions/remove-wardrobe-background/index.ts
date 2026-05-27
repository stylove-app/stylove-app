import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REMOVE_BG_URL = 'https://api.remove.bg/v1.0/removebg';
const ORIGINALS_BUCKET = 'wardrobe-originals';
const CLEANED_BUCKET = 'wardrobe-cleaned';

type WardrobeRow = {
  id: string;
  user_id: string;
  original_image_uri: string | null;
  processing_status: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return publicUrl.slice(index + marker.length);
}

function buildPublicUrl(supabaseUrl: string, bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const removeBgKey = Deno.env.get('REMOVE_BG_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!removeBgKey || !supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server configuration incomplete' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let itemId: string;
  try {
    const body = await req.json();
    itemId = body?.itemId;
    if (!itemId || typeof itemId !== 'string') {
      return jsonResponse({ error: 'itemId is required' }, 400);
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: item, error: itemError } = await admin
    .from('wardrobe_items')
    .select('id, user_id, original_image_uri, processing_status')
    .eq('id', itemId)
    .single();

  if (itemError || !item) {
    return jsonResponse({ error: 'Wardrobe item not found' }, 404);
  }

  const row = item as WardrobeRow;
  if (row.user_id !== user.id) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const storagePath =
    parseStoragePath(row.original_image_uri ?? '', ORIGINALS_BUCKET) ??
    `${row.user_id}/${row.id}.jpg`;

  await admin
    .from('wardrobe_items')
    .update({ processing_status: 'processing', processing_error: null })
    .eq('id', itemId);

  try {
    const { data: originalFile, error: downloadError } = await admin.storage
      .from(ORIGINALS_BUCKET)
      .download(storagePath);

    if (downloadError || !originalFile) {
      throw new Error(downloadError?.message ?? 'Failed to download original image');
    }

    const imageBytes = await originalFile.arrayBuffer();
    const formData = new FormData();
    formData.append('image_file', new Blob([imageBytes], { type: 'image/jpeg' }), 'wardrobe.jpg');
    formData.append('size', 'auto');
    formData.append('type', 'product');

    const removeBgResponse = await fetch(REMOVE_BG_URL, {
      method: 'POST',
      headers: { 'X-Api-Key': removeBgKey },
      body: formData,
    });

    if (!removeBgResponse.ok) {
      const detail = await removeBgResponse.text();
      throw new Error(`remove.bg ${removeBgResponse.status}: ${detail.slice(0, 200)}`);
    }

    const cleanedBytes = await removeBgResponse.arrayBuffer();
    const cleanedPath = `${row.user_id}/${row.id}.png`;

    const { error: uploadError } = await admin.storage.from(CLEANED_BUCKET).upload(cleanedPath, cleanedBytes, {
      contentType: 'image/png',
      upsert: true,
    });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const cleanedImageUri = buildPublicUrl(supabaseUrl, CLEANED_BUCKET, cleanedPath);

    const { error: updateError } = await admin
      .from('wardrobe_items')
      .update({
        cleaned_image_uri: cleanedImageUri,
        image_uri: cleanedImageUri,
        processing_status: 'done',
        processing_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return jsonResponse({ itemId, status: 'done', cleanedImageUri });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Background removal failed';

    await admin
      .from('wardrobe_items')
      .update({
        processing_status: 'failed',
        processing_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    return jsonResponse({ itemId, status: 'failed', error: message }, 200);
  }
});
