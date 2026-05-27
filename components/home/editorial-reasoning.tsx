import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { softFadeInDown } from '@/constants/luxury-motion';
import { useTheme } from '@/contexts/theme-context';
import { useTranslation } from '@/contexts/locale-context';
import type { EditorialReasoning } from '@/lib/editorial-reasoning';
import { Fonts } from '@/constants/theme';

type EditorialReasoningBlockProps = {
  reasoning: EditorialReasoning;
};

function ReasonLine({ label, text, colors }: { label: string; text: string; colors: { gold: string; body: string } }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, { color: colors.gold }]}>{label}</Text>
      <Text style={[styles.lineText, { color: colors.body }]}>{text}</Text>
    </View>
  );
}

export function EditorialReasoningBlock({ reasoning }: EditorialReasoningBlockProps) {
  const t = useTranslation();
  const { colors, isDark } = useTheme();

  const palette = {
    gold: colors.goldSoft,
    body: isDark ? colors.creamText : colors.creamText,
  };

  return (
    <Animated.View entering={softFadeInDown(440)} style={styles.wrap}>
      <Text style={[styles.title, { color: colors.goldMuted }]}>{t.editorial.title}</Text>
      <ReasonLine label={t.editorial.colorHarmony} text={reasoning.colorHarmony} colors={palette} />
      <ReasonLine label={t.editorial.weatherCompatibility} text={reasoning.weatherCompatibility} colors={palette} />
      <ReasonLine label={t.editorial.emotionalTone} text={reasoning.emotionalTone} colors={palette} />
      <ReasonLine label={t.editorial.silhouetteBalance} text={reasoning.silhouetteBalance} colors={palette} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196,160,98,0.12)',
    paddingTop: 18,
  },
  title: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  line: {
    gap: 4,
  },
  lineLabel: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  lineText: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.92,
  },
});
