import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/locale-context';
import { EditorialOnboardingColors } from '@/constants/editorial-onboarding-theme';
import { StyloveColors } from '@/constants/stylove-theme';

type SessionRestoreErrorProps = {
  variant?: 'splash' | 'app';
  onSignInAgain?: () => void;
};

export function SessionRestoreError({ variant = 'app', onSignInAgain }: SessionRestoreErrorProps) {
  const t = useTranslation();
  const { retrySessionRestore, resetBrokenSessionForSignIn } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const [signingInAgain, setSigningInAgain] = useState(false);

  const handleRetry = async () => {
    if (retrying || signingInAgain) return;
    setRetrying(true);
    try {
      await retrySessionRestore();
    } finally {
      setRetrying(false);
    }
  };

  const handleSignInAgain = async () => {
    if (retrying || signingInAgain) return;
    setSigningInAgain(true);
    try {
      await resetBrokenSessionForSignIn();
      onSignInAgain?.();
      if (variant === 'app') {
        router.replace('/');
      }
    } finally {
      setSigningInAgain(false);
    }
  };

  return (
    <View
      style={[
        styles.wrap,
        variant === 'splash' ? styles.splash : styles.app,
      ]}>
      <EmptyState
        title={t.profile.account.sessionRestoreErrorTitle}
        subtitle={t.profile.account.sessionRestoreErrorBody}
        actionLabel={t.profile.account.retrySessionRestore}
        onAction={() => void handleRetry()}
        actionLoading={retrying}
        secondaryActionLabel={t.profile.account.signInAgain}
        onSecondaryAction={() => void handleSignInAgain()}
        secondaryLoading={signingInAgain}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
  },
  splash: {
    backgroundColor: EditorialOnboardingColors.background,
  },
  app: {
    backgroundColor: StyloveColors.ivory,
  },
});
