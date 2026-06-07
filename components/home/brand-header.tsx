import { router } from 'expo-router';
import { memo, useMemo } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StyloveLogo } from '@/components/brand/stylove-logo';
import { SkeletonWeatherLine } from '@/components/ui/skeleton-shimmer';
import { useWeather } from '@/contexts/weather-context';
import { useTranslation } from '@/contexts/locale-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { hapticLight } from '@/lib/haptics';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

function BrandHeaderComponent() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { weatherLine, loading, timeOfDay } = useWeather();
  const { displayName, avatarUri, profile } = useUserProfile();

  const greeting = useMemo(() => {
    if (timeOfDay === 'morning') return t.home.greetingMorning;
    if (timeOfDay === 'afternoon') return t.home.greetingAfternoon;
    return t.home.greetingEvening;
  }, [timeOfDay, t.home.greetingMorning, t.home.greetingAfternoon, t.home.greetingEvening]);

  const greetingLine = useMemo(() => {
    const name = profile.firstName.trim() || displayName;
    return `${greeting}, ${name}.`;
  }, [greeting, profile.firstName, displayName]);

  const openProfile = () => {
    void hapticLight();
    router.push('/(tabs)/profile');
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.glowOrb} />
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <StyloveLogo size="sm" variant="light" />
          <Pressable
            onPress={openProfile}
            style={({ pressed }) => [pressed && styles.btnPressed]}
            accessibilityLabel={t.tabs.profile}
            accessibilityRole="button">
            <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
          </Pressable>
        </View>

        <Text style={styles.greeting}>{greetingLine}</Text>
        {loading ? (
          <View style={styles.weatherSkeleton}>
            <SkeletonWeatherLine />
          </View>
        ) : (
          <Text style={styles.weather}>{weatherLine}</Text>
        )}
      </View>
    </View>
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
    paddingBottom: 32,
    paddingTop: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
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
  weather: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: StyloveColors.goldSoft,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  weatherSkeleton: {
    marginTop: 14,
  },
});

export const BrandHeader = memo(BrandHeaderComponent);
