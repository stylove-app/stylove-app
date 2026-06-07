import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StyloveLogo } from '@/components/brand/stylove-logo';
import {
  EditorialOnboardingColors,
  EditorialOnboardingShadow,
} from '@/constants/editorial-onboarding-theme';
import { softFadeIn, softFadeInDown } from '@/constants/luxury-motion';
import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/contexts/locale-context';
import type { Locale } from '@/i18n/types';
import { mapAppleSignInError, mapAuthError } from '@/lib/auth-errors';
import { ONBOARDING_COPY, ONBOARDING_LANGUAGE_ORDER, type OnboardingCopy } from '@/lib/onboarding-copy';
import type { SignInResult, SignUpResult } from '@/services/auth';

type AuthMode = 'login' | 'register';

type EditorialAuthScreenProps = {
  locale: Locale;
  copy: OnboardingCopy;
  onSelectLocale: (locale: Locale) => void;
  onSignIn: (email: string, password: string) => Promise<SignInResult>;
  onSignUp: (email: string, password: string) => Promise<SignUpResult>;
  onSignInWithApple: () => Promise<SignInResult>;
  onSuccess: (mode: AuthMode) => void;
};

export function EditorialAuthScreen({
  locale,
  copy,
  onSelectLocale,
  onSignIn,
  onSignUp,
  onSignInWithApple,
  onSuccess,
}: EditorialAuthScreenProps) {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const isAuthBusy = busy || appleBusy;

  const isLogin = authMode === 'login';
  const primaryCta = isLogin ? copy.loginCta : copy.registerCta;
  const switchCta = isLogin ? copy.switchToRegister : copy.switchToLogin;

  const handleSocialPlaceholder = () => {
    Alert.alert(copy.errorTitle, copy.socialComingSoon);
  };

  const handleAppleSignIn = async () => {
    if (isAuthBusy) return;

    setAppleBusy(true);
    try {
      const { error, session, cancelled } = await onSignInWithApple();
      if (cancelled) return;
      if (error) {
        Alert.alert(copy.errorTitle, mapAppleSignInError(error, t.profile.account.errors));
        return;
      }
      if (session) onSuccess('login');
    } finally {
      setAppleBusy(false);
    }
  };

  const handleAuth = async () => {
    if (!email.trim()) {
      Alert.alert(copy.errorTitle, t.profile.account.errors.emailRequired);
      return;
    }
    if (!password) {
      Alert.alert(copy.errorTitle, t.profile.account.errors.passwordRequired);
      return;
    }
    if (!isLogin && password.length < 6) {
      Alert.alert(copy.errorTitle, copy.weakPassword);
      return;
    }

    Keyboard.dismiss();
    setBusy(true);
    try {
      if (isLogin) {
        const { error, session } = await onSignIn(email.trim(), password);
        if (error) {
          Alert.alert(copy.errorTitle, mapAuthError(error, t.profile.account.errors, 'signIn'));
          return;
        }
        if (session) onSuccess('login');
        return;
      }

      const { error, session, needsEmailConfirmation } = await onSignUp(email.trim(), password);
      if (error) {
        Alert.alert(copy.errorTitle, mapAuthError(error, t.profile.account.errors, 'signUp'));
        return;
      }
      if (session) {
        onSuccess('register');
        return;
      }
      if (needsEmailConfirmation) {
        Alert.alert(copy.successTitle, copy.confirmEmail);
        setAuthMode('login');
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
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}>
        <Animated.View entering={softFadeIn(0)} style={styles.logoWrap}>
          <StyloveLogo size="md" variant="editorial" />
        </Animated.View>

        <Animated.View entering={softFadeInDown(120)} style={styles.welcomeBlock}>
          <Text style={styles.welcomeTitle}>{copy.authWelcomeTitle}</Text>
          <Text style={styles.welcomeSubtitle}>{copy.authWelcomeSubtitle}</Text>
        </Animated.View>

        <Animated.View entering={softFadeInDown(220)} style={styles.actions}>
          <AuthOutlineButton
            label={copy.continueWithApple}
            icon="logo-apple"
            onPress={() => void handleAppleSignIn()}
            disabled={isAuthBusy}
            loading={appleBusy}
          />
          <AuthOutlineButton
            label={copy.continueWithGoogle}
            icon="logo-google"
            onPress={handleSocialPlaceholder}
            disabled={isAuthBusy}
          />
          <Pressable
            onPress={() => setShowEmailForm((current) => !current)}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
            <Ionicons name="mail-outline" size={18} color={EditorialOnboardingColors.ivory} />
            <Text style={styles.primaryBtnText}>{copy.continueWithEmail}</Text>
          </Pressable>

          {showEmailForm ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.emailForm}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={copy.emailPlaceholder}
                placeholderTextColor={EditorialOnboardingColors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                style={styles.input}
                editable={!isAuthBusy}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={copy.passwordPlaceholder}
                placeholderTextColor={EditorialOnboardingColors.textMuted}
                secureTextEntry
                autoComplete="password"
                style={styles.input}
                editable={!isAuthBusy}
              />
              <Pressable
                disabled={isAuthBusy}
                onPress={() => void handleAuth()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  isAuthBusy && styles.disabled,
                  pressed && !isAuthBusy && styles.btnPressed,
                ]}>
                {busy ? (
                  <ActivityIndicator color={EditorialOnboardingColors.ivory} />
                ) : (
                  <Text style={styles.primaryBtnText}>{primaryCta}</Text>
                )}
              </Pressable>
              <Pressable
                disabled={isAuthBusy}
                onPress={() => setAuthMode((current) => (current === 'login' ? 'register' : 'login'))}
                style={styles.switchWrap}>
                <Text style={styles.switchText}>{switchCta}</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Pressable onPress={() => setShowEmailForm(true)} style={styles.loginLinkWrap}>
              <Text style={styles.loginLink}>{copy.loginLink}</Text>
            </Pressable>
          )}
        </Animated.View>

        <View style={styles.languageSection}>
          <Pressable onPress={() => setLanguageOpen((open) => !open)} style={styles.languageToggle}>
            <Text style={styles.languageLabel}>{copy.languageLabel}</Text>
            <Text style={styles.languageValue}>{copy.languageName}</Text>
            <Ionicons
              name={languageOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={EditorialOnboardingColors.textMuted}
            />
          </Pressable>
          {languageOpen ? (
            <View style={styles.languageGrid}>
              {ONBOARDING_LANGUAGE_ORDER.map((code) => {
                const languageCopy = ONBOARDING_COPY[code];
                const selected = code === locale;
                return (
                  <Pressable
                    key={code}
                    onPress={() => {
                      onSelectLocale(code);
                      setLanguageOpen(false);
                    }}
                    style={[styles.languageChip, selected && styles.languageChipActive]}>
                    <Text style={[styles.languageChipText, selected && styles.languageChipTextActive]}>
                      {languageCopy.languageName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AuthOutlineButton({
  label,
  icon,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      style={({ pressed }) => [
        styles.outlineBtn,
        disabled && styles.outlineBtnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={EditorialOnboardingColors.burgundy} />
      ) : (
        <>
          <Ionicons name={icon} size={20} color={EditorialOnboardingColors.burgundy} />
          <Text style={styles.outlineBtnText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: EditorialOnboardingColors.background,
  },
  screen: {
    flexGrow: 1,
    paddingHorizontal: 28,
    gap: 28,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  welcomeBlock: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  welcomeTitle: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    color: EditorialOnboardingColors.burgundy,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: EditorialOnboardingColors.textSoft,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  outlineBtn: {
    minHeight: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: EditorialOnboardingColors.borderStrong,
    backgroundColor: EditorialOnboardingColors.ivory,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
    ...EditorialOnboardingShadow.soft,
  },
  outlineBtnDisabled: {
    opacity: 0.55,
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: EditorialOnboardingColors.text,
  },
  primaryBtn: {
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: EditorialOnboardingColors.burgundy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    ...EditorialOnboardingShadow.soft,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: EditorialOnboardingColors.ivory,
  },
  btnPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  disabled: {
    opacity: 0.55,
  },
  emailForm: {
    gap: 12,
    marginTop: 4,
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: EditorialOnboardingColors.border,
    backgroundColor: EditorialOnboardingColors.ivory,
    paddingHorizontal: 16,
    fontSize: 15,
    color: EditorialOnboardingColors.text,
  },
  switchWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    color: EditorialOnboardingColors.textSoft,
    textAlign: 'center',
  },
  loginLinkWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loginLink: {
    fontSize: 15,
    color: EditorialOnboardingColors.burgundy,
    fontWeight: '500',
  },
  languageSection: {
    marginTop: 'auto',
    gap: 10,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  languageLabel: {
    fontSize: 13,
    color: EditorialOnboardingColors.textMuted,
  },
  languageValue: {
    fontSize: 13,
    color: EditorialOnboardingColors.burgundy,
    fontWeight: '500',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  languageChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: EditorialOnboardingColors.border,
    backgroundColor: EditorialOnboardingColors.ivory,
  },
  languageChipActive: {
    borderColor: EditorialOnboardingColors.burgundy,
    backgroundColor: EditorialOnboardingColors.beigeSoft,
  },
  languageChipText: {
    fontSize: 13,
    color: EditorialOnboardingColors.textSoft,
  },
  languageChipTextActive: {
    color: EditorialOnboardingColors.burgundy,
    fontWeight: '600',
  },
});
