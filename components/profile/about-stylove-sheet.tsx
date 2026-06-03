import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { LuxuryModalFrame } from '@/components/ui/luxury-modal-frame';
import { softFadeInDown } from '@/constants/luxury-motion';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';

type AboutStyloveSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const PILLAR_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'albums-outline',
  'shirt-outline',
  'sparkles-outline',
  'cloud-outline',
  'diamond-outline',
];

export function AboutStyloveSheet({ visible, onClose }: AboutStyloveSheetProps) {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <LuxuryModalFrame
      visible={visible}
      onClose={onClose}
      align="top"
      sheetStyle={{ marginTop: insets.top + 40, flex: 1, paddingBottom: insets.bottom + 20 }}>
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: isDark ? colors.cardDark : colors.white,
            borderColor: colors.creamRich,
          },
          StyloveShadow.editorial,
        ]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.goldMuted }]}>{t.about.eyebrow}</Text>
            <Text style={[styles.title, { color: isDark ? colors.creamText : colors.black }]}>
              {t.about.title}
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.gray} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <Animated.Text
            entering={softFadeInDown(80)}
            style={[styles.intro, { color: colors.gray }]}>
            {t.about.intro}
          </Animated.Text>

          <View style={styles.pillars}>
            {t.about.items.map((item, index) => (
              <Animated.View
                key={item.title}
                entering={softFadeInDown(120 + index * 70)}
                style={[
                  styles.pillar,
                  {
                    backgroundColor: isDark ? colors.cardElevated : colors.ivory,
                    borderColor: isDark ? 'rgba(196,160,98,0.14)' : colors.creamMuted,
                  },
                ]}>
                <View style={[styles.iconWrap, { backgroundColor: colors.wineDeep }]}>
                  <Ionicons
                    name={PILLAR_ICONS[index] ?? 'ellipse-outline'}
                    size={15}
                    color={colors.goldSoft}
                  />
                </View>
                <View style={styles.pillarCopy}>
                  <Text style={[styles.pillarTitle, { color: isDark ? colors.creamText : colors.black }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.pillarDesc, { color: colors.gray }]}>{item.description}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={softFadeInDown(500)} style={styles.travelSection}>
            <GoldShimmerLine width={40} />
            <View style={styles.travelHeader}>
              <View style={[styles.travelIconWrap, { backgroundColor: colors.wineDeep }]}>
                <Ionicons name="airplane-outline" size={14} color={colors.goldSoft} />
              </View>
              <View style={styles.travelHeaderCopy}>
                <Text style={[styles.travelBadge, { color: colors.goldMuted }]}>{t.about.travel.badge}</Text>
                <Text style={[styles.travelTitle, { color: isDark ? colors.creamText : colors.black }]}>
                  {t.about.travel.title}
                </Text>
              </View>
            </View>
            <Text style={[styles.travelIntro, { color: colors.gray }]}>{t.about.travel.intro}</Text>
            <View style={styles.travelPoints}>
              {t.about.travel.points.map((point, index) => (
                <Animated.View
                  key={point}
                  entering={softFadeInDown(560 + index * 50)}
                  style={styles.travelPointRow}>
                  <View style={[styles.travelDot, { backgroundColor: colors.goldMuted }]} />
                  <Text style={[styles.travelPoint, { color: colors.gray }]}>{point}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          <Animated.Text
            entering={softFadeInDown(820)}
            style={[styles.closing, { color: colors.goldMuted }]}>
            {t.about.closing}
          </Animated.Text>
        </ScrollView>
      </View>
    </LuxuryModalFrame>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(196, 160, 98, 0.14)',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    lineHeight: 30,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 24,
    gap: 28,
  },
  intro: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  pillars: {
    gap: 14,
  },
  pillar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarCopy: {
    flex: 1,
    gap: 3,
  },
  pillarTitle: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  pillarDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  travelSection: {
    gap: 16,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196, 160, 98, 0.14)',
  },
  travelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  travelIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  travelHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  travelBadge: {
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  travelTitle: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    letterSpacing: 0.2,
  },
  travelIntro: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  travelPoints: {
    gap: 12,
  },
  travelPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  travelDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 7,
    opacity: 0.7,
  },
  travelPoint: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  closing: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: 4,
  },
});
