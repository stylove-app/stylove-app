import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { SoftEnter } from '@/components/ui/soft-enter';
import { useTheme } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';

type LoadingOverlayProps = {
  label: string;
  inline?: boolean;
};

export function LoadingOverlay({ label, inline }: LoadingOverlayProps) {
  const { colors } = useTheme();

  return (
    <SoftEnter>
      <View style={[styles.wrap, inline && styles.inline]}>
        <GoldShimmerLine width={36} />
        <ActivityIndicator color={colors.goldMuted} size="small" />
        <Text style={[styles.label, { color: colors.gray }]}>{label}</Text>
      </View>
    </SoftEnter>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  inline: {
    paddingVertical: 12,
  },
  label: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
});
