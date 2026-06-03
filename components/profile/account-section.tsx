import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FormLabel } from '@/components/ui/form-label';
import { LuxuryButton } from '@/components/ui/luxury-button';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';
import { mapAuthError } from '@/lib/auth-errors';

type Feedback = {
  type: 'success' | 'info' | 'error';
  message: string;
} | null;

type AccountSectionProps = {
  embedded?: boolean;
};

export function AccountSection({ embedded }: AccountSectionProps = {}) {
  const t = useTranslation();
  const { colors } = useTheme();
  const { user, isAnonymous, signIn, signUp, signOut, ready } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const account = t.profile.account;
  const isGuest = !user || isAnonymous;
  const statusLabel = isGuest ? account.guestLabel : account.signedInLabel;
  const statusDetail = isGuest ? null : user?.email;

  const showSuccess = (message: string) => {
    setFeedback({ type: 'success', message });
    Alert.alert(account.successTitle, message);
  };

  const showInfo = (message: string) => {
    setFeedback({ type: 'info', message });
    Alert.alert(account.successTitle, message);
  };

  const showError = (message: string, isSignUp: boolean) => {
    setFeedback({ type: 'error', message });
    Alert.alert(
      account.errorTitle,
      message || (isSignUp ? account.errors.genericSignUp : account.errors.genericSignIn),
    );
  };

  const handleSignIn = async () => {
    if (!email.trim()) {
      showError(account.errors.emailRequired, false);
      return;
    }
    if (!password) {
      showError(account.errors.passwordRequired, false);
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const { error, session } = await signIn(email.trim(), password);
      if (error) {
        showError(mapAuthError(error, account.errors, 'signIn'), false);
        return;
      }
      if (session) {
        setPassword('');
        showSuccess(account.signInSuccess);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim()) {
      showError(account.errors.emailRequired, true);
      return;
    }
    if (!password) {
      showError(account.errors.passwordRequired, true);
      return;
    }
    if (password.length < 6) {
      showError(account.errors.weakPassword, true);
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const { error, session, needsEmailConfirmation } = await signUp(email.trim(), password);
      if (error) {
        showError(mapAuthError(error, account.errors, 'signUp'), true);
        return;
      }
      if (session) {
        setPassword('');
        showSuccess(account.signUpSuccessActive);
        return;
      }
      if (needsEmailConfirmation) {
        showInfo(account.signUpSuccessConfirm);
        return;
      }
      showSuccess(account.signUpSuccessActive);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setFeedback(null);
    let shouldNavigate = false;
    try {
      const error = await signOut();
      if (error) {
        showError(mapAuthError(error, account.errors, 'signIn'), false);
        return;
      }
      setEmail('');
      setPassword('');
      shouldNavigate = true;
    } finally {
      setBusy(false);
    }
    if (shouldNavigate) {
      router.replace('/');
    }
  };

  if (!ready) return null;

  const feedbackStyles =
    feedback?.type === 'success'
      ? { bg: 'rgba(107, 31, 42, 0.08)', border: colors.burgundy, text: colors.burgundy }
      : feedback?.type === 'info'
        ? { bg: 'rgba(196, 160, 98, 0.12)', border: colors.goldMuted, text: colors.black }
        : feedback?.type === 'error'
          ? { bg: 'rgba(107, 31, 42, 0.06)', border: colors.burgundy, text: colors.burgundy }
          : null;

  return (
    <View style={[styles.section, embedded && styles.sectionEmbedded]}>
      {embedded ? null : (
        <Text style={[styles.sectionTitle, { color: colors.grayLight }]}>{account.title}</Text>
      )}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.white, borderColor: colors.creamMuted },
          StyloveShadow.soft,
        ]}>
        <View style={styles.statusRow}>
          <Ionicons
            name={isGuest ? 'lock-closed-outline' : 'checkmark-circle-outline'}
            size={18}
            color={colors.burgundy}
          />
          <View style={styles.statusCopy}>
            <Text style={[styles.statusLabel, { color: colors.black }]}>{statusLabel}</Text>
            {statusDetail ? (
              <Text style={[styles.statusDetail, { color: colors.gray }]}>{statusDetail}</Text>
            ) : (
              <Text style={[styles.statusDetail, { color: colors.gray }]}>{account.subtitle}</Text>
            )}
          </View>
        </View>

        {feedback && feedbackStyles ? (
          <View
            style={[
              styles.feedbackBox,
              { backgroundColor: feedbackStyles.bg, borderColor: feedbackStyles.border },
            ]}>
            <Text style={[styles.feedbackText, { color: feedbackStyles.text }]}>{feedback.message}</Text>
          </View>
        ) : null}

        {isGuest ? (
          <>
            <View style={styles.field}>
              <FormLabel color={colors.grayLight}>{account.email}</FormLabel>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={account.emailPlaceholder}
                placeholderTextColor={colors.grayLight}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={[
                  styles.input,
                  { borderColor: colors.creamMuted, color: colors.black, backgroundColor: colors.ivory },
                ]}
              />
            </View>
            <View style={styles.field}>
              <FormLabel color={colors.grayLight}>{account.password}</FormLabel>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={account.passwordPlaceholder}
                placeholderTextColor={colors.grayLight}
                secureTextEntry
                autoComplete="password-new"
                style={[
                  styles.input,
                  { borderColor: colors.creamMuted, color: colors.black, backgroundColor: colors.ivory },
                ]}
              />
            </View>
            <LuxuryButton
              label={account.signIn}
              onPress={() => void handleSignIn()}
              variant="secondary"
              disabled={busy}
            />
            <LuxuryButton
              label={account.signUp}
              onPress={() => void handleSignUp()}
              variant="gold"
              disabled={busy}
            />
          </>
        ) : (
          <Pressable onPress={() => void handleSignOut()} disabled={busy} style={styles.signOutBtn}>
            <Text style={[styles.signOutText, { color: colors.burgundy }]}>{account.signOut}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  sectionEmbedded: {
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusCopy: {
    flex: 1,
    gap: 4,
  },
  statusLabel: {
    fontFamily: Fonts.serif,
    fontSize: 16,
  },
  statusDetail: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  feedbackBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.serif,
  },
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Fonts.serif,
  },
  signOutBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  signOutText: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
