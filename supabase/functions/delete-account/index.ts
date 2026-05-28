import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STORAGE_BUCKETS = ['wardrobe-originals', 'wardrobe-cleaned'] as const;
const STORAGE_LIST_LIMIT = 100;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function removeUserStorageFolder(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  userId: string,
) {
  while (true) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(userId, { limit: STORAGE_LIST_LIMIT, offset: 0 });

    if (error) throw error;
    if (!data || data.length === 0) return;

    const paths = data
      .filter((object) => object.name)
      .map((object) => `${userId}/${object.name}`);

    if (paths.length > 0) {
      const { error: removeError } = await admin.storage.from(bucket).remove(paths);
      if (removeError) throw removeError;
    }

    if (data.length < STORAGE_LIST_LIMIT) return;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Server configuration incomplete' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const userId = user.id;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    for (const bucket of STORAGE_BUCKETS) {
      await removeUserStorageFolder(admin, bucket, userId);
    }

    const { error: wardrobeError } = await admin
      .from('wardrobe_items')
      .delete()
      .eq('user_id', userId);
    if (wardrobeError) throw wardrobeError;

    const { error: profileError } = await admin
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) throw profileError;

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId, false);
    if (deleteUserError) throw deleteUserError;

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Account deletion failed';
    return jsonResponse({ error: message }, 500);
  }
});
