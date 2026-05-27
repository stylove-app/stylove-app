import { EMPTY_USER_PROFILE, type UserProfile } from '@/lib/user-profile';
import { supabase } from '@/services/supabase';

type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  photo_uri: string | null;
};

function rowToProfile(row: ProfileRow): UserProfile {
  return {
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    username: row.username ?? '',
    photoUri: row.photo_uri,
  };
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, username, photo_uri')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToProfile(data as ProfileRow);
}

export async function upsertProfile(userId: string, profile: UserProfile): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    first_name: profile.firstName,
    last_name: profile.lastName,
    username: profile.username,
    photo_uri: profile.photoUri,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function ensureProfileRow(userId: string): Promise<UserProfile> {
  const existing = await fetchProfile(userId);
  if (existing) return existing;

  const { error } = await supabase.from('profiles').insert({ id: userId });
  if (error && error.code !== '23505') throw error;

  return { ...EMPTY_USER_PROFILE };
}

export async function syncLocalProfileToRemote(
  userId: string,
  localProfile: UserProfile,
): Promise<UserProfile> {
  const remote = await fetchProfile(userId);
  const localHasData =
    localProfile.firstName.trim() ||
    localProfile.lastName.trim() ||
    localProfile.username.trim() ||
    localProfile.photoUri;

  if (remote && !localHasData) return remote;
  if (localHasData) {
    await upsertProfile(userId, localProfile);
    return localProfile;
  }
  return remote ?? (await ensureProfileRow(userId));
}
