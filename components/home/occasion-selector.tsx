import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useMemo } from 'react';
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
import { SELECTED_OCCASION_ORDER, type SelectedOccasionId } from '@/lib/selected-occasion';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

/** Luxury bordo fill for occasion tiles (home grid). */
const OCCASION_CARD_BORDO = '#6B1F32';
const OCCASION_CARD_BORDO_ACTIVE = '#7A2840';
const OCCASION_CARD_CREAM = '#F8F4EC';
const OCCASION_CARD_CREAM_MUTED = 'rgba(248, 244, 236, 0.72)';

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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, PRESS_SPRING);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, PRESS_SPRING);
  }, [scale]);

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
        style={[styles.occasionCard, active && styles.occasionCardActive]}>
        <Ionicons name={OCCASION_ICONS[id]} size={28} color={OCCASION_CARD_CREAM} />
        <Text style={styles.occasionTitle} numberOfLines={2}>
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
          {SELECTED_OCCASION_ORDER.map((id, index) => {
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
    backgroundColor: OCCASION_CARD_BORDO,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(248, 244, 236, 0.12)',
    ...StyloveShadow.soft,
  },
  occasionCardActive: {
    backgroundColor: OCCASION_CARD_BORDO_ACTIVE,
    borderColor: OCCASION_CARD_CREAM,
    borderWidth: 2,
  },
  occasionTitle: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    lineHeight: 18,
    color: OCCASION_CARD_CREAM,
    textAlign: 'center',
    width: '100%',
  },
  occasionSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    color: OCCASION_CARD_CREAM_MUTED,
    textAlign: 'center',
    width: '100%',
  },
  hint: {
    fontSize: 12,
    color: StyloveColors.grayLight,
    textAlign: 'center',
  },
});
