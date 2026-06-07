export type StylovePushKind =
  | 'daily_style_ready'
  | 'weekly_summary_ready'
  | 'wardrobe_reminder';

export type StylovePushRoute =
  | 'home'
  | 'looks'
  | 'wardrobe'
  | 'weekly-summary';

export type StylovePushPayload = {
  kind: StylovePushKind;
  route?: StylovePushRoute;
  lookId?: string;
  planId?: string;
};

export type PushPermissionStatus = 'unsupported' | 'undetermined' | 'granted' | 'denied';

export type PushRegistrationResult = {
  status: PushPermissionStatus;
  token: string | null;
  reason?: string;
};

export type PushSendResult = {
  sent: false;
  reason: 'push_delivery_not_enabled';
};

const PUSH_KINDS: StylovePushKind[] = [
  'daily_style_ready',
  'weekly_summary_ready',
  'wardrobe_reminder',
];

export function isStylovePushKind(value: unknown): value is StylovePushKind {
  return typeof value === 'string' && PUSH_KINDS.includes(value as StylovePushKind);
}

export function buildPushPayload(
  kind: StylovePushKind,
  meta?: Omit<StylovePushPayload, 'kind'>,
): StylovePushPayload {
  return {
    kind,
    ...meta,
  };
}

export function parsePushPayload(data: Record<string, unknown> | undefined): StylovePushPayload | null {
  if (!data || !isStylovePushKind(data.kind)) return null;

  const payload: StylovePushPayload = { kind: data.kind };

  if (typeof data.route === 'string') {
    payload.route = data.route as StylovePushRoute;
  }
  if (typeof data.lookId === 'string') {
    payload.lookId = data.lookId;
  }
  if (typeof data.planId === 'string') {
    payload.planId = data.planId;
  }

  return payload;
}
