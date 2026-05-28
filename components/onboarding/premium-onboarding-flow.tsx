import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StyloveLogo } from '@/components/brand/stylove-logo';
import { GoldShimmerLine } from '@/components/ui/gold-shimmer-line';
import { BRAND_NAME } from '@/constants/brand';
import { StyloveColors } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { type Locale } from '@/i18n/types';
import { ONBOARDING_COPY, ONBOARDING_LANGUAGE_ORDER } from '@/lib/onboarding-copy';

type Step = 'welcome' | 'language' | 'auth';
type AuthMode = 'login' | 'register';

const PARTICLES = [
  { left: '9%', delay: 0, duration: 9800, size: 9, opacity: 0.18 },
  { left: '18%', delay: 1700, duration: 11800, size: 7, opacity: 0.14 },
  { left: '31%', delay: 900, duration: 10800, size: 8, opacity: 0.16 },
  { left: '46%', delay: 2300, duration: 12600, size: 6, opacity: 0.12 },
  { left: '58%', delay: 600, duration: 10400, size: 10, opacity: 0.16 },
  { left: '72%', delay: 2800, duration: 12200, size: 7, opacity: 0.13 },
  { left: '84%', delay: 1200, duration: 11200, size: 8, opacity: 0.15 },
] as const;

export function PremiumOnboardingFlow() {
  const { locale, setLocale } = useLocale();
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const copy = ONBOARDING_COPY[locale] ?? ONBOARDING_COPY.tr;

  const [step, setStep] = useState<Step>('welcome');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const isLogin = authMode === 'login';
  const authTitle = isLogin ? copy.authTitle : copy.registerCta;
  const primaryCta = isLogin ? copy.loginCta : copy.registerCta;
  const switchCta = isLogin ? copy.switchToRegister : copy.switchToLogin;

  const goHome = () => router.replace('/(tabs)');

  const handleAuth = async () => {
    if (!email.trim() || !password) return;
    if (!isLogin && password.length < 6) {
      Alert.alert(copy.errorTitle, copy.weakPassword);
      return;
    }

    Keyboard.dismiss();
    setBusy(true);
    try {
      if (isLogin) {
        const { error, session } = await signIn(email.trim(), password);
        if (error) {
          Alert.alert(copy.errorTitle, copy.genericLoginError);
          return;
        }
        if (session) goHome();
        return;
      }

      const { error, session, needsEmailConfirmation } = await signUp(email.trim(), password);
      if (error) {
        Alert.alert(copy.errorTitle, copy.genericRegisterError);
        return;
      }
      if (session) {
        goHome();
        return;
      }
      if (needsEmailConfirmation) {
        Alert.alert(copy.successTitle, copy.confirmEmail);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.screen,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24 },
        ]}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
        <HeartParticles />

        <Animated.View entering={FadeIn.duration(700)} style={styles.logoWrap}>
          <StyloveLogo size="md" variant="light" />
        </Animated.View>

        {step === 'welcome' ? (
          <WelcomeStep copy={copy} onContinue={() => setStep('language')} />
        ) : step === 'language' ? (
          <LanguageStep
            selectedLocale={locale}
            onSelect={(next) => void setLocale(next)}
            onContinue={() => setStep('auth')}
          />
        ) : (
          <Animated.View entering={FadeInDown.duration(450)} style={styles.authCard}>
            <Text style={styles.authTitle}>{authTitle}</Text>
            <Text style={styles.authSubtitle}>{copy.authSubtitle}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={copy.emailPlaceholder}
              placeholderTextColor="rgba(248,244,237,0.42)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              style={styles.input}
              editable={!busy}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={copy.passwordPlaceholder}
              placeholderTextColor="rgba(248,244,237,0.42)"
              secureTextEntry
              autoComplete="password"
              style={styles.input}
              editable={!busy}
            />
            <OnboardingButton label={primaryCta} onPress={handleAuth} disabled={busy} tone="gold" />
            <Pressable
              disabled={busy}
              onPress={() => setAuthMode((current) => (current === 'login' ? 'register' : 'login'))}
              style={styles.switchButton}>
              <Text style={styles.switchText}>{switchCta}</Text>
            </Pressable>
          </Animated.View>
        )}

        <Text style={styles.brandNote}>{BRAND_NAME}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function WelcomeStep({
  copy,
  onContinue,
}: {
  copy: (typeof ONBOARDING_COPY)[Locale];
  onContinue: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.panel}>
      <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
      <Text style={styles.title}>{copy.welcomeTitle}</Text>
      <GoldShimmerLine width={52} />
      <View style={styles.purposeWrap}>
        {copy.purposeLines.map((line) => (
          <Text key={line} style={styles.purposeLine}>
            {line}
          </Text>
        ))}
      </View>
      <Text style={styles.travelLine}>{copy.travelLine}</Text>
      <OnboardingButton label={copy.startCta} onPress={onContinue} tone="gold" />
    </Animated.View>
  );
}

function LanguageStep({
  selectedLocale,
  onSelect,
  onContinue,
}: {
  selectedLocale: Locale;
  onSelect: (locale: Locale) => void;
  onContinue: () => void;
}) {
  const copy = ONBOARDING_COPY[selectedLocale] ?? ONBOARDING_COPY.tr;

  return (
    <Animated.View entering={FadeInDown.duration(450)} style={styles.panel}>
      <Text style={styles.title}>{copy.languageTitle}</Text>
      <Text style={styles.authSubtitle}>{copy.languageSubtitle}</Text>
      <View style={styles.languageGrid}>
        {ONBOARDING_LANGUAGE_ORDER.map((locale) => {
          const languageCopy = ONBOARDING_COPY[locale];
          const selected = locale === selectedLocale;
          return (
            <Pressable
              key={locale}
              onPress={() => onSelect(locale)}
              style={[styles.languageChip, selected && styles.languageChipActive]}>
              <Text style={[styles.languageText, selected && styles.languageTextActive]}>
                {languageCopy.languageName}
              </Text>
              {selected ? <Ionicons name="checkmark" size={14} color={StyloveColors.wineDeep} /> : null}
            </Pressable>
          );
        })}
      </View>
      <OnboardingButton label={copy.continueCta} onPress={onContinue} tone="gold" />
    </Animated.View>
  );
}

function OnboardingButton({
  label,
  onPress,
  disabled = false,
  tone,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone: 'gold';
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cta,
        tone === 'gold' && styles.ctaGold,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={styles.ctaText}>{label}</Text>
    </Pressable>
  );
}

function HeartParticles() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const maxParticleMs = Math.max(...PARTICLES.map((particle) => particle.delay + particle.duration));
    const timer = setTimeout(() => setVisible(false), maxParticleMs + 400);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PARTICLES.map((particle) => (
        <HeartParticle key={`${particle.left}-${particle.delay}`} particle={particle} />
      ))}
    </View>
  );
}

function HeartParticle({ particle }: { particle: (typeof PARTICLES)[number] }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      particle.delay,
      withTiming(1, {
        duration: particle.duration,
        easing: Easing.inOut(Easing.sin),
      }),
    );
  }, [particle.delay, particle.duration, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 0.85, 1], [0, particle.opacity, particle.opacity, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-36, 760]) },
      { translateX: interpolate(progress.value, [0, 0.5, 1], [0, 10, -6]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: particle.left, top: 0 },
        style,
      ]}>
      <Ionicons name="heart" size={particle.size} color={StyloveColors.creamText} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: StyloveColors.wineDeep,
  },
  screen: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
    gap: 20,
    backgroundColor: StyloveColors.wineDeep,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: StyloveColors.burgundy,
    opacity: 0.24,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    left: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: StyloveColors.wineLight,
    opacity: 0.12,
  },
  particle: {
    position: 'absolute',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  panel: {
    alignItems: 'center',
    gap: 20,
    padding: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 98, 0.2)',
    backgroundColor: 'rgba(31, 5, 9, 0.22)',
  },
  eyebrow: {
    fontSize: 12,
    color: StyloveColors.goldSoft,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    color: StyloveColors.ivory,
    textAlign: 'center',
  },
  purposeWrap: {
    alignItems: 'center',
    gap: 6,
  },
  purposeLine: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    lineHeight: 27,
    color: StyloveColors.creamText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  travelLine: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(248,244,237,0.68)',
    textAlign: 'center',
  },
  languageGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  languageChip: {
    minWidth: '45%',
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 98, 0.28)',
    backgroundColor: 'rgba(74, 18, 28, 0.46)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  languageChipActive: {
    backgroundColor: StyloveColors.goldMuted,
    borderColor: StyloveColors.goldMuted,
  },
  languageText: {
    fontSize: 14,
    color: 'rgba(248,244,237,0.72)',
    textAlign: 'center',
  },
  languageTextActive: {
    color: StyloveColors.wineDeep,
    fontWeight: '600',
  },
  authCard: {
    gap: 14,
    padding: 24,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 98, 0.22)',
    backgroundColor: 'rgba(31, 5, 9, 0.28)',
  },
  authTitle: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    lineHeight: 32,
    color: StyloveColors.ivory,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(248,244,237,0.68)',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 98, 0.28)',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: StyloveColors.ivory,
    backgroundColor: 'rgba(31, 5, 9, 0.42)',
  },
  cta: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  ctaGold: {
    backgroundColor: StyloveColors.goldMuted,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: StyloveColors.wineDeep,
    textAlign: 'center',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    color: 'rgba(248,244,237,0.72)',
    fontSize: 13,
    textAlign: 'center',
  },
  brandNote: {
    color: 'rgba(196, 160, 98, 0.44)',
    fontFamily: Fonts.serif,
    fontSize: 12,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
