import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/locale-context';
import type { CuratedLook, WardrobeItem } from '@/lib/outfit-engine';
import {
  EMPTY_STYLE_MEMORY,
  getSignatureFromMemory,
  recordLookGenerated,
  recordLookSaved,
  recordWardrobeItem,
  type StyleMemory,
} from '@/lib/style-memory';
import {
  GUEST_STORAGE_SCOPE,
  readScopedStyleMemory,
  writeScopedStyleMemory,
} from '@/lib/user-scoped-storage';

type StyleMemoryContextValue = {
  memory: StyleMemory;
  ready: boolean;
  recordGeneratedLook: (look: CuratedLook) => void;
  recordSavedLook: (look: CuratedLook) => void;
  recordWardrobeAdd: (item: WardrobeItem) => void;
  signature: ReturnType<typeof getSignatureFromMemory>;
};

const StyleMemoryContext = createContext<StyleMemoryContextValue | null>(null);

export function StyleMemoryProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslation();
  const { userId, ready: authReady, isRegistered } = useAuth();
  const [memory, setMemory] = useState<StyleMemory>(EMPTY_STYLE_MEMORY);
  const [ready, setReady] = useState(false);

  const storageScope = isRegistered && userId ? userId : GUEST_STORAGE_SCOPE;

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;
    setReady(false);
    setMemory(EMPTY_STYLE_MEMORY);

    void readScopedStyleMemory(storageScope).then((stored) => {
      if (!cancelled) {
        setMemory(stored);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authReady, storageScope, isRegistered]);

  const persist = useCallback(
    async (next: StyleMemory) => {
      setMemory(next);
      await writeScopedStyleMemory(storageScope, next);
    },
    [storageScope],
  );

  const recordGeneratedLook = useCallback(
    (look: CuratedLook) => persist(recordLookGenerated(memory, look)),
    [memory, persist],
  );

  const recordSavedLook = useCallback(
    (look: CuratedLook) => persist(recordLookSaved(memory, look)),
    [memory, persist],
  );

  const recordWardrobeAdd = useCallback(
    (item: WardrobeItem) => persist(recordWardrobeItem(memory, item)),
    [memory, persist],
  );

  const signature = useMemo(() => getSignatureFromMemory(memory, t), [memory, t]);

  const value = useMemo(
    () => ({
      memory,
      ready,
      recordGeneratedLook,
      recordSavedLook,
      recordWardrobeAdd,
      signature,
    }),
    [memory, ready, recordGeneratedLook, recordSavedLook, recordWardrobeAdd, signature],
  );

  return <StyleMemoryContext.Provider value={value}>{children}</StyleMemoryContext.Provider>;
}

export function useStyleMemory() {
  const ctx = useContext(StyleMemoryContext);
  if (!ctx) throw new Error('useStyleMemory must be used within StyleMemoryProvider');
  return ctx;
}
