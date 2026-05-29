import { useGlobalSearchParams, usePathname } from 'expo-router';
import { useEffect, useMemo, type ReactNode } from 'react';
import { PostHogProvider } from 'posthog-react-native';
import type { User } from '@supabase/supabase-js';

import { analytics, analyticsConfig } from '@/lib/analytics';
import { useAuth } from '@/contexts/auth-context';

type AnalyticsProviderProps = {
  children: ReactNode;
};

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const client = useMemo(() => analytics.getClient(), []);

  if (!analyticsConfig.enabled || !client) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      client={client}
      autocapture={{
        captureScreens: false,
        captureTouches: false,
        captureLifecycleEvents: false,
      }}>
      <AnalyticsLifecycle />
      {children}
    </PostHogProvider>
  );
}

function AnalyticsLifecycle() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const paramCount = Object.keys(params).length;
  const { ready, user, isRegistered } = useAuth();

  useEffect(() => {
    analytics.capture('app_opened');
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (user && isRegistered) {
      const profile = getAnalyticsUserProfile(user);
      analytics.identify(user.id, {
        email: profile.email,
        name: profile.name,
        plan: profile.plan,
        $email: profile.email,
        $name: profile.name,
        is_registered: true,
      });
      return;
    }

    analytics.reset(true);
  }, [ready, user, isRegistered]);

  useEffect(() => {
    analytics.screen(pathname, {
      has_params: paramCount > 0,
    });
  }, [pathname, paramCount]);

  return null;
}

type AnalyticsUser = User & {
  is_premium?: boolean;
};

function getAnalyticsUserProfile(user: User) {
  const metadata = user.user_metadata ?? {};
  const name =
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : '';
  const isPremium = Boolean((user as AnalyticsUser).is_premium);

  return {
    email: user.email ?? '',
    name,
    plan: isPremium ? 'premium' : 'free',
  };
}
