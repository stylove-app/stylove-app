import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import type { WardrobeCategoryId } from '@/i18n/types';
import { type WardrobeItem } from '@/lib/outfit-engine';
import { isTerminalProcessingStatus } from '@/lib/wardrobe-display';
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
  fetchWardrobeItemById,
  invokeWardrobeBackgroundRemoval,
} from '@/services/wardrobe-db';

const PROCESSING_POLL_MS = 2500;
const PROCESSING_POLL_MAX_MS = 120000;

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
};

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const { userId, ready: authReady, isRegistered } = useAuth();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [ready, setReady] = useState(false);
  const pollTimersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const storageScope = isRegistered && userId ? userId : GUEST_STORAGE_SCOPE;

  const persistLocal = useCallback(
    async (next: WardrobeItem[]) => {
      const cleaned = normalizeWardrobeItems(stripDemoWardrobe(next));
      setItems(cleaned);
      await writeScopedWardrobe(storageScope, cleaned);
    },
    [storageScope],
  );

  const refreshItem = useCallback(
    async (itemId: string) => {
      if (!isRegistered || !userId) return;
      const updated = await fetchWardrobeItemById(userId, itemId);
      if (!updated) return;
      setItems((current) => {
        const next = current.map((item) => (item.id === itemId ? updated : item));
        void writeScopedWardrobe(storageScope, next);
        return next;
      });
    },
    [userId, isRegistered, storageScope],
  );

  const stopPolling = useCallback((itemId: string) => {
    const timer = pollTimersRef.current.get(itemId);
    if (timer) {
      clearInterval(timer);
      pollTimersRef.current.delete(itemId);
    }
  }, []);

  const startPolling = useCallback(
    (itemId: string) => {
      if (!isRegistered || !userId) return;
      stopPolling(itemId);

      const startedAt = Date.now();
      const timer = setInterval(() => {
        void (async () => {
          const updated = await fetchWardrobeItemById(userId, itemId);
          if (updated) {
            setItems((current) => {
              const next = current.map((item) => (item.id === itemId ? updated : item));
              void writeScopedWardrobe(storageScope, next);
              return next;
            });
            if (isTerminalProcessingStatus(updated.processingStatus)) {
              stopPolling(itemId);
            }
          }
          if (Date.now() - startedAt > PROCESSING_POLL_MAX_MS) {
            stopPolling(itemId);
          }
        })();
      }, PROCESSING_POLL_MS);

      pollTimersRef.current.set(itemId, timer);
    },
    [userId, isRegistered, storageScope, stopPolling],
  );

  useEffect(() => {
    return () => {
      pollTimersRef.current.forEach((timer) => clearInterval(timer));
      pollTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;
    pollTimersRef.current.forEach((timer) => clearInterval(timer));
    pollTimersRef.current.clear();
    setReady(false);
    setItems([]);

    const load = async () => {
      if (!isRegistered || !userId) {
        const guestLocal = await readScopedWardrobe(GUEST_STORAGE_SCOPE);
        if (!cancelled) {
          setItems(guestLocal);
          setReady(true);
        }
        return;
      }

      try {
        const remote = await fetchWardrobeItems(userId);
        const cleaned = normalizeWardrobeItems(stripDemoWardrobe(remote));
        if (!cancelled) {
          setItems(cleaned);
          await writeScopedWardrobe(userId, cleaned);
          setReady(true);
          cleaned
            .filter((item) => item.processingStatus === 'processing')
            .forEach((item) => startPolling(item.id));
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setReady(true);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authReady, userId, isRegistered, startPolling]);

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

        const itemId = created.id;
        void invokeWardrobeBackgroundRemoval(itemId).catch(() => {
          void refreshItem(itemId);
        });
        startPolling(itemId);

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
        processingStatus: 'done',
        createdAt: Date.now(),
      };

      if (isDemoWardrobeItem(payload)) {
        throw new Error('Demo wardrobe items cannot be saved');
      }

      await persistLocal([payload, ...items]);
      return payload;
    },
    [userId, isRegistered, items, persistLocal, refreshItem, startPolling],
  );

  const removeItem = useCallback(
    async (id: string) => {
      stopPolling(id);
      if (isRegistered && userId) {
        try {
          await deleteWardrobeItem(userId, id);
        } catch {
          // continue with local removal
        }
      }
      await persistLocal(items.filter((item) => item.id !== id));
    },
    [userId, isRegistered, items, persistLocal, stopPolling],
  );

  const stylingItems = useMemo(() => getStylingWardrobe(items), [items]);

  const getByCategory = useCallback(
    (category: WardrobeCategoryId) => stylingItems.filter((item) => item.category === category),
    [stylingItems],
  );

  const value = useMemo(
    () => ({ items: stylingItems, stylingItems, addItem, removeItem, getByCategory, ready }),
    [stylingItems, addItem, removeItem, getByCategory, ready],
  );

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be used within WardrobeProvider');
  return ctx;
}
