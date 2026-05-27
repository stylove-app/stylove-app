import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { modalOverlayFade, softFadeInUp } from '@/constants/luxury-motion';

type LuxuryModalFrameProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  sheetStyle?: ViewStyle;
  align?: 'bottom' | 'center' | 'top';
  dismissOnBackdrop?: boolean;
};

export function LuxuryModalFrame({
  visible,
  onClose,
  children,
  sheetStyle,
  align = 'bottom',
  dismissOnBackdrop = true,
}: LuxuryModalFrameProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <Animated.View
          entering={modalOverlayFade()}
          exiting={FadeOut.duration(320)}
          style={[
            styles.overlay,
            align === 'center' && styles.overlayCenter,
            align === 'top' && styles.overlayTop,
          ]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissOnBackdrop ? onClose : undefined}
          />
          <Animated.View entering={softFadeInUp(40)} style={[styles.sheet, sheetStyle]}>
            {children}
          </Animated.View>
        </Animated.View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 5, 9, 0.55)',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
  },
  overlayCenter: {
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  overlayTop: {
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    flex: 1,
  },
  sheet: {
    width: '100%',
  },
});
