import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StyloveLogo } from '@/components/brand/stylove-logo';
import {
  EditorialOnboardingColors,
  EditorialOnboardingShadow,
} from '@/constants/editorial-onboarding-theme';
import { softFadeIn, softFadeInDown, softFadeInUp } from '@/constants/luxury-motion';
import { Fonts } from '@/constants/theme';

type EditorialSplashScreenProps = {
  subtitle: string;
};

export function EditorialSplashScreen({ subtitle }: EditorialSplashScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <Animated.View entering={softFadeIn(0)} style={styles.logoBlock}>
        <StyloveLogo size="lg" variant="editorial" />
      </Animated.View>

      <Animated.View entering={softFadeInDown(220)}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>

      <Animated.View entering={softFadeInUp(420)} style={styles.compositionWrap}>
        <EditorialSplashComposition />
      </Animated.View>
    </View>
  );
}

function EditorialSplashComposition() {
  return (
    <View style={styles.composition}>
      <View style={[styles.fabricPanel, EditorialOnboardingShadow.soft]} />
      <View style={styles.rackRow}>
        <View style={styles.rackPole} />
        <View style={styles.rackBar} />
        <View style={[styles.hanger, styles.hangerLeft]} />
        <View style={[styles.hanger, styles.hangerCenter]} />
        <View style={[styles.hanger, styles.hangerRight]} />
      </View>
      <View style={styles.garmentRow}>
        <View style={[styles.garmentShape, styles.garmentLeft]} />
        <View style={[styles.garmentShape, styles.garmentCenter]} />
        <View style={[styles.garmentShape, styles.garmentRight]} />
      </View>
      <View style={styles.swatchRow}>
        <View style={[styles.swatch, styles.swatchIvory]} />
        <View style={[styles.swatch, styles.swatchBeige]} />
        <View style={[styles.swatch, styles.swatchBurgundy]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: EditorialOnboardingColors.background,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  ambientTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: EditorialOnboardingColors.beigeSoft,
    opacity: 0.65,
  },
  ambientBottom: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: EditorialOnboardingColors.cream,
    opacity: 0.5,
  },
  logoBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 48,
  },
  subtitle: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    lineHeight: 26,
    color: EditorialOnboardingColors.textSoft,
    textAlign: 'center',
    letterSpacing: 0.2,
    fontStyle: 'italic',
    marginBottom: 28,
  },
  compositionWrap: {
    width: '100%',
    paddingBottom: 8,
  },
  composition: {
    height: 168,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: EditorialOnboardingColors.ivory,
    borderWidth: 1,
    borderColor: EditorialOnboardingColors.border,
    ...EditorialOnboardingShadow.card,
  },
  fabricPanel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: EditorialOnboardingColors.beigeSoft,
    opacity: 0.55,
  },
  rackRow: {
    position: 'absolute',
    left: 28,
    top: 22,
    width: 200,
    height: 90,
  },
  rackPole: {
    position: 'absolute',
    left: 98,
    top: 0,
    width: 3,
    height: 78,
    borderRadius: 2,
    backgroundColor: EditorialOnboardingColors.burgundy,
    opacity: 0.35,
  },
  rackBar: {
    position: 'absolute',
    left: 8,
    top: 10,
    width: 184,
    height: 3,
    borderRadius: 2,
    backgroundColor: EditorialOnboardingColors.burgundy,
    opacity: 0.28,
  },
  hanger: {
    position: 'absolute',
    top: 12,
    width: 28,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: EditorialOnboardingColors.burgundy,
    opacity: 0.22,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  hangerLeft: { left: 24 },
  hangerCenter: { left: 86 },
  hangerRight: { left: 148 },
  garmentRow: {
    position: 'absolute',
    top: 34,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  garmentShape: {
    width: 52,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: EditorialOnboardingColors.border,
  },
  garmentLeft: { backgroundColor: EditorialOnboardingColors.ivory },
  garmentCenter: { backgroundColor: EditorialOnboardingColors.beigeSoft },
  garmentRight: { backgroundColor: EditorialOnboardingColors.cream },
  swatchRow: {
    position: 'absolute',
    left: 24,
    bottom: 18,
    flexDirection: 'row',
    gap: 8,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: EditorialOnboardingColors.border,
  },
  swatchIvory: { backgroundColor: EditorialOnboardingColors.ivory },
  swatchBeige: { backgroundColor: EditorialOnboardingColors.beige },
  swatchBurgundy: { backgroundColor: EditorialOnboardingColors.burgundy },
});
