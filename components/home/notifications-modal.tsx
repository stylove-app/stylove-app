import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppNavigation } from '@/contexts/app-navigation-context';
import { useTranslation } from '@/contexts/locale-context';
import { hapticLight } from '@/lib/haptics';
import { StyloveColors, StyloveShadow } from '@/constants/stylove-theme';
import { Fonts } from '@/constants/theme';
import type { NotificationActionId } from '@/i18n/types';

type NotificationsModalProps = {
  visible: boolean;
  onClose: () => void;
};

const NAV_BY_ACTION: Record<
  NotificationActionId,
  { route: '/(tabs)' | '/(tabs)/looks' | '/(tabs)/profile'; target?: 'home-aura' | 'profile-about' }
> = {
  aura: { route: '/(tabs)', target: 'home-aura' },
  savedLook: { route: '/(tabs)/looks' },
  fragrance: { route: '/(tabs)/looks' },
};

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const { requestNavigation } = useAppNavigation();

  const handleItemPress = (id: NotificationActionId) => {
    void hapticLight();
    onClose();
    const nav = NAV_BY_ACTION[id];
    if (nav.target) {
      requestNavigation(nav.target);
    }
    router.push(nav.route);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 20, marginTop: insets.top + 48 },
            StyloveShadow.editorial,
          ]}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.notifications.title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={22} color={StyloveColors.gray} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {t.notifications.items.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>{t.notifications.emptyTitle}</Text>
                <Text style={styles.emptySubtitle}>{t.notifications.emptySubtitle}</Text>
              </View>
            ) : (
              t.notifications.items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleItemPress(item.id)}
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
                  <View style={styles.itemDot} />
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemBodyText}>{item.body}</Text>
                    <Text style={styles.itemTime}>{item.time}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={StyloveColors.goldMuted} />
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 5, 9, 0.5)',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: StyloveColors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: StyloveColors.creamRich,
    maxHeight: '72%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: StyloveColors.creamRich,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: StyloveColors.black,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 18,
    gap: 14,
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    color: StyloveColors.burgundyRich,
  },
  emptySubtitle: {
    fontSize: 13,
    color: StyloveColors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: StyloveColors.ivory,
    borderWidth: 1,
    borderColor: StyloveColors.creamMuted,
  },
  itemPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
    backgroundColor: StyloveColors.cream,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: StyloveColors.goldMuted,
    marginTop: 2,
  },
  itemBody: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    color: StyloveColors.burgundyRich,
  },
  itemBodyText: {
    fontSize: 13,
    lineHeight: 19,
    color: StyloveColors.gray,
    fontStyle: 'italic',
  },
  itemTime: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: StyloveColors.grayLight,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
