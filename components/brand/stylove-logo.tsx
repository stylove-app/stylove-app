import { StyleSheet, Text, View } from 'react-native';

import { HeartEmblem } from '@/components/brand/heart-emblem';
import { BRAND_NAME } from '@/constants/brand';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

type StyloveLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
  showEmblem?: boolean;
};

const SIZES = {
  sm: { fontSize: 20, emblem: 14, gap: 6 },
  md: { fontSize: 28, emblem: 20, gap: 8 },
  lg: { fontSize: 34, emblem: 24, gap: 9 },
};

export function StyloveLogo({
  size = 'md',
  variant = 'dark',
  showEmblem = true,
}: StyloveLogoProps) {
  const s = SIZES[size];
  const textColor = variant === 'light' ? StyloveColors.creamText : StyloveColors.black;
  const emblemColor = variant === 'light' ? StyloveColors.goldSoft : StyloveColors.burgundy;

  return (
    <View style={[styles.row, { gap: s.gap }]} accessibilityLabel={BRAND_NAME}>
      {showEmblem ? <HeartEmblem size={s.emblem} color={emblemColor} /> : null}
      <Text style={[styles.wordmark, { fontSize: s.fontSize, color: textColor }]}>{BRAND_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: Fonts.serif,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
});
