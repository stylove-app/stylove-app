import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useNotifications } from '@/contexts/notifications-context';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { getPushSupportReason } from '@/lib/notifications/environment';
import { hapticLight } from '@/lib/haptics';

export function PushNotificationsSetting() {
  const t = useTranslation();
  const { colors } = useTheme();
  const { permissionStatus, pushToken, requestPermission, isRequestingPermission } = useNotifications();

  const supportReason = getPushSupportReason();
  const isGranted = permissionStatus === 'granted' && Boolean(pushToken);
  const isPermissionGranted = permissionStatus === 'granted';
  const isTokenMissing = isPermissionGranted && !pushToken;
  const isUnavailable =
    permissionStatus === 'unsupported' ||
    supportReason === 'expo_go_android' ||
    supportReason === 'simulator' ||
    supportReason === 'web';

  const statusLabel = isGranted
    ? t.pushNotifications.enabledLabel
    : isTokenMissing
      ? t.pushNotifications.tokenUnavailableHint
      : permissionStatus === 'denied'
        ? t.pushNotifications.deniedHint
        : isUnavailable
          ? t.pushNotifications.unavailableLabel
          : t.pushNotifications.settingsSubtitle;

  const handleEnable = () => {
    if (isGranted || isUnavailable || permissionStatus === 'denied' || isRequestingPermission) return;
    void hapticLight();
    void requestPermission();
  };

  const handleOpenSettings = () => {
    void hapticLight();
    void Linking.openSettings();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.creamMuted }, StyloveShadow.soft]}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.black }]}>{t.pushNotifications.settingsTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.gray }]}>{statusLabel}</Text>
        </View>
        <Ionicons name="notifications-outline" size={20} color={colors.goldMuted} />
      </View>

      {permissionStatus === 'denied' ? (
        <Pressable
          onPress={handleOpenSettings}
          accessibilityRole="button"
          style={[styles.cta, { backgroundColor: colors.wineDeep }]}>
          <Text style={[styles.ctaText, { color: colors.creamText }]}>{t.pushNotifications.openSettingsCta}</Text>
        </Pressable>
      ) : null}

      {!isGranted && !isUnavailable && permissionStatus !== 'denied' ? (
        <Pressable
          onPress={handleEnable}
          disabled={isRequestingPermission}
          accessibilityRole="button"
          accessibilityState={{ disabled: isRequestingPermission, busy: isRequestingPermission }}
          style={[
            styles.cta,
            { backgroundColor: colors.wineDeep },
            isRequestingPermission && styles.ctaDisabled,
          ]}>
          {isRequestingPermission ? (
            <ActivityIndicator color={colors.creamText} />
          ) : (
            <Text style={[styles.ctaText, { color: colors.creamText }]}>{t.pushNotifications.enableCta}</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  cta: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 148,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.72,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
