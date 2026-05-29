import { isRunningInExpoGo } from 'expo';
import type { ComponentType } from 'react';
import * as Sentry from '@sentry/react-native';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const sentryEnvironment = process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? 'development' : 'production');

export const isSentryEnabled = Boolean(sentryDsn) && !__DEV__;

export const sentryNavigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: Boolean(sentryDsn),
    debug: false,
    environment: sentryEnvironment,
    sendDefaultPii: false,
    maxBreadcrumbs: 20,
    tracesSampleRate: isSentryEnabled ? 0.05 : 0,
    enableNativeFramesTracking: isSentryEnabled && !isRunningInExpoGo(),
    integrations: [sentryNavigationIntegration],
    beforeSend(event) {
      delete event.user;
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console') return null;
      return breadcrumb;
    },
  });
}

export function withSentryRoot<T extends ComponentType<Record<string, never>>>(component: T): T {
  return isSentryEnabled ? (Sentry.wrap(component) as T) : component;
}
