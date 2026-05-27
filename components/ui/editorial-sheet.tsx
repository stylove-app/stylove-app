import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, StyloveShadow } from '@/contexts/theme-context';
import { Fonts } from '@/constants/theme';

type EditorialSheetProps = {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
};

export function EditorialSheet({ visible, title, body, onClose }: EditorialSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? colors.cardDark : colors.white,
              borderColor: colors.creamRich,
              marginTop: insets.top + 48,
              paddingBottom: insets.bottom + 20,
            },
            StyloveShadow.editorial,
          ]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? colors.creamText : colors.black }]}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.gray} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Text style={[styles.bodyText, { color: isDark ? colors.creamText : colors.blackSoft }]}>
              {body}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 5, 9, 0.52)',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  sheet: {
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '78%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    flex: 1,
    lineHeight: 28,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
});
