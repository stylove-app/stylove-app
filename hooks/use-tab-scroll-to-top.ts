import { useScrollToTop } from '@react-navigation/native';
import { useRef } from 'react';
import type { ScrollView } from 'react-native';

/** Scroll to top when the active bottom tab is pressed again. */
export function useTabScrollToTop() {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  return scrollRef;
}
