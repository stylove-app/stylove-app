import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsContent } from '@/components/profile/settings-content';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme } from '@/contexts/theme-context';
import { hapticLight } from '@/lib/haptics';
import { Fonts } from '@/constants/theme';

export default function SettingsScreen() {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.ivory, paddingTop: insets.top }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.creamMuted }]}>
        <Pressable
          onPress={() => {
            void hapticLight();
            router.back();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}>
          <Ionicons name="chevron-back" size={22} color={colors.burgundy} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Ionicons name="settings-outline" size={18} color={colors.goldMuted} />
          <Text style={[styles.title, { color: colors.black }]}>{t.profile.settingsTitle}</Text>
        </View>
        <View style={styles.backSpacer} />
      </View>

      <SettingsContent contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    opacity: 0.7,
  },
  backSpacer: {
    width: 40,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    letterSpacing: 0.2,
  },
});
