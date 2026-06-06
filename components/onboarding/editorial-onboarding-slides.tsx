import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  OutfitComposeIllustration,
  TravelPackIllustration,
  WardrobeIllustration,
} from '@/components/onboarding/onboarding-illustrations';
import {
  EditorialOnboardingColors,
  EditorialOnboardingShadow,
} from '@/constants/editorial-onboarding-theme';
import { softFadeInDown } from '@/constants/luxury-motion';
import { Fonts } from '@/constants/theme';
import type { OnboardingSlideCopy } from '@/lib/onboarding-copy';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ILLUSTRATION_SIZE = Math.min(SCREEN_WIDTH - 72, 300);

const SLIDE_ILLUSTRATIONS = [
  WardrobeIllustration,
  OutfitComposeIllustration,
  TravelPackIllustration,
] as const;

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
  const Illustration = SLIDE_ILLUSTRATIONS[slideIndex] ?? WardrobeIllustration;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <Pressable onPress={onSkip} hitSlop={12} style={styles.skipWrap}>
        <Text style={styles.skip}>{skipLabel}</Text>
      </Pressable>

      <View style={styles.content}>
        <Animated.View
          key={`illustration-${slideIndex}`}
          entering={FadeIn.duration(520)}
          exiting={FadeOut.duration(280)}
          style={styles.illustrationWrap}>
          <Illustration width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} />
        </Animated.View>

        <Animated.View
          key={`copy-${slideIndex}`}
          entering={softFadeInDown(80)}
          style={styles.copyBlock}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          <Text style={styles.footnote}>{slide.footnote}</Text>
        </Animated.View>
      </View>

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
    paddingHorizontal: 32,
  },
  skipWrap: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: 'center',
  },
  skip: {
    fontSize: 15,
    color: EditorialOnboardingColors.textMuted,
    letterSpacing: 0.15,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 44,
    paddingTop: 8,
  },
  illustrationWrap: {
    alignSelf: 'center',
    ...EditorialOnboardingShadow.card,
  },
  copyBlock: {
    gap: 14,
    paddingHorizontal: 2,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 38,
    lineHeight: 44,
    color: EditorialOnboardingColors.burgundy,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: EditorialOnboardingColors.text,
    maxWidth: 340,
    letterSpacing: 0.1,
  },
  footnote: {
    fontSize: 15,
    lineHeight: 22,
    color: EditorialOnboardingColors.textMuted,
    maxWidth: 320,
    letterSpacing: 0.05,
  },
  footer: {
    gap: 24,
    paddingTop: 12,
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
    width: 24,
    backgroundColor: EditorialOnboardingColors.burgundy,
  },
  cta: {
    minHeight: 56,
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
    letterSpacing: 0.35,
  },
});
