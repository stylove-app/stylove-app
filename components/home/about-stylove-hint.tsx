import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SoftEnter } from '@/components/ui/soft-enter';
import { useAppNavigation } from '@/contexts/app-navigation-context';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme } from '@/contexts/theme-context';
import { hapticLight } from '@/lib/haptics';
import { Fonts } from '@/constants/theme';

export function AboutStyloveHintCard() {
  const t = useTranslation();
  const router = useRouter();
  const { requestNavigation } = useAppNavigation();
  const { colors, isDark } = useTheme();

  const handlePress = () => {
    void hapticLight();
    requestNavigation('profile-about');
    router.push('/(tabs)/profile');
  };

  return (
    <SoftEnter delay={120}>
      <View style={styles.wrap}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.ivory,
              borderColor: isDark ? 'rgba(196,160,98,0.12)' : colors.creamMuted,
            },
            pressed && styles.cardPressed,
          ]}>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: isDark ? colors.creamText : colors.black }]}>
              {t.about.homeTitle}
            </Text>
            <Text style={[styles.subtitle, { color: colors.gray }]} numberOfLines={2}>
              {t.about.homeSubtitle}
            </Text>
            <Text style={[styles.travelLine, { color: colors.goldMuted }]} numberOfLines={1}>
              {t.about.homeTravelLine}
            </Text>
          </View>
          <View style={[styles.ctaPill, { borderColor: colors.burgundy }]}>
            <Text style={[styles.cta, { color: colors.burgundy }]}>{t.about.homeCta}</Text>
          </View>
        </Pressable>
      </View>
    </SoftEnter>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.9,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 14,
    letterSpacing: 0.15,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
  },
  travelLine: {
    fontSize: 10,
    lineHeight: 13,
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
  ctaPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  cta: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
