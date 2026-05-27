import type { ReactNode } from 'react';
import { type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { softFadeIn } from '@/constants/luxury-motion';

type SoftEnterProps = {
  children: ReactNode;
  delay?: number;
  style?: ViewStyle;
};

export function SoftEnter({ children, delay = 0, style }: SoftEnterProps) {
  return (
    <Animated.View entering={softFadeIn(delay)} style={style} collapsable={false}>
      {children}
    </Animated.View>
  );
}
