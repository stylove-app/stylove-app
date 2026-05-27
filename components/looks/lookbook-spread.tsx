import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { StyloveLogo } from '@/components/brand/stylove-logo';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { useTranslation } from '@/contexts/locale-context';
import type { CuratedLook } from '@/lib/outfit-engine';
import { hapticLight } from '@/lib/haptics';
import { Fonts } from '@/constants/theme';

type LookbookSpreadProps = {
  look: CuratedLook;
  index: number;
  onPress?: () => void;
  onDelete?: () => void;
};

export function LookbookSpread({ look, index, onPress, onDelete }: LookbookSpreadProps) {
  const t = useTranslation();
  const { colors, isDark } = useTheme();

  const content = (
    <>
        <View style={styles.spreadHeader}>
          <Text style={[styles.spreadLabel, { color: colors.goldMuted }]}>{t.looks.spread}</Text>
          <View style={styles.headerRight}>
            <Text style={[styles.spreadIndex, { color: colors.grayLight }]}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            {onDelete ? (
              <Pressable
                onPress={() => {
                  void hapticLight();
                  onDelete();
                }}
                style={({ pressed }) => [styles.deleteBtn, pressed && styles.deletePressed]}
                hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={colors.burgundy} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={styles.imageFrame}>
          <Image source={{ uri: look.image }} style={styles.image} contentFit="cover" transition={500} />
          <View style={styles.veil} />
        </View>
        <View style={styles.meta}>
          <Text style={[styles.title, { color: isDark ? colors.creamText : colors.black }]}>{look.title}</Text>
          <Text style={[styles.occasion, { color: colors.gray }]}>{look.occasion}</Text>
          <Text style={[styles.description, { color: colors.grayLight }]} numberOfLines={3}>
            {look.description}
          </Text>
          {look.eventContext?.venue ? (
            <Text style={[styles.venue, { color: colors.goldSoft }]}>
              {look.eventContext.venue} · {look.eventContext.dressCode}
            </Text>
          ) : null}
        </View>
    </>
  );

  const cardStyle = [
    styles.spread,
    {
      backgroundColor: isDark ? colors.cardDark : colors.white,
      borderColor: isDark ? 'rgba(196,160,98,0.15)' : colors.creamRich,
    },
    StyloveShadow.editorial,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && styles.pressed]}>
        <Animated.View entering={FadeInUp.duration(800).delay(index * 100)}>{content}</Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(800).delay(index * 100)} style={cardStyle}>
      {content}
    </Animated.View>
  );
}

type AuraShareCardProps = {
  look: CuratedLook;
  aura: string;
};

/** Social-ready vertical story card — export via Share API. */
export function AuraShareCard({ look, aura }: AuraShareCardProps) {
  const t = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.shareCard, { backgroundColor: colors.wineDeep }]}>
      <View style={[styles.shareGradientTop, { backgroundColor: colors.burgundyRich }]} />
      <StyloveLogo size="sm" variant="light" />
      <Text style={[styles.shareAura, { color: colors.creamText }]}>{aura}</Text>
      <View style={styles.shareImageWrap}>
        <Image source={{ uri: look.image }} style={styles.shareImage} contentFit="cover" />
      </View>
      <Text style={[styles.shareTitle, { color: colors.creamText }]}>{look.title}</Text>
      <Text style={[styles.shareScore, { color: colors.goldSoft }]}>
        {look.luxuryScores?.elegance ?? look.eleganceScore} · {t.scores.elegance}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  spread: {
    marginHorizontal: 24,
    marginBottom: 28,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  spreadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spreadLabel: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  spreadIndex: {
    fontFamily: Fonts.serif,
    fontSize: 14,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 240, 230, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 98, 0.2)',
  },
  deletePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  imageFrame: {
    height: 320,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,15,15,0.12)',
  },
  meta: {
    padding: 22,
    gap: 6,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    lineHeight: 32,
  },
  occasion: {
    fontSize: 12,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginTop: 4,
  },
  venue: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  shareCard: {
    width: 280,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  shareGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    opacity: 0.5,
  },
  shareAura: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  shareImageWrap: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareImage: {
    width: '100%',
    height: '100%',
  },
  shareTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    textAlign: 'center',
  },
  shareScore: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
