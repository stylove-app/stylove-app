import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EditorialAuthScreen } from '@/components/onboarding/editorial-auth-screen';
import { EditorialOnboardingSlides } from '@/components/onboarding/editorial-onboarding-slides';
import { EditorialOnboardingColors } from '@/constants/editorial-onboarding-theme';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { analytics } from '@/lib/analytics';
import { ONBOARDING_COPY } from '@/lib/onboarding-copy';

type FlowPhase = 'slides' | 'auth';

export function EditorialOnboardingFlow() {
  const { locale, setLocale } = useLocale();
  const { signIn, signUp } = useAuth();
  const copy = ONBOARDING_COPY[locale] ?? ONBOARDING_COPY.tr;

  const [phase, setPhase] = useState<FlowPhase>('slides');
  const [slideIndex, setSlideIndex] = useState(0);

  const completeOnboarding = (mode: 'login' | 'register') => {
    analytics.capture('onboarding_completed', {
      auth_mode: mode,
      locale,
    });
    router.replace('/(tabs)');
  };

  const goToAuth = () => setPhase('auth');

  const handleSlideContinue = () => {
    if (slideIndex < copy.slides.length - 1) {
      setSlideIndex((current) => current + 1);
      return;
    }
    goToAuth();
  };

  return (
    <View style={styles.screen}>
      {phase === 'slides' ? (
        <EditorialOnboardingSlides
          slides={copy.slides}
          slideIndex={slideIndex}
          continueLabel={copy.continueCta}
          skipLabel={copy.skipCta}
          onContinue={handleSlideContinue}
          onSkip={goToAuth}
        />
      ) : (
        <EditorialAuthScreen
          locale={locale}
          copy={copy}
          onSelectLocale={(next) => void setLocale(next)}
          onSignIn={signIn}
          onSignUp={signUp}
          onSuccess={completeOnboarding}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: EditorialOnboardingColors.background,
  },
});
