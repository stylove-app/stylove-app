import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

/** Shared tab navigator options — stable reference, no per-render allocation. */
export const TAB_NAVIGATOR_PERFORMANCE_OPTIONS: BottomTabNavigationOptions = {
  headerShown: false,
  lazy: true,
  freezeOnBlur: true,
  animation: 'none',
};
