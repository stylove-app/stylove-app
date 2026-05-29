declare module 'posthog-react-native' {
  import type { ComponentType, ReactNode } from 'react';

  export type PostHogProperties = Record<string, unknown>;

  export type PostHogOptions = {
    host?: string;
    disabled?: boolean;
    debug?: boolean;
    flushAt?: number;
    flushInterval?: number;
    captureAppLifecycleEvents?: boolean;
    captureApplicationLifecycleEvents?: boolean;
    [key: string]: unknown;
  };

  export type PostHogAutocaptureOptions = {
    captureScreens?: boolean;
    captureTouches?: boolean;
    captureLifecycleEvents?: boolean;
    [key: string]: unknown;
  };

  export class PostHog {
    constructor(apiKey: string, options?: PostHogOptions);
    capture(event: string, properties?: PostHogProperties): void;
    identify(distinctId: string, properties?: PostHogProperties): void;
    reset(): void;
    screen(name: string, properties?: PostHogProperties): void;
    flush?(): Promise<unknown>;
  }

  export const PostHogProvider: ComponentType<{
    apiKey?: string;
    client?: PostHog;
    options?: PostHogOptions;
    autocapture?: boolean | PostHogAutocaptureOptions;
    children: ReactNode;
  }>;

  export default PostHog;
}
