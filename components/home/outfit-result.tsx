import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { LuxuryButton } from '@/components/ui/luxury-button';
import { softFadeIn, softFadeInDown, softFadeInUp } from '@/constants/luxury-motion';
import type { CuratedLook } from '@/lib/outfit-engine';
import { hapticSuccess } from '@/lib/haptics';
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

export function OutfitResult({ look, onReplace, onSave, isSaved, isSaving, onShare }: OutfitResultProps) {
  const t = useTranslation();
  const { colors, isDark } = useTheme();

  const handleShare = () => {
    if (onShare) {
      onShare();
      return;
    }
    router.push('/share-look');
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
            <View style={[styles.editorialBadge, { borderColor: colors.creamRich }]}>
              <Text style={[styles.editorialBadgeText, { color: colors.burgundyRich }]}>
                {t.outfit.occasion}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.body}>
          <Animated.View entering={softFadeInDown(320)} style={styles.actions}>
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
          <Animated.View entering={softFadeInDown(400)}>
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
    height: 390,
    position: 'relative',
  },
  imageWrapWardrobe: {
    backgroundColor: '#F5F0E6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,15,15,0.15)',
  },
  editorialBadge: {
    position: 'absolute',
    top: 22,
    right: 22,
    alignItems: 'center',
    backgroundColor: 'rgba(255,250,242,0.94)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  editorialBadgeText: {
    fontFamily: Fonts.serif,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  body: {
    padding: 26,
    gap: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
  },
});
