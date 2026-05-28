import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TravelPlanView } from '@/components/travel/travel-plan-view';
import { TravelPremiumLock } from '@/components/travel/travel-premium-lock';
import { CinematicLoading } from '@/components/ui/cinematic-loading';
import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { StyloveFooter } from '@/components/ui/stylove-footer';
import { softFadeInDown } from '@/constants/luxury-motion';
import { usePremium } from '@/contexts/premium-context';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { useWardrobe } from '@/contexts/wardrobe-context';
import { generateTravelPlan, type TravelPlan } from '@/lib/travel-engine';
import { getDestinationWeatherForecast } from '@/services/weather-service';
import { saveTravelPlan } from '@/services/travel-plans';
import type { TravelVibeId } from '@/i18n/types';
import { Fonts } from '@/constants/theme';

const TRAVEL_VIBES: TravelVibeId[] = [
  'cityExplore',
  'romanticEscape',
  'businessTrip',
  'beachClub',
  'luxuryEscape',
  'minimalTravel',
];

const MIN_TRIP_DAYS = 1;
const MAX_TRIP_DAYS = 30;
const DEFAULT_TRIP_DAYS = 5;

function parseTripDays(raw: string): number {
  const parsed = parseInt(raw.replace(/\D/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed < MIN_TRIP_DAYS) return DEFAULT_TRIP_DAYS;
  return Math.min(parsed, MAX_TRIP_DAYS);
}

export default function TravelScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isPremium, ready: premiumReady } = usePremium();
  const { userId } = useAuth();
  const { stylingItems } = useWardrobe();

  const [destination, setDestination] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [vibe, setVibe] = useState<TravelVibeId>('cityExplore');
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const scrollRef = useTabScrollToTop();

  const handlePrepare = useCallback(async () => {
    Keyboard.dismiss();
    const dest = destination.trim() || 'Paris';
    const duration = parseTripDays(durationInput);
    setIsPreparing(true);
    if (process.env.EXPO_OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const startDate = departureDate.trim() || undefined;
    const [weatherResult] = await Promise.all([
      getDestinationWeatherForecast({ city: dest, startDate, days: Math.min(duration, 16) }),
      new Promise((resolve) => setTimeout(resolve, 4200)),
    ]);
    const nextPlan = generateTravelPlan(t, {
      destination: dest,
      duration,
      departureDate: departureDate.trim() || t.travel.departurePlaceholder,
      vibe,
      wardrobe: stylingItems,
      weatherForecast: weatherResult.forecast,
      weatherSource: weatherResult.source,
      forecastUnavailable: weatherResult.forecastUnavailable,
      seed: Date.now(),
    });
    setPlan(nextPlan);
    if (userId) {
      void saveTravelPlan(userId, nextPlan).catch(() => undefined);
    }
    setIsPreparing(false);
  }, [destination, durationInput, departureDate, vibe, stylingItems, t, userId]);

  if (!premiumReady) {
    return <View style={[styles.screen, { backgroundColor: colors.ivory }]} />;
  }

  if (!isPremium) {
    return <TravelPremiumLock />;
  }

  const content = (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={Keyboard.dismiss}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
      <View style={[styles.hero, { backgroundColor: colors.wineDeep, paddingTop: insets.top + 16 }]}>
        <View style={styles.heroGlow} />
        <View style={styles.heroGlowSecondary} />
        <GoldShimmerLine width={40} />
        <Text style={styles.heroTitle}>{t.travel.title}</Text>
        <Text style={styles.heroSubtitle}>{t.travel.subtitle}</Text>
      </View>

      <Animated.View entering={softFadeInDown(80)} style={styles.formWrap}>
        <View
          style={[
            styles.formCard,
            { backgroundColor: colors.white, borderColor: colors.creamMuted },
            StyloveShadow.editorial,
          ]}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.grayLight }]}>{t.travel.destinationLabel}</Text>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder={t.travel.destinationPlaceholder}
              placeholderTextColor={colors.grayLight}
              autoCorrect={false}
              style={[styles.input, { color: colors.black, borderColor: colors.creamRich, backgroundColor: colors.ivory }]}
            />
            <Text style={[styles.fieldHint, { color: colors.gray }]}>{t.travel.destinationHint}</Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.grayLight }]}>{t.travel.durationLabel}</Text>
            <TextInput
              value={durationInput}
              onChangeText={(text) => setDurationInput(text.replace(/[^\d]/g, ''))}
              placeholder={t.travel.durationPlaceholder}
              placeholderTextColor={colors.grayLight}
              keyboardType="number-pad"
              maxLength={2}
              style={[
                styles.input,
                styles.durationInput,
                { color: colors.black, borderColor: colors.creamRich, backgroundColor: colors.ivory },
              ]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.grayLight }]}>{t.travel.departureLabel}</Text>
            <TextInput
              value={departureDate}
              onChangeText={setDepartureDate}
              placeholder={t.travel.departurePlaceholder}
              placeholderTextColor={colors.grayLight}
              style={[styles.input, { color: colors.black, borderColor: colors.creamRich, backgroundColor: colors.ivory }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.grayLight }]}>{t.travel.vibeLabel}</Text>
            <Text style={[styles.fieldHint, { color: colors.gray }]}>
              {t.travel.spotsSubtitle}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vibeRow}>
              {TRAVEL_VIBES.map((id) => {
                const selected = vibe === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => {
                      if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
                      setVibe(id);
                    }}
                    style={[
                      styles.vibePill,
                      {
                        backgroundColor: selected ? colors.burgundy : isDark ? colors.cardElevated : colors.ivory,
                        borderColor: selected ? colors.goldMuted : colors.creamMuted,
                      },
                    ]}>
                    <Text style={[styles.vibeText, { color: selected ? colors.creamText : colors.gray }]}>
                      {t.travel.vibes[id]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {stylingItems.length === 0 ? (
            <Text style={[styles.hint, { color: colors.gray }]}>{t.travel.emptyWardrobeHint}</Text>
          ) : null}

          <LuxuryButton label={t.travel.prepareCta} onPress={handlePrepare} variant="gold" disabled={isPreparing} />
        </View>
      </Animated.View>

      {plan ? <TravelPlanView plan={plan} /> : null}

      <StyloveFooter />
    </ScrollView>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.ivory }]}>
      {isPreparing ? (
        <CinematicLoading visible messages={t.travel.preparing} intervalMs={2000} />
      ) : null}
      {Platform.OS === 'android' ? (
        <KeyboardAvoidingView style={styles.screen} behavior="padding">
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    marginBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    ...StyloveShadow.editorial,
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(196,160,98,0.12)',
  },
  heroGlowSecondary: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(107,26,40,0.32)',
  },
  heroTitle: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    color: '#F5EDE0',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(245,237,224,0.72)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
    maxWidth: 320,
  },
  formWrap: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  fieldHint: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: Fonts.serif,
  },
  durationInput: {
    maxWidth: 120,
  },
  vibeRow: {
    gap: 8,
    paddingRight: 8,
  },
  vibePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  vibeText: {
    fontFamily: Fonts.serif,
    fontSize: 13,
    letterSpacing: 0.1,
  },
  hint: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
