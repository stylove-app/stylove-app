import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationsModal } from '@/components/home/notifications-modal';
import { StyloveLogo } from '@/components/brand/stylove-logo';
import { SkeletonWeatherLine } from '@/components/ui/skeleton-shimmer';
import { useWeather } from '@/contexts/weather-context';
import { useTranslation } from '@/contexts/locale-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { hapticLight } from '@/lib/haptics';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

export function BrandHeader() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { weatherLine, loading, timeOfDay } = useWeather();
  const { displayName, avatarUri, profile } = useUserProfile();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const greeting =
    timeOfDay === 'morning'
      ? t.home.greetingMorning
      : timeOfDay === 'afternoon'
        ? t.home.greetingAfternoon
        : t.home.greetingEvening;

  const name = profile.firstName.trim() || displayName;

  const subGreeting = useMemo(() => {
    if (timeOfDay === 'morning') return t.home.subGreetingMorning;
    if (timeOfDay === 'afternoon') return t.home.subGreetingAfternoon;
    return t.home.subGreetingEvening;
  }, [timeOfDay, t.home.subGreetingMorning, t.home.subGreetingAfternoon, t.home.subGreetingEvening]);

  const greetingLine = `${greeting}, ${name}.`;

  const openNotifications = () => {
    void hapticLight();
    setNotificationsOpen(true);
  };

  const openProfile = () => {
    void hapticLight();
    router.push('/(tabs)/profile');
  };

  return (
    <>
      <View style={[styles.wrap, { paddingTop: insets.top }]}>
        <View style={styles.glowOrb} />
        <View style={styles.inner}>
          <View style={styles.topRow}>
            <StyloveLogo size="sm" variant="light" />
            <View style={styles.actions}>
              <Pressable
                onPress={openNotifications}
                style={({ pressed }) => [styles.notifBtn, pressed && styles.btnPressed]}
                accessibilityLabel={t.notifications.title}
                accessibilityRole="button">
                <Ionicons name="notifications-outline" size={18} color={StyloveColors.creamText} />
                <View style={styles.dot} />
              </Pressable>
              <Pressable
                onPress={openProfile}
                style={({ pressed }) => [pressed && styles.btnPressed]}
                accessibilityLabel={t.tabs.profile}
                accessibilityRole="button">
                <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
              </Pressable>
            </View>
          </View>

          <Text style={styles.greeting}>{greetingLine}</Text>
          <Text style={styles.subGreeting}>{subGreeting}</Text>
          {loading ? (
            <View style={styles.weatherSkeleton}>
              <SkeletonWeatherLine />
            </View>
          ) : (
            <Text style={styles.weather}>{weatherLine}</Text>
          )}
          <View style={styles.divider} />
          <Text style={styles.prepared}>{t.home.preparedForYou}</Text>
        </View>
      </View>

      <NotificationsModal visible={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: StyloveColors.burgundyRich,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 28,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: StyloveColors.wineLight,
    opacity: 0.2,
  },
  inner: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,250,242,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,184,120,0.25)',
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: StyloveColors.goldSoft,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: StyloveColors.goldMuted,
  },
  greeting: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    color: StyloveColors.creamText,
    letterSpacing: 0.3,
    lineHeight: 34,
  },
  subGreeting: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(245,237,224,0.72)',
    fontStyle: 'italic',
    marginTop: 6,
  },
  weather: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: StyloveColors.goldSoft,
    marginTop: 14,
    textTransform: 'uppercase',
  },
  weatherSkeleton: {
    marginTop: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212,184,120,0.22)',
    marginVertical: 16,
  },
  prepared: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(245,237,224,0.55)',
  },
});
