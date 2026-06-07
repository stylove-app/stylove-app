import { StyleSheet, View } from 'react-native';

import { EditorialOnboardingColors } from '@/constants/editorial-onboarding-theme';

const B = EditorialOnboardingColors.burgundy;
const C = EditorialOnboardingColors.cream;
const I = EditorialOnboardingColors.ivory;
const S = EditorialOnboardingColors.beigeSoft;
const M = 'rgba(74, 14, 24, 0.18)';

type IllustrationProps = {
  width?: number;
  height?: number;
};

export function WardrobeIllustration({ width = 280, height = 280 }: IllustrationProps) {
  return (
    <View style={[styles.frame, { width, height }]}>
      <View style={styles.ambientOrb} />
      <View style={styles.wardrobeBody}>
        <View style={styles.wardrobeRail} />
        <View style={styles.hangerRow}>
          <HangerGarment offset={0} width={52} tone={S} />
          <HangerGarment offset={68} width={48} tone={C} />
          <HangerGarment offset={132} width={54} tone={I} />
        </View>
        <View style={styles.shelf} />
        <View style={styles.foldStack}>
          <View style={[styles.fold, styles.foldTop]} />
          <View style={[styles.fold, styles.foldMid]} />
          <View style={[styles.fold, styles.foldBottom]} />
        </View>
        <View style={styles.wardrobeDoorLeft} />
        <View style={styles.wardrobeDoorRight} />
        <View style={styles.wardrobeHandleLeft} />
        <View style={styles.wardrobeHandleRight} />
      </View>
    </View>
  );
}

export function OutfitComposeIllustration({ width = 280, height = 280 }: IllustrationProps) {
  return (
    <View style={[styles.frame, { width, height }]}>
      <View style={[styles.ambientOrb, styles.ambientOrbRight]} />
      <View style={styles.composeGrid}>
        <View style={[styles.pieceCard, styles.pieceTop]}>
          <View style={styles.blouseNeck} />
          <View style={styles.blouseBody} />
        </View>
        <View style={[styles.pieceCard, styles.pieceBottom]}>
          <View style={styles.pantsWaist} />
          <View style={styles.pantsLegLeft} />
          <View style={styles.pantsLegRight} />
        </View>
        <View style={[styles.pieceCard, styles.pieceShoe]}>
          <View style={styles.shoeSole} />
          <View style={styles.shoeUpper} />
        </View>
        <View style={[styles.pieceCard, styles.pieceBag]}>
          <View style={styles.bagBody} />
          <View style={styles.bagStrap} />
        </View>
        <View style={styles.composeLinkA} />
        <View style={styles.composeLinkB} />
        <View style={styles.composeLinkC} />
      </View>
    </View>
  );
}

function HangerGarment({
  offset,
  width,
  tone,
}: {
  offset: number;
  width: number;
  tone: string;
}) {
  return (
    <View style={[styles.hangerUnit, { left: offset, width }]}>
      <View style={styles.hangerHook} />
      <View style={styles.hangerBar} />
      <View style={[styles.garment, { backgroundColor: tone }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: I,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: EditorialOnboardingColors.border,
    overflow: 'hidden',
  },
  ambientOrb: {
    position: 'absolute',
    top: -40,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: S,
    opacity: 0.7,
  },
  ambientOrbRight: {
    left: undefined,
    right: -36,
    top: 20,
  },
  wardrobeBody: {
    width: 200,
    height: 210,
    borderRadius: 18,
    backgroundColor: C,
    borderWidth: 1.5,
    borderColor: M,
    overflow: 'hidden',
  },
  wardrobeRail: {
    position: 'absolute',
    top: 36,
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: B,
    opacity: 0.25,
  },
  hangerRow: {
    position: 'absolute',
    top: 38,
    left: 0,
    right: 0,
    height: 90,
  },
  hangerUnit: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
  },
  hangerHook: {
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: B,
    opacity: 0.35,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  hangerBar: {
    width: '72%',
    height: 2,
    backgroundColor: B,
    opacity: 0.28,
    marginTop: -1,
  },
  garment: {
    width: '88%',
    height: 58,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: M,
  },
  shelf: {
    position: 'absolute',
    bottom: 52,
    left: 14,
    right: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: B,
    opacity: 0.2,
  },
  foldStack: {
    position: 'absolute',
    bottom: 18,
    left: 28,
    width: 72,
    height: 36,
  },
  fold: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: M,
    backgroundColor: I,
  },
  foldTop: { top: 0, opacity: 0.95 },
  foldMid: { top: 10, left: 4, right: 4, backgroundColor: S },
  foldBottom: { top: 20, left: 8, right: 8, backgroundColor: C },
  wardrobeDoorLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    bottom: 0,
    borderRightWidth: 1,
    borderRightColor: M,
    backgroundColor: 'rgba(255, 252, 247, 0.12)',
  },
  wardrobeDoorRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    bottom: 0,
    backgroundColor: 'rgba(255, 252, 247, 0.06)',
  },
  wardrobeHandleLeft: {
    position: 'absolute',
    top: '46%',
    left: '22%',
    width: 6,
    height: 22,
    borderRadius: 3,
    backgroundColor: B,
    opacity: 0.3,
  },
  wardrobeHandleRight: {
    position: 'absolute',
    top: '46%',
    right: '22%',
    width: 6,
    height: 22,
    borderRadius: 3,
    backgroundColor: B,
    opacity: 0.3,
  },
  composeGrid: {
    width: 220,
    height: 220,
  },
  pieceCard: {
    position: 'absolute',
    backgroundColor: I,
    borderWidth: 1,
    borderColor: M,
    borderRadius: 14,
  },
  pieceTop: {
    top: 18,
    left: 72,
    width: 76,
    height: 88,
    alignItems: 'center',
    paddingTop: 14,
  },
  blouseNeck: {
    width: 22,
    height: 10,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: B,
    opacity: 0.35,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  blouseBody: {
    width: 52,
    height: 52,
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: S,
    borderWidth: 1,
    borderColor: M,
  },
  pieceBottom: {
    top: 118,
    left: 24,
    width: 72,
    height: 82,
    alignItems: 'center',
  },
  pantsWaist: {
    width: 48,
    height: 8,
    borderRadius: 4,
    backgroundColor: B,
    opacity: 0.22,
    marginTop: 10,
  },
  pantsLegLeft: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    width: 18,
    height: 48,
    borderRadius: 6,
    backgroundColor: C,
    borderWidth: 1,
    borderColor: M,
  },
  pantsLegRight: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    width: 18,
    height: 48,
    borderRadius: 6,
    backgroundColor: C,
    borderWidth: 1,
    borderColor: M,
  },
  pieceShoe: {
    bottom: 28,
    right: 28,
    width: 64,
    height: 44,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  shoeSole: {
    width: 46,
    height: 8,
    borderRadius: 4,
    backgroundColor: B,
    opacity: 0.35,
  },
  shoeUpper: {
    width: 38,
    height: 18,
    borderRadius: 10,
    backgroundColor: S,
    borderWidth: 1,
    borderColor: M,
    marginBottom: 4,
  },
  pieceBag: {
    top: 42,
    right: 18,
    width: 58,
    height: 64,
    alignItems: 'center',
    paddingTop: 12,
  },
  bagBody: {
    width: 40,
    height: 36,
    borderRadius: 10,
    backgroundColor: B,
    opacity: 0.18,
    borderWidth: 1,
    borderColor: M,
  },
  bagStrap: {
    position: 'absolute',
    top: 8,
    width: 28,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: B,
    opacity: 0.3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  composeLinkA: {
    position: 'absolute',
    top: 100,
    left: 98,
    width: 40,
    height: 1,
    backgroundColor: B,
    opacity: 0.12,
    transform: [{ rotate: '35deg' }],
  },
  composeLinkB: {
    position: 'absolute',
    top: 108,
    right: 72,
    width: 36,
    height: 1,
    backgroundColor: B,
    opacity: 0.12,
    transform: [{ rotate: '-28deg' }],
  },
  composeLinkC: {
    position: 'absolute',
    bottom: 68,
    left: 92,
    width: 48,
    height: 1,
    backgroundColor: B,
    opacity: 0.1,
    transform: [{ rotate: '-12deg' }],
  },
});
