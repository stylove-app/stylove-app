import { Image } from 'expo-image';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EDITORIAL_ONBOARDING_IMAGES } from '@/constants/editorial-onboarding-images';
import {
  EditorialOnboardingColors,
  EditorialOnboardingShadow,
} from '@/constants/editorial-onboarding-theme';
import { softFadeInDown } from '@/constants/luxury-motion';
import { Fonts } from '@/constants/theme';
import type { OnboardingSlideCopy } from '@/lib/onboarding-copy';

const SLIDE_IMAGES = [
  EDITORIAL_ONBOARDING_IMAGES.slide1,
  EDITORIAL_ONBOARDING_IMAGES.slide2,
  EDITORIAL_ONBOARDING_IMAGES.slide3,
] as const;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type EditorialOnboardingSlidesProps = {
  slides: readonly OnboardingSlideCopy[];
  slideIndex: number;
  continueLabel: string;
  skipLabel: string;
  onContinue: () => void;
  onSkip: () => void;
};

export function EditorialOnboardingSlides({
  slides,
  slideIndex,
  continueLabel,
  skipLabel,
  onContinue,
  onSkip,
}: EditorialOnboardingSlidesProps) {
  const insets = useSafeAreaInsets();
  const slide = slides[slideIndex];
  const imageUri = SLIDE_IMAGES[slideIndex] ?? SLIDE_IMAGES[0];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <Pressable onPress={onSkip} hitSlop={12} style={styles.skipWrap}>
        <Text style={styles.skip}>{skipLabel}</Text>
      </Pressable>

      <Animated.View
        key={`image-${slideIndex}`}
        entering={FadeIn.duration(480)}
        exiting={FadeOut.duration(280)}
        style={styles.imageFrame}>
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" transition={320} />
        <View style={styles.imageVeil} />
        <View style={styles.imageVeilTint} />
      </Animated.View>

      <Animated.View
        key={`copy-${slideIndex}`}
        entering={softFadeInDown(60)}
        style={styles.copyBlock}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View key={index} style={[styles.dot, index === slideIndex && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button">
          <Text style={styles.ctaText}>{continueLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: EditorialOnboardingColors.background,
    paddingHorizontal: 28,
  },
  skipWrap: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  skip: {
    fontSize: 14,
    color: EditorialOnboardingColors.textMuted,
    letterSpacing: 0.2,
  },
  imageFrame: {
    width: SCREEN_WIDTH - 56,
    height: SCREEN_WIDTH * 0.92,
    maxHeight: 420,
    alignSelf: 'center',
    borderRadius: 32,
    overflow: 'hidden',
    marginTop: 12,
    borderWidth: 1,
    borderColor: EditorialOnboardingColors.border,
    ...EditorialOnboardingShadow.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 244, 236, 0.1)',
  },
  imageVeilTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(74, 14, 24, 0.06)',
  },
  copyBlock: {
    marginTop: 36,
    gap: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    color: EditorialOnboardingColors.burgundy,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: EditorialOnboardingColors.textSoft,
    maxWidth: 320,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 22,
    paddingBottom: 8,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: EditorialOnboardingColors.beige,
  },
  dotActive: {
    width: 22,
    backgroundColor: EditorialOnboardingColors.burgundy,
  },
  cta: {
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: EditorialOnboardingColors.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    ...EditorialOnboardingShadow.soft,
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: EditorialOnboardingColors.ivory,
    letterSpacing: 0.3,
  },
});
