import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AccountSection } from '@/components/profile/account-section';
import { ProfileDetailsSection } from '@/components/profile/profile-details-section';
import { PushNotificationsSetting } from '@/components/profile/push-notifications-setting';
import { LOCALES } from '@/i18n';
import { useLocale, useTranslation } from '@/contexts/locale-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';
import type { Locale } from '@/i18n/types';

const SETTINGS_LANGUAGES = LOCALES.filter((language) =>
  ['tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'ru'].includes(language.id),
);

type SettingsContentProps = {
  contentContainerStyle?: object;
};

export function SettingsContent({ contentContainerStyle }: SettingsContentProps) {
  const t = useTranslation();
  const { locale, setLocale } = useLocale();
  const { colors, isDark, toggleDark } = useTheme();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled">
      <Text style={[styles.groupLabel, { color: colors.gray }]}>{t.profile.settingsAccountProfile}</Text>
      <AccountSection embedded />
      <ProfileDetailsSection embedded />

      <Text style={[styles.groupLabel, { color: colors.gray }]}>{t.profile.language}</Text>
      <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.creamMuted }]}>
        <View style={styles.languageGrid}>
          {SETTINGS_LANGUAGES.map((language) => {
            const selected = language.id === locale;
            return (
              <Pressable
                key={language.id}
                onPress={() => void setLocale(language.id as Locale)}
                style={[
                  styles.languageChip,
                  {
                    backgroundColor: selected ? colors.cream : colors.ivory,
                    borderColor: selected ? colors.burgundy : colors.creamMuted,
                  },
                ]}>
                <Text
                  style={[styles.languageText, { color: selected ? colors.burgundy : colors.black }]}>
                  {language.native}
                </Text>
                {selected ? <Ionicons name="checkmark" size={15} color={colors.burgundy} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={[styles.groupLabel, { color: colors.gray }]}>{t.pushNotifications.settingsTitle}</Text>
      <PushNotificationsSetting />

      <Text style={[styles.groupLabel, { color: colors.gray }]}>{t.profile.settingsAppearance}</Text>
      <Pressable
        onPress={toggleDark}
        style={[styles.themeRow, { backgroundColor: colors.white, borderColor: colors.creamMuted }]}>
        <View style={styles.themeLeft}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.burgundy} />
          <Text style={[styles.themeLabel, { color: colors.black }]}>
            {isDark ? t.profile.themeDark : t.profile.themeLight}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.grayLight} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 12,
  },
  groupLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    ...StyloveShadow.soft,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageChip: {
    minWidth: '45%',
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  languageText: {
    fontSize: 14,
    textAlign: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    ...StyloveShadow.soft,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeLabel: {
    fontSize: 15,
  },
});
