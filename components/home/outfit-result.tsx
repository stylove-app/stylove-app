import { Image } from 'expo-image';
import { Share, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { EditorialReasoningBlock } from '@/components/home/editorial-reasoning';
import { LuxuryScoreCards } from '@/components/home/luxury-score-cards';
import { MissingPieces } from '@/components/home/missing-pieces';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { softFadeIn, softFadeInDown, softFadeInUp } from '@/constants/luxury-motion';
import type { CuratedLook } from '@/lib/outfit-engine';
import { hapticSuccess } from '@/lib/haptics';
import { computeLuxuryScores } from '@/lib/luxury-scores';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/contexts/locale-context';

type OutfitResultProps = {
  look: CuratedLook;
  onReplace: () => void;
  onSave: () => void;
  isSaved?: boolean;
  isSaving?: boolean;
  aura?: string;
  onShare?: () => void;
};

export function OutfitResult({ look, onReplace, onSave, isSaved, isSaving, aura, onShare }: OutfitResultProps) {
  const t = useTranslation();
  const { colors, isDark } = useTheme();

  const scores =
    look.luxuryScores ??
    computeLuxuryScores(look.mood, look.createdAt, undefined, look.eventContext);

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }
    try {
      await Share.share({
        message: `${t.share.message}\n\n${look.title}\n${aura ?? look.whyThisWorks ?? ''}`,
      });
    } catch {
      // User dismissed
    }
  };

  return (
    <Animated.View entering={softFadeIn(0)} style={styles.wrapper}>
      <Animated.View entering={softFadeInDown(80)}>
        <Text style={[styles.curatedLabel, { color: colors.goldMuted }]}>{t.home.preparedForYou}</Text>
        <Text style={[styles.curatedSub, { color: isDark ? colors.creamText : colors.blackSoft }]}>
          {t.home.curatedFor} · {look.occasion}
        </Text>
        {look.eventContext?.venue ? (
          <Text style={[styles.eventLine, { color: colors.goldSoft }]}>
            {look.eventContext.venue} · {look.eventContext.vibe}
          </Text>
        ) : null}
      </Animated.View>

      <Animated.View
        entering={softFadeInUp(160)}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.cardDark : colors.cardDark,
            borderColor: 'rgba(196,160,98,0.16)',
          },
          StyloveShadow.editorial,
        ]}>
        <Animated.View entering={softFadeInDown(240)}>
          <View
            style={[
              styles.imageWrap,
              look.usesWardrobeImage && styles.imageWrapWardrobe,
            ]}>
            <Image
              source={{ uri: look.image }}
              style={styles.image}
              contentFit={look.usesWardrobeImage ? 'contain' : 'cover'}
              transition={600}
            />
            {!look.usesWardrobeImage ? <View style={styles.imageVeil} /> : null}
            <View style={[styles.scoreWrap, { borderColor: colors.creamRich }]}>
              <Text style={[styles.scoreLabel, { color: colors.gray }]}>{t.outfit.elegance}</Text>
              <Text style={[styles.scoreValue, { color: colors.burgundyRich }]}>{look.eleganceScore}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.body}>
          <Animated.View entering={softFadeInDown(320)}>
            <Text style={[styles.title, { color: colors.creamText }]}>{look.title}</Text>
            <Text style={[styles.description, { color: colors.grayLight }]}>{look.description}</Text>
            {look.wardrobeHint ? (
              <Text style={[styles.wardrobeHint, { color: colors.goldMuted }]}>{look.wardrobeHint}</Text>
            ) : null}
          </Animated.View>

          <LuxuryScoreCards scores={scores} />

          {look.weatherStyling ? (
            <Animated.View entering={softFadeInDown(400)} style={styles.block}>
              <Text style={[styles.blockLabel, { color: colors.goldSoft }]}>{t.outfit.weatherStyling}</Text>
              <Text style={[styles.blockText, { color: colors.creamText }]}>{look.weatherStyling}</Text>
            </Animated.View>
          ) : null}

          {look.editorialReasoning ? (
            <EditorialReasoningBlock reasoning={look.editorialReasoning} />
          ) : look.whyThisWorks ? (
            <Animated.View entering={softFadeInDown(480)} style={styles.block}>
              <Text style={[styles.blockLabel, { color: colors.goldSoft }]}>{t.outfit.whyThisWorks}</Text>
              <Text style={[styles.blockText, { color: colors.creamText }]}>{look.whyThisWorks}</Text>
            </Animated.View>
          ) : null}

          {look.missingPieces ? <MissingPieces pieces={look.missingPieces} /> : null}

          <Animated.View entering={softFadeInDown(560)} style={styles.vibeRow}>
            {look.vibes.map((vibe) => (
              <View
                key={vibe}
                style={[styles.vibe, { backgroundColor: colors.cardElevated, borderColor: 'rgba(196,160,98,0.15)' }]}>
                <Text style={[styles.vibeText, { color: colors.creamText }]}>{vibe}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={softFadeInDown(640)} style={styles.actions}>
            <LuxuryButton
              label={t.outfit.replaceLook}
              onPress={onReplace}
              variant="ghost"
              style={styles.btn}
            />
            <LuxuryButton
              label={isSaved ? t.outfit.saved : isSaving ? t.loading.savingLook : t.outfit.saveLook}
              onPress={() => {
                if (isSaved || isSaving) return;
                void hapticSuccess();
                onSave();
              }}
              variant={isSaved ? 'ghost' : 'gold'}
              style={styles.btn}
              disabled={isSaved || isSaving}
            />
          </Animated.View>
          <Animated.View entering={softFadeInDown(720)}>
            <LuxuryButton label={t.share.shareAura} onPress={handleShare} variant="secondary" small />
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  curatedLabel: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  curatedSub: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  eventLine: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageWrap: {
    height: 360,
    position: 'relative',
  },
  imageWrapWardrobe: {
    backgroundColor: '#F5F0E6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wardrobeHint: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 8,
  },
  imageVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,15,15,0.15)',
  },
  scoreWrap: {
    position: 'absolute',
    top: 22,
    right: 22,
    alignItems: 'center',
    backgroundColor: 'rgba(255,250,242,0.94)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  scoreLabel: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  scoreValue: {
    fontFamily: Fonts.serif,
    fontSize: 30,
  },
  body: {
    padding: 26,
    gap: 14,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    letterSpacing: 0.3,
    lineHeight: 34,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  block: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196,160,98,0.12)',
    paddingTop: 16,
  },
  blockLabel: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  blockText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Fonts.serif,
    opacity: 0.92,
  },
  vibeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  vibe: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  vibeText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
  },
});
