import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import type { CuratedLook } from '@/lib/outfit-engine';
import {
  GUEST_STORAGE_SCOPE,
  readScopedLooks,
  writeScopedLooks,
} from '@/lib/user-scoped-storage';
import {
  createSavedOutfit,
  deleteSavedOutfit,
  fetchSavedOutfits,
  updateSavedOutfitCategory,
} from '@/services/saved-outfits';

type LooksContextValue = {
  looks: CuratedLook[];
  currentLook: CuratedLook | null;
  setCurrentLook: (look: CuratedLook | null) => void;
  saveLook: (look: CuratedLook) => Promise<CuratedLook>;
  removeLook: (id: string) => Promise<void>;
  updateLookCategory: (id: string, category: string) => Promise<void>;
  savedLooks: CuratedLook[];
  ready: boolean;
  loadError: boolean;
  retryLoad: () => Promise<void>;
};

const LooksContext = createContext<LooksContextValue | null>(null);

export function LooksProvider({ children }: { children: React.ReactNode }) {
  const { userId, ready: authReady, isRegistered } = useAuth();
  const [looks, setLooks] = useState<CuratedLook[]>([]);
  const [currentLook, setCurrentLookState] = useState<CuratedLook | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const storageScope = isRegistered && userId ? userId : GUEST_STORAGE_SCOPE;

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;
    setReady(false);
    setLoadError(false);
    setLooks([]);
    setCurrentLookState(null);

    if (isRegistered && userId) {
      void fetchSavedOutfits(userId)
        .then((stored) => {
          if (cancelled) return;
          setLooks(stored);
          setCurrentLookState(stored[0] ?? null);
          setLoadError(false);
        })
        .catch(() => {
          if (cancelled) return;
          setLooks([]);
          setCurrentLookState(null);
          setLoadError(true);
        })
        .finally(() => {
          if (!cancelled) setReady(true);
        });
      return () => {
        cancelled = true;
      };
    }

    void readScopedLooks(storageScope).then((stored) => {
      if (!cancelled) {
        setLooks(stored);
        setCurrentLookState(null);
        setLoadError(false);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authReady, storageScope, isRegistered, userId]);

  const retryLoad = useCallback(async () => {
    if (!isRegistered || !userId) return;
    setReady(false);
    setLoadError(false);
    try {
      const stored = await fetchSavedOutfits(userId);
      setLooks(stored);
      setCurrentLookState(stored[0] ?? null);
      setLoadError(false);
    } catch {
      setLooks([]);
      setCurrentLookState(null);
      setLoadError(true);
    } finally {
      setReady(true);
    }
  }, [isRegistered, userId]);

  const setCurrentLook = useCallback(
    (look: CuratedLook | null) => {
      setCurrentLookState(look);
      if (look) {
        setLooks((prev) => {
          const next = [look, ...prev.filter((l) => l.id !== look.id)];
          if (!isRegistered) void writeScopedLooks(storageScope, next);
          return next;
        });
      }
    },
    [isRegistered, storageScope],
  );

  const saveLook = useCallback(
    async (look: CuratedLook) => {
      if (isRegistered && userId) {
        const saved = await createSavedOutfit(userId, look);
        const refreshed = await fetchSavedOutfits(userId);
        const nextCurrent = refreshed.find((stored) => stored.id === saved.id) ?? saved;

        setLooks(refreshed);
        setCurrentLookState(nextCurrent);
        setLoadError(false);
        return nextCurrent;
      }

      const saved = { ...look, saved: true };
      setLooks((prev) => {
        const next = [saved, ...prev.filter((l) => l.id !== look.id && l.id !== saved.id)];
        void writeScopedLooks(storageScope, next);
        return next;
      });
      setCurrentLookState(saved);
      return saved;
    },
    [isRegistered, storageScope, userId],
  );

  const removeLook = useCallback(
    async (id: string) => {
      let rollbackLooks: CuratedLook[] = [];
      let rollbackCurrent: CuratedLook | null = null;

      setLooks((prev) => {
        rollbackLooks = prev;
        const next = prev.filter((l) => l.id !== id);
        if (!isRegistered) void writeScopedLooks(storageScope, next);
        return next;
      });
      setCurrentLookState((current) => {
        rollbackCurrent = current;
        return current?.id === id ? null : current;
      });

      try {
        if (isRegistered && userId) {
          await deleteSavedOutfit(userId, id);
        }
      } catch (error) {
        setLooks(rollbackLooks);
        setCurrentLookState(rollbackCurrent);
        throw error;
      }
    },
    [isRegistered, storageScope, userId],
  );

  const updateLookCategory = useCallback(
    async (id: string, category: string) => {
      const updated = isRegistered && userId
        ? await updateSavedOutfitCategory(userId, id, category)
        : undefined;

      setLooks((prev) => {
        const next = prev.map((look) =>
          look.id === id ? (updated ?? { ...look, archiveCategory: category }) : look,
        );
        if (!isRegistered) void writeScopedLooks(storageScope, next);
        return next;
      });
      setCurrentLookState((current) =>
        current?.id === id ? (updated ?? { ...current, archiveCategory: category }) : current,
      );
    },
    [isRegistered, storageScope, userId],
  );

  const savedLooks = useMemo(() => looks.filter((l) => l.saved), [looks]);

  const value = useMemo(
    () => ({
      looks,
      currentLook,
      setCurrentLook,
      saveLook,
      removeLook,
      updateLookCategory,
      savedLooks,
      ready,
      loadError,
      retryLoad,
    }),
    [looks, currentLook, setCurrentLook, saveLook, removeLook, updateLookCategory, savedLooks, ready, loadError, retryLoad],
  );

  return <LooksContext.Provider value={value}>{children}</LooksContext.Provider>;
}

export function useLooks() {
  const ctx = useContext(LooksContext);
  if (!ctx) throw new Error('useLooks must be used within LooksProvider');
  return ctx;
}
