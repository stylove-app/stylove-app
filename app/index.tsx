import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SessionRestoreError } from '@/components/auth/session-restore-error';
import { EditorialOnboardingFlow } from '@/components/onboarding/editorial-onboarding-flow';
import { EditorialSplashScreen } from '@/components/splash/editorial-splash-screen';
import { EditorialOnboardingColors } from '@/constants/editorial-onboarding-theme';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { ONBOARDING_COPY } from '@/lib/onboarding-copy';

const SPLASH_MS = 2200;

export default function WelcomeScreen() {
  const { locale } = useLocale();
  const { ready: authReady, isRegistered, initError } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const copy = ONBOARDING_COPY[locale] ?? ONBOARDING_COPY.tr;

  useEffect(() => {
    if (authReady && isRegistered) {
      setSplashDone(true);
      return;
    }
    const timer = setTimeout(() => setSplashDone(true), SPLASH_MS);
    return () => clearTimeout(timer);
  }, [authReady, isRegistered]);

  useEffect(() => {
    if (!authReady || !splashDone || !isRegistered) return;
    router.replace('/(tabs)');
  }, [authReady, splashDone, isRegistered]);

  if (authReady && initError) {
    return <SessionRestoreError variant="splash" onSignInAgain={() => setSplashDone(true)} />;
  }

  if (authReady && splashDone && !isRegistered) {
    return <EditorialOnboardingFlow />;
  }

  return (
    <View style={styles.screen}>
      <EditorialSplashScreen subtitle={copy.splashSubtitle} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: EditorialOnboardingColors.background,
  },
});
