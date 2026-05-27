import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { LuxuryModalFrame } from '@/components/ui/luxury-modal-frame';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

type LuxuryConfirmationModalProps = {
  visible: boolean;
  title: string;
  subtitle: string;
  buttonLabel: string;
  onClose: () => void;
  variant?: 'light' | 'dark';
};

export function LuxuryConfirmationModal({
  visible,
  title,
  subtitle,
  buttonLabel,
  onClose,
  variant = 'light',
}: LuxuryConfirmationModalProps) {
  const insets = useSafeAreaInsets();
  const isDark = variant === 'dark';

  return (
    <LuxuryModalFrame
      visible={visible}
      onClose={onClose}
      align="bottom"
      sheetStyle={{ marginBottom: insets.bottom + 24 }}>
      <Pressable onPress={(e) => e.stopPropagation()}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? StyloveColors.wineDeep : StyloveColors.white,
              borderColor: isDark ? 'rgba(196, 160, 98, 0.25)' : StyloveColors.creamRich,
            },
            StyloveShadow.editorial,
          ]}>
          <GoldShimmerLine width={32} />
          <Text style={[styles.title, { color: isDark ? StyloveColors.creamText : StyloveColors.black }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? 'rgba(248,244,237,0.75)' : StyloveColors.gray }]}>
            {subtitle}
          </Text>
          <LuxuryButton label={buttonLabel} onPress={onClose} variant="gold" />
        </View>
      </Pressable>
    </LuxuryModalFrame>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    gap: 14,
    alignItems: 'stretch',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8,
  },
});
