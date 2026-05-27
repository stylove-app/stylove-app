import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/locale-context';
import { DEFAULT_AVATAR_URI } from '@/constants/default-avatar';
import { EMPTY_USER_PROFILE, type UserProfile } from '@/lib/user-profile';
import {
  GUEST_STORAGE_SCOPE,
  readScopedProfile,
  writeScopedProfile,
} from '@/lib/user-scoped-storage';
import { ensureProfileRow, upsertProfile } from '@/services/profile-db';

export type { UserProfile } from '@/lib/user-profile';
export { EMPTY_USER_PROFILE } from '@/lib/user-profile';

export const USER_PROFILE_KEY = '@stylove/user-profile';

function buildDisplayName(profile: UserProfile, fallback: string): string {
  const full = [profile.firstName.trim(), profile.lastName.trim()].filter(Boolean).join(' ');
  return full || fallback;
}

type UserProfileContextValue = {
  profile: UserProfile;
  ready: boolean;
  displayName: string;
  avatarUri: string;
  updateProfile: (next: UserProfile) => Promise<void>;
  saveProfile: (next: UserProfile) => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

type UserProfileProviderProps = {
  children: React.ReactNode;
};

export function UserProfileProvider({ children }: UserProfileProviderProps) {
  const t = useTranslation();
  const { userId, ready: authReady, isRegistered } = useAuth();
  const defaultGuestName = t.profile.displayName;
  const [profile, setProfile] = useState<UserProfile>(EMPTY_USER_PROFILE);
  const [ready, setReady] = useState(false);

  const storageScope = isRegistered && userId ? userId : GUEST_STORAGE_SCOPE;

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;
    setReady(false);
    setProfile(EMPTY_USER_PROFILE);

    const load = async () => {
      if (!isRegistered || !userId) {
        const guestProfile = await readScopedProfile(GUEST_STORAGE_SCOPE);
        if (!cancelled) {
          setProfile(guestProfile);
          setReady(true);
        }
        return;
      }

      try {
        const remote = await ensureProfileRow(userId);
        if (!cancelled) {
          setProfile(remote);
          await writeScopedProfile(userId, remote);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setProfile(EMPTY_USER_PROFILE);
          setReady(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authReady, userId, isRegistered]);

  const updateProfile = useCallback(async (next: UserProfile) => {
    setProfile(next);
  }, []);

  const saveProfile = useCallback(
    async (next: UserProfile) => {
      setProfile(next);
      await writeScopedProfile(storageScope, next);
      if (isRegistered && userId) {
        try {
          await upsertProfile(userId, next);
        } catch {
          // local copy already saved
        }
      }
    },
    [userId, isRegistered, storageScope],
  );

  const displayName = buildDisplayName(profile, defaultGuestName);
  const avatarUri = profile.photoUri ?? DEFAULT_AVATAR_URI;

  const value = useMemo(
    () => ({
      profile,
      ready,
      displayName,
      avatarUri,
      updateProfile,
      saveProfile,
    }),
    [profile, ready, displayName, avatarUri, updateProfile, saveProfile, defaultGuestName],
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
}
