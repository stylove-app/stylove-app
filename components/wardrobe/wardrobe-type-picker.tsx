import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/contexts/locale-context';
import type { WardrobeItemTypeId } from '@/i18n/types';
import { WARDROBE_TYPE_GROUPS } from '@/lib/wardrobe-item-types';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

type WardrobeTypePickerProps = {
  value: WardrobeItemTypeId | null;
  onChange: (type: WardrobeItemTypeId) => void;
};

export function WardrobeTypePicker({ value, onChange }: WardrobeTypePickerProps) {
  const t = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t.wardrobe.chooseType}</Text>
      <ScrollView
        style={styles.scroll}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {WARDROBE_TYPE_GROUPS.map((group) => (
          <View key={group.category} style={styles.section}>
            <Text style={styles.sectionTitle}>{t.categories[group.category]}</Text>
            <View style={styles.chipGrid}>
              {group.types.map((type) => {
                const active = value !== null && value === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => onChange(type)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && styles.chipPressed,
                    ]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {t.wardrobeTypes[type]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontFamily: Fonts.serif,
    fontSize: 13,
    color: StyloveColors.burgundy,
    letterSpacing: 0.3,
  },
  scroll: {
    maxHeight: 220,
  },
  section: {
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: StyloveColors.grayLight,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: StyloveColors.creamMuted,
    backgroundColor: StyloveColors.ivory,
  },
  chipActive: {
    backgroundColor: StyloveColors.burgundy,
    borderColor: StyloveColors.burgundy,
  },
  chipPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  chipText: {
    fontSize: 12,
    color: StyloveColors.gray,
  },
  chipTextActive: {
    color: StyloveColors.ivory,
  },
});
