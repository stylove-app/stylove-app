import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/contexts/locale-context';
import { useTheme } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';
import { hapticLight } from '@/lib/haptics';

type LegalId = 'privacy' | 'terms' | 'kvkk' | 'membership' | 'purchases';

const LEGAL_ITEMS: { id: LegalId; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'privacy', icon: 'shield-outline' },
  { id: 'terms', icon: 'document-text-outline' },
  { id: 'kvkk', icon: 'lock-closed-outline' },
  { id: 'membership', icon: 'diamond-outline' },
  { id: 'purchases', icon: 'card-outline' },
];

const LEGAL_URLS: Record<LegalId, string> = {
  privacy: 'https://stylove.app/privacy',
  terms: 'https://stylove.app/terms',
  kvkk: 'https://stylove.app/privacy',
  membership: 'https://stylove.app/terms',
  purchases: 'https://stylove.app/terms',
};

export function LegalTrustSection() {
  const t = useTranslation();
  const { colors, isDark } = useTheme();

  const openItem = (id: LegalId) => {
    void hapticLight();
    void Linking.openURL(LEGAL_URLS[id]);
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.grayLight }]}>{t.legal.title}</Text>
      <View style={[styles.list, { borderColor: colors.creamMuted }]}>
        {LEGAL_ITEMS.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => openItem(item.id)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: isDark ? colors.cardElevated : colors.white,
                borderBottomColor: colors.creamMuted,
              },
              index === LEGAL_ITEMS.length - 1 && styles.rowLast,
              pressed && styles.rowPressed,
            ]}>
            <Ionicons name={item.icon} size={17} color={colors.burgundy} />
            <Text style={[styles.rowLabel, { color: colors.black }]}>{t.legal[item.id].title}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.grayLight} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  list: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.serif,
    letterSpacing: 0.2,
  },
});
