import { Ionicons } from '@expo/vector-icons';
import { router, Tabs, usePathname } from 'expo-router';
import { memo, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { EditorialOnboardingFlow } from '@/components/onboarding/editorial-onboarding-flow';
import { SessionRestoreError } from '@/components/auth/session-restore-error';
import { TAB_NAVIGATOR_PERFORMANCE_OPTIONS } from '@/constants/tab-navigation';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import type { StylovePalette } from '@/constants/stylove-theme';

const TabIcon = memo(function TabIcon({
  name,
  outlineName,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  outlineName: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={focused ? name : outlineName} size={22} color={color} />
    </View>
  );
});

function createTabBarIcon(name: keyof typeof Ionicons.glyphMap, outlineName: keyof typeof Ionicons.glyphMap) {
  const TabBarIcon = ({ color, focused }: { color: string; focused: boolean }) => (
    <TabIcon name={name} outlineName={outlineName} color={color} focused={focused} />
  );
  TabBarIcon.displayName = `TabBarIcon(${name})`;
  return TabBarIcon;
}

const HOME_TAB_ICON = createTabBarIcon('home', 'home-outline');
const WARDROBE_TAB_ICON = createTabBarIcon('shirt', 'shirt-outline');
const LOOKS_TAB_ICON = createTabBarIcon('heart', 'heart-outline');
const PROFILE_TAB_ICON = createTabBarIcon('person', 'person-outline');

function buildTabScreenOptions(colors: StylovePalette) {
  return {
    ...TAB_NAVIGATOR_PERFORMANCE_OPTIONS,
    tabBarButton: HapticTab,
    tabBarActiveTintColor: colors.burgundy,
    tabBarInactiveTintColor: colors.grayLight,
    tabBarStyle: [styles.tabBar, { backgroundColor: colors.white, borderTopColor: colors.creamRich }],
    tabBarLabelStyle: styles.tabBarLabel,
    tabBarItemStyle: styles.tabBarItem,
    sceneStyle: { backgroundColor: colors.ivory },
  };
}

export default function TabLayout() {
  const t = useTranslation();
  const { colors } = useTheme();
  const { ready, isRegistered, initError } = useAuth();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  const screenOptions = useMemo(() => buildTabScreenOptions(colors), [colors]);

  useEffect(() => {
    if (!ready) return;

    if (isRegistered) {
      redirectedRef.current = false;
      return;
    }

    if (!redirectedRef.current && pathname !== '/') {
      redirectedRef.current = true;
      router.replace('/');
    }
  }, [ready, isRegistered, pathname]);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.ivory }]}>
        <ActivityIndicator color={colors.goldMuted} />
      </View>
    );
  }

  if (initError) {
    return <SessionRestoreError />;
  }

  if (!isRegistered) {
    return <EditorialOnboardingFlow />;
  }

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={{ title: t.tabs.home, tabBarIcon: HOME_TAB_ICON }} />
      <Tabs.Screen name="wardrobe" options={{ title: t.tabs.wardrobe, tabBarIcon: WARDROBE_TAB_ICON }} />
      <Tabs.Screen name="looks" options={{ title: t.tabs.looks, tabBarIcon: LOOKS_TAB_ICON }} />
      <Tabs.Screen name="profile" options={{ title: t.tabs.profile, tabBarIcon: PROFILE_TAB_ICON }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    ...Platform.select({
      ios: {
        shadowColor: '#1F0509',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
    }),
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0,
    marginTop: 4,
  },
  tabBarItem: {
    paddingTop: 2,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(74, 14, 24, 0.12)',
    ...StyloveShadow.glow,
  },
});
