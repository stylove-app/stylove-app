import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { SectionHeader } from '@/components/ui/section-header';
import { SoftEnter } from '@/components/ui/soft-enter';
import { softFadeInDown } from '@/constants/luxury-motion';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { interpolate } from '@/i18n';
import type { TravelPlan } from '@/lib/travel-engine';
import type { WardrobeItem } from '@/lib/outfit-engine';
import { Fonts } from '@/constants/theme';

type TravelPlanViewProps = {
  plan: TravelPlan;
};

function PieceCard({ item }: { item: WardrobeItem }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.piece,
        { borderColor: colors.creamMuted, backgroundColor: colors.white },
        StyloveShadow.soft,
      ]}>
      <View style={styles.pieceImageWrap}>
        <Image
          source={{ uri: item.imageUri }}
          style={styles.pieceImage}
          contentFit="contain"
          transition={300}
        />
      </View>
      <Text style={[styles.pieceName, { color: colors.black }]} numberOfLines={1}>
        {item.name}
      </Text>
    </View>
  );
}

export function TravelPlanView({ plan }: TravelPlanViewProps) {
  const t = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrap}>
      <SoftEnter delay={40}>
        <View
          style={[
            styles.weatherCard,
            { backgroundColor: isDark ? colors.cardDark : colors.wineDeep, borderColor: 'rgba(196,160,98,0.2)' },
            StyloveShadow.editorial,
          ]}>
          <GoldShimmerLine width={36} />
          <Text style={[styles.weatherCity, { color: colors.creamText }]}>{plan.weather.city}</Text>
          <Text style={[styles.weatherTitle, { color: colors.goldMuted }]}>{t.travel.weatherTitle}</Text>
          {plan.forecastUnavailable ? (
            <Text style={[styles.forecastNotice, { color: colors.goldMuted }]}>
              {t.travel.forecastUnavailable}
            </Text>
          ) : null}
          <View style={styles.weatherGrid}>
            <View style={styles.weatherCell}>
              <Text style={[styles.weatherPhase, { color: colors.goldSoft }]}>{t.travel.weatherDay}</Text>
              <Text style={[styles.weatherTemp, { color: colors.creamText }]}>{plan.weather.temperature}°</Text>
              <Text style={[styles.weatherCond, { color: colors.grayLight }]}>
                {t.weather.conditions[plan.weather.condition]}
              </Text>
            </View>
            <View style={[styles.weatherDivider, { backgroundColor: 'rgba(196,160,98,0.2)' }]} />
            <View style={styles.weatherCell}>
              <Text style={[styles.weatherPhase, { color: colors.goldSoft }]}>{t.travel.weatherNight}</Text>
              <Text style={[styles.weatherTemp, { color: colors.creamText }]}>{plan.weather.nightTemperature}°</Text>
              <Text style={[styles.weatherCond, { color: colors.grayLight }]}>
                {t.weather.conditions[plan.weather.nightCondition]}
              </Text>
            </View>
          </View>
          <View style={styles.weatherDetails}>
            {plan.weather.feelsLike !== undefined ? (
              <Text style={[styles.weatherDetailText, { color: colors.grayLight }]}>
                {interpolate(t.travel.weatherFeelsLike, { temp: plan.weather.feelsLike })}
              </Text>
            ) : null}
            <Text style={[styles.weatherDetailText, { color: colors.grayLight }]}>
              {interpolate(t.travel.weatherRain, { amount: plan.weather.precipitation.toFixed(1) })}
            </Text>
            <Text style={[styles.weatherDetailText, { color: colors.grayLight }]}>
              {interpolate(t.travel.weatherWind, { speed: Math.round(plan.weather.wind) })}
            </Text>
            {plan.weather.needsOuterwear ? (
              <Text style={[styles.weatherHint, { color: colors.goldMuted }]}>{t.travel.layeringHint}</Text>
            ) : null}
            <Text style={[styles.attribution, { color: 'rgba(245,237,224,0.5)' }]}>
              {t.travel.weatherAttribution}
            </Text>
          </View>
        </View>
      </SoftEnter>

      <SectionHeader title={t.travel.suitcaseTitle} />
      <SoftEnter delay={100}>
        <View
          style={[
            styles.suitcaseCard,
            { backgroundColor: colors.white, borderColor: colors.creamMuted },
            StyloveShadow.soft,
          ]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pieceRow}>
            {plan.packedItems.map((item) => (
              <PieceCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>
      </SoftEnter>

      <SectionHeader title={t.travel.timelineTitle} />
      <View style={styles.timeline}>
        {plan.dailyLooks.map((day, index) => (
          <Animated.View key={day.day} entering={softFadeInDown(120 + index * 80)} style={styles.dayCard}>
            <View
              style={[
                styles.dayCardInner,
                { backgroundColor: colors.white, borderColor: colors.creamMuted },
                StyloveShadow.soft,
              ]}>
              <View style={styles.dayHero}>
                <Image
                  source={{ uri: day.lookImage }}
                  style={styles.dayImage}
                  contentFit="contain"
                  transition={400}
                />
              </View>
              <View style={styles.dayBody}>
                <Text style={[styles.dayTitle, { color: colors.black }]}>
                  {interpolate(t.travel.outfitLabel, { day: String(day.day) })}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayItems}>
                  {day.items.map((item) => (
                    <View key={item.id} style={[styles.dayItemThumb, { borderColor: colors.creamRich }]}>
                      <Image
                        source={{ uri: item.imageUri }}
                        style={styles.dayItemImage}
                        contentFit="contain"
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  weatherCard: {
    marginHorizontal: 24,
    marginBottom: 28,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  weatherCity: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    letterSpacing: 0.3,
  },
  weatherTitle: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  forecastNotice: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  weatherGrid: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
  },
  weatherCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weatherDivider: {
    width: 1,
    marginVertical: 4,
  },
  weatherPhase: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  weatherTemp: {
    fontFamily: Fonts.serif,
    fontSize: 32,
  },
  weatherCond: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  weatherDetails: {
    alignItems: 'center',
    gap: 4,
  },
  weatherDetailText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  weatherHint: {
    fontSize: 12,
    fontFamily: Fonts.serif,
    textAlign: 'center',
    marginTop: 2,
  },
  attribution: {
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 4,
  },
  suitcaseCard: {
    marginHorizontal: 24,
    marginBottom: 28,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  pieceRow: {
    gap: 10,
    paddingRight: 4,
  },
  piece: {
    width: 108,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pieceImageWrap: {
    width: '100%',
    height: 96,
    backgroundColor: '#F5F0E6',
  },
  pieceImage: {
    width: '100%',
    height: '100%',
  },
  pieceName: {
    fontFamily: Fonts.serif,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 8,
    letterSpacing: 0.1,
  },
  timeline: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 28,
  },
  dayCard: {},
  dayCardInner: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayHero: {
    height: 200,
    position: 'relative',
    backgroundColor: '#F5F0E6',
  },
  dayImage: {
    width: '100%',
    height: '100%',
  },
  dayBody: {
    padding: 18,
    gap: 10,
  },
  dayTitle: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    letterSpacing: 0.2,
  },
  dayItems: {
    gap: 8,
  },
  dayItemThumb: {
    backgroundColor: '#F5F0E6',
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayItemImage: {
    width: '100%',
    height: '100%',
  },
});
