import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SoftEnter } from '@/components/ui/soft-enter';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme } from '@/contexts/theme-context';
import { STYLE_MOODS } from '@/lib/style-mood';
import type { StyleMoodId } from '@/i18n/types';
import { Fonts } from '@/constants/theme';

type StyleMoodSelectorProps = {
  value: StyleMoodId | null;
  onChange: (mood: StyleMoodId) => void;
};

export function StyleMoodSelector({ value, onChange }: StyleMoodSelectorProps) {
  const t = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <SoftEnter delay={60}>
      <View style={styles.wrap}>
        <Text style={[styles.label, { color: colors.grayLight }]}>{t.home.moodLabel}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.row}>
          {STYLE_MOODS.map((mood) => {
            const selected = value === mood;
            return (
              <Pressable
                key={mood}
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
                  onChange(mood);
                }}
                style={({ pressed }) => [
                  styles.pill,
                  {
                    backgroundColor: selected
                      ? colors.burgundy
                      : isDark
                        ? colors.cardElevated
                        : colors.white,
                    borderColor: selected ? colors.goldMuted : colors.creamMuted,
                  },
                  pressed && styles.pillPressed,
                ]}>
                <Text
                  style={[
                    styles.pillText,
                    { color: selected ? colors.creamText : colors.gray },
                  ]}>
                  {t.home.moods[mood]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SoftEnter>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 10,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  row: {
    gap: 8,
    paddingRight: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillPressed: {
    opacity: 0.88,
  },
  pillText: {
    fontFamily: Fonts.serif,
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
