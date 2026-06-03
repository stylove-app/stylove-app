import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import type { WardrobeCategoryId } from '@/i18n/types';
import { type WardrobeItem } from '@/lib/outfit-engine';
import { getCategoryForItemType, normalizeWardrobeItems } from '@/lib/wardrobe-item-types';
import { getStylingWardrobe, isDemoWardrobeItem, stripDemoWardrobe } from '@/lib/wardrobe-utils';
import type { WardrobeItemTypeId } from '@/i18n/types';
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

type WardrobeContextValue = {
  items: WardrobeItem[];
  stylingItems: WardrobeItem[];
  addItem: (item: {
    name: string;
    localImageUri: string;
    itemType: WardrobeItemTypeId;
  }) => Promise<WardrobeItem>;
  removeItem: (id: string) => Promise<void>;
  getByCategory: (category: WardrobeCategoryId) => WardrobeItem[];
  ready: boolean;
  loadError: boolean;
  retryLoad: () => Promise<void>;
};

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

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
    async (item: { name: string; localImageUri: string; itemType: WardrobeItemTypeId }) => {
      if (isRegistered && userId) {
        const created = await createWardrobeItemFromLocalImage(userId, {
          name: item.name,
          itemType: item.itemType,
          localImageUri: item.localImageUri,
        });

        const next = [created, ...items];
        await persistLocal(next);
        return created;
      }

      const category = getCategoryForItemType(item.itemType);
      const payload: WardrobeItem = {
        id: `item-${Date.now()}`,
        name: item.name,
        itemType: item.itemType,
        category,
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

  const value = useMemo(
    () => ({
      items: stylingItems,
      stylingItems,
      addItem,
      removeItem,
      getByCategory,
      ready,
      loadError,
      retryLoad,
    }),
    [stylingItems, addItem, removeItem, getByCategory, ready, loadError, retryLoad],
  );

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be used within WardrobeProvider');
  return ctx;
}
