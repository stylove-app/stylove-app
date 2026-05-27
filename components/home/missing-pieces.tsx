import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { softFadeInDown } from '@/constants/luxury-motion';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { useTranslation } from '@/contexts/locale-context';
import type { MissingPiece } from '@/lib/editorial-reasoning';
import { Fonts } from '@/constants/theme';

type MissingPiecesProps = {
  pieces: MissingPiece[];
};

export function MissingPieces({ pieces }: MissingPiecesProps) {
  const t = useTranslation();
  const { colors, isDark } = useTheme();

  if (pieces.length === 0) return null;

  return (
    <Animated.View entering={softFadeInDown(520)} style={styles.wrap}>
      <Text style={[styles.title, { color: colors.goldMuted }]}>{t.missingPieces.title}</Text>
      <Text style={[styles.subtitle, { color: colors.grayLight }]}>{t.missingPieces.subtitle}</Text>
      <View style={styles.grid}>
        {pieces.map((piece, index) => (
          <Animated.View
            key={piece.id}
            entering={softFadeInDown(560 + index * 70)}
            style={[
              styles.chip,
              {
                backgroundColor: isDark ? colors.cardElevated : colors.ivory,
                borderColor: isDark ? 'rgba(196,160,98,0.18)' : colors.creamRich,
              },
              StyloveShadow.soft,
            ]}>
            <Text style={[styles.chipLabel, { color: colors.burgundy }]}>{piece.label}</Text>
            <Text style={[styles.chipNote, { color: colors.gray }]} numberOfLines={2}>
              {piece.note}
            </Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    gap: 8,
  },
  title: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    width: '47%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  chipLabel: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  chipNote: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
