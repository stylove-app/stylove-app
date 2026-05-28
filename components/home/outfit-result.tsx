import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { EditorialReasoningBlock } from '@/components/home/editorial-reasoning';
import { MissingPieces } from '@/components/home/missing-pieces';
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
  const { height, width } = useWindowDimensions();
  const [preview, setPreview] = useState<{ uri: string; name: string } | null>(null);
  const previewImageHeight = Math.min(height * 0.68, width * 1.25);
  const previewPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dy) > 18 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > 80) setPreview(null);
        },
      }),
    [],
  );

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
          <Animated.View entering={softFadeInDown(320)}>
            <Text style={[styles.title, { color: colors.creamText }]}>{look.title}</Text>
            <Text style={[styles.description, { color: colors.grayLight }]}>{look.description}</Text>
            {look.wardrobeHint ? (
              <Text style={[styles.wardrobeHint, { color: colors.goldMuted }]}>{look.wardrobeHint}</Text>
            ) : null}
          </Animated.View>

          {look.weatherStyling ? (
            <Animated.View entering={softFadeInDown(400)} style={styles.block}>
              <Text style={[styles.blockLabel, { color: colors.goldSoft }]}>{t.outfit.weatherStyling}</Text>
              <Text style={[styles.blockText, { color: colors.creamText }]}>{look.weatherStyling}</Text>
            </Animated.View>
          ) : null}

          {look.completeOutfit && look.completeOutfit.length > 0 ? (
            <Animated.View entering={softFadeInDown(440)} style={styles.completeLookBlock}>
              <Text style={[styles.blockLabel, { color: colors.goldSoft }]}>{t.completeLook.title}</Text>
              <Text style={[styles.completeLookSubtitle, { color: colors.grayLight }]}>
                {t.completeLook.subtitle}
              </Text>
              <View style={styles.outfitGrid}>
                {look.completeOutfit.map((piece) => (
                  <Pressable
                    key={piece.id}
                    onPress={() => setPreview({ uri: piece.item.imageUri, name: piece.item.name })}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={piece.item.name}
                    style={[
                      styles.outfitPiece,
                      {
                        backgroundColor: colors.cardElevated,
                        borderColor: 'rgba(196,160,98,0.16)',
                      },
                    ]}>
                    <View style={styles.outfitImageWrap}>
                      <Image source={{ uri: piece.item.imageUri }} style={styles.outfitImage} contentFit="contain" />
                    </View>
                    <Text style={[styles.outfitRole, { color: colors.goldMuted }]}>{piece.label}</Text>
                    <Text style={[styles.outfitName, { color: colors.creamText }]} numberOfLines={2}>
                      {piece.item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {look.missingOutfitPieces && look.missingOutfitPieces.length > 0 ? (
            <Animated.View entering={softFadeInDown(470)} style={styles.block}>
              <Text style={[styles.blockLabel, { color: colors.goldSoft }]}>
                {t.completeLook.missingTitle}
              </Text>
              <Text style={[styles.completeLookSubtitle, { color: colors.grayLight }]}>
                {t.completeLook.missingSubtitle}
              </Text>
              <View style={styles.missingTextList}>
                {look.missingOutfitPieces.map((piece) => (
                  <Text key={piece} style={[styles.missingText, { color: colors.creamText }]}>
                    {piece}
                  </Text>
                ))}
              </View>
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
      <Modal
        visible={preview !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPreview(null)}>
        <View style={styles.lightbox}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreview(null)} />
          <Animated.View
            entering={softFadeInDown(40)}
            style={[
              styles.lightboxFrame,
              {
                borderColor: 'rgba(196,160,98,0.24)',
                backgroundColor: isDark ? colors.cardDark : colors.cardDark,
              },
            ]}
            {...previewPanResponder.panHandlers}>
            <View style={styles.lightboxHeader}>
              <Text style={[styles.lightboxTitle, { color: colors.creamText }]} numberOfLines={1}>
                {preview?.name}
              </Text>
              <Pressable
                onPress={() => setPreview(null)}
                accessibilityRole="button"
                accessibilityLabel={t.common.close}
                style={[styles.lightboxClose, { borderColor: 'rgba(196,160,98,0.28)' }]}>
                <Text style={[styles.lightboxCloseText, { color: colors.goldMuted }]}>×</Text>
              </Pressable>
            </View>
            <ScrollView
              style={styles.lightboxScroll}
              contentContainerStyle={styles.lightboxScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              bouncesZoom
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}>
              {preview ? (
                <Image
                  source={{ uri: preview.uri }}
                  style={[styles.lightboxImage, { height: previewImageHeight }]}
                  contentFit="contain"
                  transition={300}
                />
              ) : null}
            </ScrollView>
            <Text style={[styles.lightboxHint, { color: colors.grayLight }]}>{t.common.close}</Text>
          </Animated.View>
        </View>
      </Modal>
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
    fontSize: 12,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  blockText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Fonts.serif,
    opacity: 0.92,
  },
  completeLookBlock: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196,160,98,0.12)',
    paddingTop: 16,
  },
  completeLookSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  outfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  outfitPiece: {
    width: '47%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  outfitImageWrap: {
    height: 112,
    borderRadius: 14,
    backgroundColor: '#F5F0E6',
    overflow: 'hidden',
  },
  outfitImage: {
    width: '100%',
    height: '100%',
  },
  outfitRole: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  outfitName: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    lineHeight: 18,
  },
  lightbox: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: 'rgba(8,7,8,0.92)',
  },
  lightboxFrame: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 12,
  },
  lightboxTitle: {
    flex: 1,
    fontFamily: Fonts.serif,
    fontSize: 18,
    letterSpacing: 0.2,
  },
  lightboxClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,250,242,0.06)',
  },
  lightboxCloseText: {
    fontSize: 24,
    lineHeight: 28,
  },
  lightboxScroll: {
    borderRadius: 22,
    backgroundColor: '#F5F0E6',
  },
  lightboxScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: '100%',
  },
  lightboxHint: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  missingTextList: {
    gap: 8,
  },
  missingText: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
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
