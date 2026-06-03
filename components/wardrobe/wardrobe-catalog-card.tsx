import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/contexts/locale-context';

type WardrobeCatalogCardProps = {
  imageUri: string;
  name?: string;
  categoryLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  isPreparing?: boolean;
};

const SIZES = {
  sm: { aspectRatio: 3 / 4, imagePadding: 10, radius: 16, nameSize: 13 },
  md: { aspectRatio: 3 / 4, imagePadding: 12, radius: 18, nameSize: 14 },
  lg: { aspectRatio: 4 / 5, imagePadding: 16, radius: 20, nameSize: 15 },
} as const;

/** Luxury catalog card for wardrobe pieces — editorial cream backdrop and object-focus framing. */
export function WardrobeCatalogCard({
  imageUri,
  name,
  categoryLabel,
  size = 'md',
  isPreparing = false,
}: WardrobeCatalogCardProps) {
  const t = useTranslation();
  const s = SIZES[size];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          {
            aspectRatio: s.aspectRatio,
            borderRadius: s.radius,
          },
        ]}>
        <View style={styles.editorialSurface}>
          <Image
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={28}
            transition={300}
          />
          <View style={styles.creamWash} />
          <View style={styles.warmGlow} />

          {isPreparing ? (
            <View style={styles.preparingOverlay}>
              <ActivityIndicator color={StyloveColors.goldMuted} size="small" />
              <Text style={styles.preparingText}>{t.wardrobe.preparingPiece}</Text>
            </View>
          ) : (
            <View style={[styles.focusStage, { padding: s.imagePadding }]}>
              <Image
                source={{ uri: imageUri }}
                style={styles.focusImage}
                contentFit="contain"
                transition={400}
              />
            </View>
          )}

          <View style={styles.vignetteTop} pointerEvents="none" />
          <View style={styles.vignetteBottom} pointerEvents="none" />
        </View>

        {categoryLabel && !isPreparing ? (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{categoryLabel}</Text>
          </View>
        ) : null}
      </View>

      {name ? (
        <Text style={[styles.name, { fontSize: s.nameSize }]} numberOfLines={1}>
          {name}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  card: {
    overflow: 'hidden',
    backgroundColor: StyloveColors.cream,
    borderWidth: 1,
    borderColor: StyloveColors.creamRich,
    ...StyloveShadow.editorial,
  },
  editorialSurface: {
    flex: 1,
    backgroundColor: StyloveColors.ivory,
    overflow: 'hidden',
  },
  creamWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 240, 230, 0.88)',
  },
  warmGlow: {
    position: 'absolute',
    top: '18%',
    left: '12%',
    right: '12%',
    bottom: '22%',
    backgroundColor: 'rgba(255, 250, 242, 0.45)',
    borderRadius: 999,
  },
  focusStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusImage: {
    width: '100%',
    height: '100%',
  },
  preparingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 240, 230, 0.92)',
  },
  preparingText: {
    fontFamily: Fonts.serif,
    fontSize: 13,
    fontStyle: 'italic',
    color: StyloveColors.burgundy,
    letterSpacing: 0.3,
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '22%',
    backgroundColor: 'rgba(237, 228, 211, 0.35)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '18%',
    backgroundColor: 'rgba(212, 196, 168, 0.2)',
  },
  categoryTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 252, 247, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 98, 0.2)',
  },
  categoryTagText: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: StyloveColors.burgundy,
  },
  name: {
    fontFamily: Fonts.serif,
    color: StyloveColors.black,
    paddingHorizontal: 4,
    marginTop: 8,
  },
});
