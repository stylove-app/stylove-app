import PostHog from 'posthog-react-native';

type AnalyticsEventName =
  | 'app_opened'
  | 'onboarding_completed'
  | 'outfit_generated'
  | 'outfit_saved'
  | 'paywall_opened';

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

const BLOCKED_PROPERTY_PATTERN = /(prompt|intent|image|base64|uri|url|photo|avatar)/i;

function sanitizeProperties(properties?: AnalyticsProperties): AnalyticsProperties | undefined {
  if (!properties) return undefined;

  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (value === undefined) return false;
      return !BLOCKED_PROPERTY_PATTERN.test(key);
    }),
  );
}

function devLog(event: string, properties?: AnalyticsProperties) {
  if (!__DEV__) return;
  const keys = properties ? Object.keys(properties).join(',') : 'none';
  console.log(`[analytics] sent ${event} props=${keys}`);
}

class AnalyticsClient {
  private client: PostHog | null = null;
  private initialized = false;
  private lastIdentifiedId: string | null = null;
  private lastIdentifySignature: string | null = null;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    if (!posthogApiKey) {
      if (__DEV__) console.log('[analytics] disabled: missing EXPO_PUBLIC_POSTHOG_API_KEY');
      return;
    }

    this.client = new PostHog(posthogApiKey, {
      host: posthogHost,
      disabled: false,
      debug: false,
      captureAppLifecycleEvents: false,
      captureApplicationLifecycleEvents: false,
      flushAt: 10,
      flushInterval: 30,
    });
  }

  getClient() {
    this.init();
    return this.client;
  }

  capture(event: AnalyticsEventName, properties?: AnalyticsProperties) {
    const client = this.getClient();
    if (!client) return;

    const safeProperties = sanitizeProperties(properties);
    client.capture(event, safeProperties);
    devLog(event, safeProperties);
  }

  screen(name: string, properties?: AnalyticsProperties) {
    const client = this.getClient();
    if (!client) return;

    const safeProperties = sanitizeProperties(properties);
    client.screen(name, safeProperties);
    devLog('$screen', { screen: name, ...(safeProperties ?? {}) });
  }

  identify(userId: string, properties?: AnalyticsProperties) {
    const client = this.getClient();
    if (!client) return;

    const safeProperties = sanitizeProperties(properties);
    const signature = JSON.stringify([userId, safeProperties ?? null]);
    if (this.lastIdentifiedId === userId && this.lastIdentifySignature === signature) return;

    client.identify(userId, safeProperties);
    this.lastIdentifiedId = userId;
    this.lastIdentifySignature = signature;
    devLog('$identify', safeProperties);
  }

  reset(force = false) {
    const client = this.getClient();
    if (!client || (!force && this.lastIdentifiedId === null)) return;

    client.reset();
    this.lastIdentifiedId = null;
    this.lastIdentifySignature = null;
    devLog('$reset');
  }
}

export const analytics = new AnalyticsClient();

export const analyticsConfig = {
  apiKey: posthogApiKey,
  host: posthogHost,
  enabled: Boolean(posthogApiKey),
};
