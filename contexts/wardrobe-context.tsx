import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import type { WardrobeCategoryId, WardrobeItemTypeId } from '@/i18n/types';
import type { WardrobeStyleProfile } from '@/lib/wardrobe-style-profile';
import { deriveEngineCategoryFromProfile } from '@/lib/wardrobe-style-profile';
import { type WardrobeItem } from '@/lib/outfit-engine';
import { normalizeWardrobeItems } from '@/lib/wardrobe-item-types';
import { getStylingWardrobe, isDemoWardrobeItem, stripDemoWardrobe } from '@/lib/wardrobe-utils';
import {
  GUEST_STORAGE_SCOPE,
  readScopedWardrobe,
  writeScopedWardrobe,
} from '@/lib/user-scoped-storage';
import {
  createWardrobeItemFromLocalImage,
  deleteWardrobeItem,
  fetchWardrobeItems,
} from '@/services/wardrobe-db';

type WardrobeStateValue = {
  items: WardrobeItem[];
  stylingItems: WardrobeItem[];
  ready: boolean;
  loadError: boolean;
};

type WardrobeActionsValue = {
  addItem: (item: {
    name: string;
    localImageUri: string;
    itemType: WardrobeItemTypeId;
    styleProfile: WardrobeStyleProfile;
  }) => Promise<WardrobeItem>;
  removeItem: (id: string) => Promise<void>;
  getByCategory: (category: WardrobeCategoryId) => WardrobeItem[];
  retryLoad: () => Promise<void>;
};

const WardrobeStateContext = createContext<WardrobeStateValue | null>(null);
const WardrobeActionsContext = createContext<WardrobeActionsValue | null>(null);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const { userId, ready: authReady, isRegistered } = useAuth();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const storageScope = isRegistered && userId ? userId : GUEST_STORAGE_SCOPE;

  const persistLocal = useCallback(
    async (next: WardrobeItem[]) => {
      const cleaned = normalizeWardrobeItems(stripDemoWardrobe(next));
      setItems(cleaned);
      await writeScopedWardrobe(storageScope, cleaned);
    },
    [storageScope],
  );

  const loadRegisteredWardrobe = useCallback(
    async (cancelled: () => boolean) => {
      if (!isRegistered || !userId) return;

      try {
        const remote = await fetchWardrobeItems(userId);
        const cleaned = normalizeWardrobeItems(stripDemoWardrobe(remote));
        if (cancelled()) return;
        setItems(cleaned);
        setLoadError(false);
        await writeScopedWardrobe(userId, cleaned);
      } catch {
        if (cancelled()) return;
        setItems([]);
        setLoadError(true);
      }
    },
    [isRegistered, userId],
  );

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;
    setReady(false);
    setLoadError(false);
    setItems([]);

    const load = async () => {
      if (!isRegistered || !userId) {
        const guestLocal = await readScopedWardrobe(GUEST_STORAGE_SCOPE);
        if (!cancelled) {
          setItems(guestLocal);
          setLoadError(false);
          setReady(true);
        }
        return;
      }

      await loadRegisteredWardrobe(() => cancelled);
      if (!cancelled) setReady(true);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authReady, userId, isRegistered, loadRegisteredWardrobe]);

  const retryLoad = useCallback(async () => {
    if (!isRegistered || !userId) return;
    setReady(false);
    setLoadError(false);
    await loadRegisteredWardrobe(() => false);
    setReady(true);
  }, [isRegistered, userId, loadRegisteredWardrobe]);

  const addItem = useCallback(
    async (item: {
      name: string;
      localImageUri: string;
      itemType: WardrobeItemTypeId;
      styleProfile: WardrobeStyleProfile;
    }) => {
      if (isRegistered && userId) {
        const created = await createWardrobeItemFromLocalImage(userId, {
          name: item.name,
          itemType: item.itemType,
          styleProfile: item.styleProfile,
          localImageUri: item.localImageUri,
        });

        const next = [created, ...items];
        await persistLocal(next);
        return created;
      }

      const category = deriveEngineCategoryFromProfile(item.styleProfile);
      const payload: WardrobeItem = {
        id: `item-${Date.now()}`,
        name: item.name,
        itemType: item.itemType,
        category,
        styleProfile: item.styleProfile,
        originalImageUri: item.localImageUri,
        imageUri: item.localImageUri,
        createdAt: Date.now(),
      };

      if (isDemoWardrobeItem(payload)) {
        throw new Error('Demo wardrobe items cannot be saved');
      }

      await persistLocal([payload, ...items]);
      return payload;
    },
    [userId, isRegistered, items, persistLocal],
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (isRegistered && userId) {
        await deleteWardrobeItem(userId, id);
      }
      await persistLocal(items.filter((item) => item.id !== id));
    },
    [userId, isRegistered, items, persistLocal],
  );

  const stylingItems = useMemo(() => getStylingWardrobe(items), [items]);

  const getByCategory = useCallback(
    (category: WardrobeCategoryId) => stylingItems.filter((item) => item.category === category),
    [stylingItems],
  );

  const stateValue = useMemo<WardrobeStateValue>(
    () => ({
      items: stylingItems,
      stylingItems,
      ready,
      loadError,
    }),
    [stylingItems, ready, loadError],
  );

  const actionsValue = useMemo<WardrobeActionsValue>(
    () => ({
      addItem,
      removeItem,
      getByCategory,
      retryLoad,
    }),
    [addItem, removeItem, getByCategory, retryLoad],
  );

  return (
    <WardrobeStateContext.Provider value={stateValue}>
      <WardrobeActionsContext.Provider value={actionsValue}>{children}</WardrobeActionsContext.Provider>
    </WardrobeStateContext.Provider>
  );
}

/** Read-only wardrobe state — avoids re-renders when only mutations change elsewhere. */
export function useWardrobeState() {
  const ctx = useContext(WardrobeStateContext);
  if (!ctx) throw new Error('useWardrobeState must be used within WardrobeProvider');
  return ctx;
}

/** Wardrobe mutations — subscribe only on screens that save/remove. */
export function useWardrobeActions() {
  const ctx = useContext(WardrobeActionsContext);
  if (!ctx) throw new Error('useWardrobeActions must be used within WardrobeProvider');
  return ctx;
}

export function useWardrobe(): WardrobeStateValue & WardrobeActionsValue {
  return { ...useWardrobeState(), ...useWardrobeActions() };
}
