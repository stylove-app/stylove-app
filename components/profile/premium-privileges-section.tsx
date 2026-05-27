import { Ionicons } from '@expo/vector-icons';
import { hapticLight } from '@/lib/haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LuxuryButton } from '@/components/ui/luxury-button';
import { useTranslation } from '@/contexts/locale-context';
import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import {
  getPrivilegeRecommendations,
  PREMIUM_PRIVILEGES,
  type PremiumPrivilegeId,
} from '@/lib/premium-privileges';
import { Fonts } from '@/constants/theme';

type PrivilegeCopy = {
  title: string;
  description: string;
  items: readonly string[];
};

type PremiumPrivilegesSectionProps = {
  openPrivilegeId?: PremiumPrivilegeId | null;
  onPrivilegeOpened?: () => void;
};

export function PremiumPrivilegesSection({
  openPrivilegeId,
  onPrivilegeOpened,
}: PremiumPrivilegesSectionProps) {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [activeId, setActiveId] = useState<PremiumPrivilegeId | null>(null);
  const [highlightedId, setHighlightedId] = useState<PremiumPrivilegeId | null>(null);

  useEffect(() => {
    if (!openPrivilegeId) return;
    setActiveId(openPrivilegeId);
    setHighlightedId(openPrivilegeId);
    onPrivilegeOpened?.();
    const timer = setTimeout(() => setHighlightedId(null), 2400);
    return () => clearTimeout(timer);
  }, [openPrivilegeId, onPrivilegeOpened]);

  const copyById: Record<PremiumPrivilegeId, PrivilegeCopy> = {
    fragrance: t.privileges.fragrance,
    venues: t.privileges.venues,
    shopping: t.privileges.shopping,
  };

  const active = activeId ? copyById[activeId] : null;
  const activeItems = activeId
    ? getPrivilegeRecommendations(activeId, copyById[activeId].items).slice(0, 1)
    : [];

  const goPremium = () => {
    setActiveId(null);
    router.push('/premium');
  };

  const openPrivilege = (id: PremiumPrivilegeId) => {
    void hapticLight();
    setActiveId(id);
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.goldMuted }]}>{t.privileges.title}</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.gray }]}>{t.privileges.subtitle}</Text>

      <View style={styles.list}>
        {PREMIUM_PRIVILEGES.map((privilege) => {
          const copy = copyById[privilege.id];
          return (
            <Pressable
              key={privilege.id}
              onPress={() => openPrivilege(privilege.id)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: isDark ? colors.cardElevated : colors.white,
                  borderColor:
                    highlightedId === privilege.id
                      ? colors.goldMuted
                      : isDark
                        ? 'rgba(196,160,98,0.2)'
                        : colors.creamRich,
                  opacity: pressed ? 0.92 : 1,
                  transform: pressed ? [{ scale: 0.99 }] : [],
                },
                highlightedId === privilege.id && styles.cardHighlighted,
                StyloveShadow.soft,
              ]}>
              <View style={[styles.iconWrap, { backgroundColor: colors.wineDeep }]}>
                <Ionicons name={privilege.icon} size={18} color={colors.goldSoft} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: isDark ? colors.creamText : colors.black }]}>
                    {copy.title}
                  </Text>
                  <View style={[styles.premiumBadge, { borderColor: colors.goldMuted }]}>
                    <Text style={[styles.premiumBadgeText, { color: colors.goldMuted }]}>
                      {t.privileges.premiumBadge}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cardDesc, { color: colors.gray }]}>{copy.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.grayLight} />
            </Pressable>
          );
        })}
      </View>

      <Modal visible={activeId !== null} transparent animationType="fade" onRequestClose={() => setActiveId(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActiveId(null)} />
          <View
            style={[
              styles.modal,
              {
                backgroundColor: isDark ? colors.cardDark : colors.white,
                borderColor: colors.creamRich,
                marginBottom: insets.bottom + 16,
              },
              StyloveShadow.editorial,
            ]}>
            {active ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Text style={[styles.modalTitle, { color: isDark ? colors.creamText : colors.black }]}>
                      {active.title}
                    </Text>
                    <View style={[styles.premiumBadge, { borderColor: colors.goldMuted }]}>
                      <Text style={[styles.premiumBadgeText, { color: colors.goldMuted }]}>
                        {t.privileges.premiumBadge}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.modalSubtitle, { color: colors.gray }]}>{active.description}</Text>
                </View>

                <Text style={[styles.curatedLabel, { color: colors.goldMuted }]}>
                  {t.privileges.curatedForYou}
                </Text>
                <Text style={[styles.lockedNote, { color: colors.gray }]}>{t.privileges.lockedNote}</Text>

                <ScrollView style={styles.recList} showsVerticalScrollIndicator={false}>
                  {activeItems.map((item, index) => (
                    <View
                      key={`${activeId}-${index}`}
                      style={[
                        styles.recRow,
                        {
                          backgroundColor: isDark ? colors.cardElevated : colors.ivory,
                          borderColor: isDark ? 'rgba(196,160,98,0.12)' : colors.creamMuted,
                        },
                      ]}>
                      <View style={[styles.recDot, { backgroundColor: colors.goldMuted }]} />
                      <Text style={[styles.recText, { color: isDark ? colors.creamText : colors.blackSoft }]}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                <LuxuryButton label={t.privileges.upgradeCta} onPress={goPremium} variant="gold" />

                <Pressable
                  onPress={() => setActiveId(null)}
                  style={[styles.closeBtn, { borderColor: colors.creamMuted }]}>
                  <Text style={[styles.closeBtnText, { color: colors.burgundy }]}>{t.common.close}</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 8,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  cardHighlighted: {
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    flex: 1,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  premiumBadgeText: {
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 5, 9, 0.55)',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  modal: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    maxHeight: '72%',
    gap: 16,
  },
  modalHeader: {
    gap: 8,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalTitle: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    flex: 1,
    lineHeight: 30,
  },
  modalSubtitle: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21,
  },
  curatedLabel: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  lockedNote: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  recList: {
    maxHeight: 220,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  recDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
  },
  recText: {
    flex: 1,
    fontFamily: Fonts.serif,
    fontSize: 14,
    lineHeight: 21,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
});
