import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { AboutStyloveSheet } from '@/components/profile/about-stylove-sheet';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme } from '@/contexts/theme-context';
import { hapticLight } from '@/lib/haptics';
import { Fonts } from '@/constants/theme';

type AboutStyloveSectionProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

export function AboutStyloveSection({ open: controlledOpen, onOpenChange, onLayout }: AboutStyloveSectionProps) {
  const t = useTranslation();
  const { colors, isDark } = useTheme();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;

  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
  };

  return (
    <View style={styles.section} onLayout={onLayout}>
      <Text style={[styles.sectionTitle, { color: colors.grayLight }]}>{t.about.sectionTitle}</Text>
      <Pressable
        onPress={() => {
          void hapticLight();
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isDark ? colors.cardElevated : colors.white,
            borderColor: isDark ? 'rgba(196,160,98,0.18)' : colors.creamMuted,
          },
          pressed && styles.cardPressed,
        ]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.wineDeep }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.goldSoft} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.creamText : colors.black }]}>
            {t.about.title}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.gray }]}>{t.about.cardSubtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.grayLight} />
      </Pressable>

      <AboutStyloveSheet visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
