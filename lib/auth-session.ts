import type { User } from '@supabase/supabase-js';

/** Email/password (or other permanent) account — not anonymous guest. */
export function isRegisteredAccount(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.is_anonymous === true) return false;
  if (user.is_anonymous === false) return true;
  return Boolean(user.email?.trim());
}
