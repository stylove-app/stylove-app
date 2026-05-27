import type { WardrobeItem } from '@/lib/outfit-engine';

type WardrobeSnapshot = {
  ready: boolean;
  stylingItems: WardrobeItem[];
};

const POLL_MS = 80;
const DEFAULT_MAX_MS = 10_000;

/** Waits until wardrobe context has finished loading (auth + Supabase/local sync). */
export async function waitForWardrobeReady(
  getSnapshot: () => WardrobeSnapshot,
  maxMs = DEFAULT_MAX_MS,
): Promise<WardrobeSnapshot> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const snapshot = getSnapshot();
    if (snapshot.ready) return snapshot;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  return getSnapshot();
}
