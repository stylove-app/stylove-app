import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { hapticLight } from '@/lib/haptics';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';

type LuxuryButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold';
  style?: ViewStyle;
  small?: boolean;
  disabled?: boolean;
};

export function LuxuryButton({
  label,
  onPress,
  variant = 'primary',
  style,
  small = false,
  disabled = false,
}: LuxuryButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        void hapticLight();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'gold' && styles.gold,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text
        style={[
          styles.label,
          small && styles.labelSmall,
          variant === 'primary' && styles.labelPrimary,
          variant === 'secondary' && styles.labelSecondary,
          variant === 'ghost' && styles.labelGhost,
          variant === 'gold' && styles.labelGold,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primary: {
    backgroundColor: StyloveColors.burgundy,
    ...StyloveShadow.soft,
  },
  secondary: {
    backgroundColor: StyloveColors.white,
    borderWidth: 1,
    borderColor: StyloveColors.creamMuted,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: StyloveColors.creamMuted,
  },
  gold: {
    backgroundColor: StyloveColors.goldMuted,
    ...StyloveShadow.soft,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  labelSmall: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  labelPrimary: {
    color: StyloveColors.ivory,
  },
  labelSecondary: {
    color: StyloveColors.black,
  },
  labelGhost: {
    color: StyloveColors.gray,
  },
  labelGold: {
    color: StyloveColors.wineDeep,
  },
});
