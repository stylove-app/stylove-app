import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { useTranslation } from '@/contexts/locale-context';
import { SELECTED_OCCASION_ORDER, type SelectedOccasionId } from '@/lib/selected-occasion';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

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

type OccasionSelectorProps = {
  value: SelectedOccasionId | null;
  onChange: (id: SelectedOccasionId) => void;
  onCreateLook: () => void;
  isGenerating?: boolean;
  wardrobeLoading?: boolean;
  wardrobeEmpty?: boolean;
};

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

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.accentLineWrap}>
          <GoldShimmerLine width={200} />
        </View>
        <Text style={styles.title}>{t.home.occasionTitle}</Text>
        <Text style={styles.subtitle}>{t.home.occasionSubtitle}</Text>

        <View style={styles.grid}>
          {SELECTED_OCCASION_ORDER.map((id, index) => {
            const active = value === id;
            const copy = t.home.occasions[id];
            return (
              <Animated.View key={id} entering={FadeInDown.delay(index * 35).duration(320)}>
                <Pressable
                  onPress={() => handleSelect(id)}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.chipPressed,
                  ]}>
                  <Ionicons
                    name={OCCASION_ICONS[id]}
                    size={18}
                    color={active ? StyloveColors.ivory : StyloveColors.burgundy}
                  />
                  <Text style={[styles.chipTitle, active && styles.chipTitleActive]}>{copy.title}</Text>
                  <Text style={[styles.chipSubtitle, active && styles.chipSubtitleActive]}>
                    {copy.subtitle}
                  </Text>
                </Pressable>
              </Animated.View>
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
  subtitle: {
    fontSize: 13,
    color: StyloveColors.gray,
    textAlign: 'center',
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  chip: {
    width: '48%',
    minHeight: 88,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: StyloveColors.creamMuted,
    backgroundColor: StyloveColors.cream,
    gap: 4,
  },
  chipActive: {
    backgroundColor: StyloveColors.burgundy,
    borderColor: StyloveColors.burgundy,
  },
  chipPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  chipTitle: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    color: StyloveColors.burgundy,
  },
  chipTitleActive: {
    color: StyloveColors.ivory,
  },
  chipSubtitle: {
    fontSize: 10,
    color: StyloveColors.grayLight,
    lineHeight: 14,
  },
  chipSubtitleActive: {
    color: StyloveColors.cream,
  },
  hint: {
    fontSize: 12,
    color: StyloveColors.grayLight,
    textAlign: 'center',
  },
});
