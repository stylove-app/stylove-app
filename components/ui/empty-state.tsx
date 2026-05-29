import { StyleSheet, Text, View } from 'react-native';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { SoftEnter } from '@/components/ui/soft-enter';
import { useTheme } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  subtitle: string;
  compact?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryLoading?: boolean;
};

export function EmptyState({
  title,
  subtitle,
  compact,
  actionLabel,
  onAction,
  actionLoading,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryLoading,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <SoftEnter>
      <View style={[styles.wrap, compact && styles.compact]}>
        <View
          style={[
            styles.frame,
            {
              borderColor: 'rgba(196,160,98,0.14)',
              backgroundColor: colors.ivory,
            },
          ]}>
          <View style={styles.glow} />
          <GoldShimmerLine width={32} />
          <Text style={[styles.title, { color: colors.black }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.gray }]}>{subtitle}</Text>
          {actionLabel && onAction ? (
            <LuxuryButton
              label={actionLabel}
              onPress={onAction}
              variant="secondary"
              small
              disabled={actionLoading || secondaryLoading}
              style={styles.action}
            />
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <LuxuryButton
              label={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="ghost"
              small
              disabled={actionLoading || secondaryLoading}
              style={styles.secondaryAction}
            />
          ) : null}
        </View>
      </View>
    </SoftEnter>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  compact: {
    paddingVertical: 20,
  },
  frame: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: 120,
    height: 80,
    borderRadius: 60,
    backgroundColor: 'rgba(196,160,98,0.06)',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 21,
    maxWidth: 280,
  },
  action: {
    marginTop: 8,
    minWidth: 160,
  },
  secondaryAction: {
    minWidth: 160,
  },
});
