import { useCallback, useRef, type RefObject } from 'react';
import type { LayoutChangeEvent, ScrollView } from 'react-native';

const SCROLL_OFFSET = 20;
const SCROLL_RETRY_MS = [0, 80, 200, 420] as const;

/** Smooth scroll to the generated outfit block after layout settles. */
export function useScrollToOutfitResult(scrollRef: RefObject<ScrollView | null>) {
  const resultsY = useRef(0);

  const onOutfitResultLayout = useCallback((event: LayoutChangeEvent) => {
    resultsY.current = event.nativeEvent.layout.y;
  }, []);

  const scrollToOutfitResult = useCallback(() => {
    const y = Math.max(0, resultsY.current - SCROLL_OFFSET);
    scrollRef.current?.scrollTo({ y, animated: true });
  }, [scrollRef]);

  const requestScrollToOutfitResult = useCallback(() => {
    const timers = SCROLL_RETRY_MS.map((delay) => setTimeout(scrollToOutfitResult, delay));
    return () => timers.forEach(clearTimeout);
  }, [scrollToOutfitResult]);

  return { onOutfitResultLayout, requestScrollToOutfitResult };
}
