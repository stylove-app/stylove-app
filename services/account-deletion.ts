import { resetAllLocalCaches } from '@/lib/user-scoped-storage';
import { supabase } from '@/services/supabase';

export async function deleteOwnAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', {
    body: {},
  });

  if (error) throw error;

  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // The Auth user has already been deleted server-side; local cleanup continues.
  }

  await resetAllLocalCaches();
}
