import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textGroup}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  textGroup: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    fontWeight: '400',
    color: StyloveColors.black,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 12,
    color: StyloveColors.gray,
    letterSpacing: 0.2,
    lineHeight: 17,
  },
  action: {
    fontSize: 11,
    fontWeight: '500',
    color: StyloveColors.burgundy,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
