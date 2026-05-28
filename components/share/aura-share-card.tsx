import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

import { StyloveLogo } from '@/components/brand/stylove-logo';
import { useTranslation } from '@/contexts/locale-context';
import type { CuratedLook } from '@/lib/outfit-engine';
import { Fonts } from '@/constants/theme';

export type AuraShareThemeId = 'noir' | 'ivory' | 'espresso';

type AuraShareCardProps = {
  look: CuratedLook;
  theme: AuraShareThemeId;
  width: number;
};

const THEME_STYLES: Record<
  AuraShareThemeId,
  {
    background: string;
    panel: string;
    text: string;
    muted: string;
    accent: string;
    imageBackground: string;
    logoVariant: 'light' | 'dark';
  }
> = {
  noir: {
    background: '#080607',
    panel: 'rgba(255,250,242,0.06)',
    text: '#F5EDE0',
    muted: 'rgba(245,237,224,0.68)',
    accent: '#D4B878',
    imageBackground: '#F5F0E6',
    logoVariant: 'light',
  },
  ivory: {
    background: '#F5F0E6',
    panel: 'rgba(74,14,24,0.06)',
    text: '#241418',
    muted: 'rgba(36,20,24,0.66)',
    accent: '#8A5E2F',
    imageBackground: '#FFF7EC',
    logoVariant: 'dark',
  },
  espresso: {
    background: '#1B1210',
    panel: 'rgba(196,160,98,0.09)',
    text: '#F3E5D2',
    muted: 'rgba(243,229,210,0.67)',
    accent: '#C99A5A',
    imageBackground: '#2A1A17',
    logoVariant: 'light',
  },
};

export function AuraShareCard({ look, theme, width }: AuraShareCardProps) {
  const t = useTranslation();
  const palette = THEME_STYLES[theme];
  const selectedPieces = look.completeOutfit?.slice(0, 5) ?? [];
  const tags = look.vibes.slice(0, 4);

  return (
    <Animated.View
      entering={FadeInUp.duration(780).springify().damping(18)}
      style={[
        styles.card,
        {
          width,
          backgroundColor: palette.background,
        },
      ]}>
      <View style={[styles.glow, { backgroundColor: palette.accent }]} />
      <Animated.View entering={ZoomIn.duration(700)} style={styles.logoWrap}>
        <StyloveLogo size="sm" variant={palette.logoVariant} />
      </Animated.View>

      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>{look.occasion}</Text>
        <Text style={[styles.title, { color: palette.text }]}>{look.title}</Text>
        <Text style={[styles.vibe, { color: palette.muted }]}>{tags.join(' · ')}</Text>
      </View>

      <View style={[styles.imagePanel, { backgroundColor: palette.imageBackground }]}>
        <Image
          source={{ uri: look.image }}
          style={styles.heroImage}
          contentFit={look.usesWardrobeImage ? 'contain' : 'cover'}
          transition={500}
        />
      </View>

      <View style={[styles.copyPanel, { backgroundColor: palette.panel, borderColor: `${palette.accent}33` }]}>
        <Text style={[styles.panelLabel, { color: palette.accent }]}>{t.share.commentaryLabel}</Text>
        <Text style={[styles.commentary, { color: palette.text }]} numberOfLines={4}>
          {look.whyThisWorks || look.description}
        </Text>
      </View>

      {selectedPieces.length > 0 ? (
        <View style={styles.pieces}>
          <Text style={[styles.panelLabel, { color: palette.accent }]}>{t.share.itemsLabel}</Text>
          {selectedPieces.map((piece) => (
            <Text key={piece.id} style={[styles.pieceText, { color: palette.muted }]} numberOfLines={1}>
              {piece.label} · {piece.item.name}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.tags}>
        {tags.map((tag) => (
          <View key={tag} style={[styles.tag, { borderColor: `${palette.accent}44` }]}>
            <Text style={[styles.tagText, { color: palette.text }]}>{tag}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 9 / 16,
    borderRadius: 34,
    overflow: 'hidden',
    padding: 24,
    justifyContent: 'space-between',
  },
  glow: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.18,
  },
  logoWrap: {
    alignItems: 'center',
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: 0.2,
  },
  vibe: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  imagePanel: {
    height: '38%',
    borderRadius: 28,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  copyPanel: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 6,
  },
  panelLabel: {
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  commentary: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    lineHeight: 21,
  },
  pieces: {
    gap: 4,
  },
  pieceText: {
    fontSize: 11,
    lineHeight: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
