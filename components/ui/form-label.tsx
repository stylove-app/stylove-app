import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';

type FormLabelProps = TextProps & {
  color: string;
};

/** Short Turkish field labels (Ad, Soyad) — sans-serif, no uppercase spacing tricks. */
export function FormLabel({ color, style, children, ...rest }: FormLabelProps) {
  return (
    <Text style={[styles.label, { color }, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
  },
});
