import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { useTranslation } from '@/contexts/locale-context';
import { HOME_OCCASION_CARD_ORDER, type SelectedOccasionId } from '@/lib/selected-occasion';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

/** Occasion tile palette — rich burgundy (selectable) vs lifted selected state + gold. */
const OCCASION_CARD_BORDO = '#5C1826';
const OCCASION_CARD_BORDO_ACTIVE = '#7D2A3F';
const OCCASION_CARD_CREAM = '#F8F4EC';
const OCCASION_CARD_SUBTITLE = 'rgba(248, 244, 236, 0.82)';
const OCCASION_CARD_BORDER_IDLE = 'rgba(248, 244, 236, 0.22)';
const OCCASION_GOLD_BORDER = StyloveColors.goldSoft;
const OCCASION_GOLD_RING = 'rgba(212, 184, 120, 0.58)';

const OCCASION_SHADOW_IDLE = {
  shadowColor: StyloveColors.wineDeep,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.2,
  shadowRadius: 14,
  elevation: 5,
} as const;

const OCCASION_SHADOW_SELECTED = {
  shadowColor: StyloveColors.wineDeep,
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.32,
  shadowRadius: 22,
  elevation: 10,
} as const;

const SELECTED_SCALE = 1.06;
const IDLE_SCALE = 1;

const CARD_HEIGHT = 124;
const GRID_GAP = 12;
/** Screen padding (24×2) + ivory card padding (20×2). */
const GRID_HORIZONTAL_INSET = 88;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const OCCASION_CARD_WIDTH = Math.floor((SCREEN_WIDTH - GRID_HORIZONTAL_INSET - GRID_GAP) / 2);

const OCCASION_ICONS: Record<SelectedOccasionId, keyof typeof Ionicons.glyphMap> = {
  daily: 'sunny-outline',
  office: 'briefcase-outline',
  dinner: 'restaurant-outline',
  date: 'heart-outline',
  shopping: 'bag-outline',
  coffee: 'cafe-outline',
  beach: 'umbrella-outline',
  vacation: 'airplane-outline',
  wedding: 'sparkles-outline',
  sport_walk: 'walk-outline',
  travel: 'compass-outline',
  family_visit: 'people-outline',
};

const PRESS_SPRING = { damping: 18, stiffness: 320 };

type OccasionSelectorProps = {
  value: SelectedOccasionId | null;
  onChange: (id: SelectedOccasionId) => void;
  onCreateLook: () => void;
  isGenerating?: boolean;
  wardrobeLoading?: boolean;
  wardrobeEmpty?: boolean;
};

type OccasionGridCardProps = {
  id: SelectedOccasionId;
  active: boolean;
  title: string;
  subtitle: string;
  index: number;
  onPress: (id: SelectedOccasionId) => void;
};

function OccasionGridCard({ id, active, title, subtitle, index, onPress }: OccasionGridCardProps) {
  const scale = useSharedValue(active ? SELECTED_SCALE : IDLE_SCALE);

  useEffect(() => {
    scale.value = withSpring(active ? SELECTED_SCALE : IDLE_SCALE, PRESS_SPRING);
  }, [active, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(active ? 1.02 : 0.96, PRESS_SPRING);
  }, [active, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(active ? SELECTED_SCALE : IDLE_SCALE, PRESS_SPRING);
  }, [active, scale]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 32).duration(300)}
      style={[styles.gridCell, animatedStyle]}>
      <Pressable
        onPress={() => onPress(id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={[styles.occasionCard, active ? styles.occasionCardActive : styles.occasionCardIdle]}>
        {active ? (
          <>
            <View style={styles.selectedGoldRing} pointerEvents="none" />
            <View style={styles.selectedInnerRing} pointerEvents="none" />
          </>
        ) : null}
        <Ionicons name={OCCASION_ICONS[id]} size={active ? 32 : 28} color={OCCASION_CARD_CREAM} />
        <Text style={[styles.occasionTitle, active && styles.occasionTitleActive]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.occasionSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function OccasionSelectorComponent({
  value,
  onChange,
  onCreateLook,
  isGenerating,
  wardrobeLoading,
  wardrobeEmpty,
}: OccasionSelectorProps) {
  const t = useTranslation();

  const handleSelect = useCallback(
    (id: SelectedOccasionId) => {
      onChange(id);
    },
    [onChange],
  );

  const gridWidth = useMemo(
    () => OCCASION_CARD_WIDTH * 2 + GRID_GAP,
    [],
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.accentLineWrap}>
          <GoldShimmerLine width={200} />
        </View>
        <Text style={styles.title}>{t.home.occasionTitle}</Text>
        <Text style={styles.sectionSubtitle}>{t.home.occasionSubtitle}</Text>

        <View style={[styles.grid, { width: gridWidth }]}>
          {HOME_OCCASION_CARD_ORDER.map((id, index) => {
            const copy = t.home.occasions[id];
            return (
              <OccasionGridCard
                key={id}
                id={id}
                active={value === id}
                title={copy.title}
                subtitle={copy.subtitle}
                index={index}
                onPress={handleSelect}
              />
            );
          })}
        </View>

        <LuxuryButton
          label={t.home.createLook}
          onPress={onCreateLook}
          variant="gold"
          disabled={!value || isGenerating || wardrobeLoading || wardrobeEmpty}
        />
        {wardrobeLoading ? (
          <Text style={styles.hint}>{t.home.wardrobeLoadingHint}</Text>
        ) : wardrobeEmpty ? (
          <Text style={styles.hint}>{t.home.emptyWardrobeHint}</Text>
        ) : null}
      </View>
    </View>
  );
}

export const OccasionSelector = memo(OccasionSelectorComponent);

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
  },
  card: {
    backgroundColor: StyloveColors.ivory,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: StyloveColors.creamMuted,
    alignItems: 'center',
    ...StyloveShadow.card,
  },
  accentLineWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: StyloveColors.burgundy,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: StyloveColors.gray,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    alignSelf: 'center',
  },
  gridCell: {
    width: OCCASION_CARD_WIDTH,
  },
  occasionCard: {
    height: CARD_HEIGHT,
    width: '100%',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  occasionCardIdle: {
    backgroundColor: OCCASION_CARD_BORDO,
    borderWidth: 1.5,
    borderColor: OCCASION_CARD_BORDER_IDLE,
    ...OCCASION_SHADOW_IDLE,
  },
  occasionCardActive: {
    backgroundColor: OCCASION_CARD_BORDO_ACTIVE,
    borderColor: OCCASION_GOLD_BORDER,
    borderWidth: 3.5,
    ...OCCASION_SHADOW_SELECTED,
  },
  selectedGoldRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: OCCASION_GOLD_RING,
    margin: 2,
  },
  selectedInnerRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(248, 244, 236, 0.42)',
    margin: 5,
  },
  occasionTitle: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    lineHeight: 18,
    color: OCCASION_CARD_CREAM,
    textAlign: 'center',
    width: '100%',
    fontWeight: '500',
  },
  occasionTitleActive: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '600',
  },
  occasionSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    color: OCCASION_CARD_SUBTITLE,
    textAlign: 'center',
    width: '100%',
  },
  hint: {
    fontSize: 12,
    color: StyloveColors.grayLight,
    textAlign: 'center',
  },
});
