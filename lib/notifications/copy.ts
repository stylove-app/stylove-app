import type { TranslationKeys } from '@/i18n/types';
import type { StylovePushKind, StylovePushRoute } from '@/lib/notifications/types';

export function getPushNotificationCopy(
  kind: StylovePushKind,
  t: TranslationKeys,
): { title: string; body: string } {
  return t.pushNotifications.kinds[kind];
}

export function getDefaultRouteForPushKind(kind: StylovePushKind): StylovePushRoute {
  switch (kind) {
    case 'daily_style_ready':
      return 'home';
    case 'weekly_summary_ready':
      return 'weekly-summary';
    case 'wardrobe_reminder':
      return 'wardrobe';
    default:
      return 'home';
  }
}
