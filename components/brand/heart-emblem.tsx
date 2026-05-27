import { Ionicons } from '@expo/vector-icons';

import { StyloveColors } from '@/constants/stylove-theme';

type HeartEmblemProps = {
  size?: number;
  color?: string;
};

export function HeartEmblem({
  size = 24,
  color = StyloveColors.burgundy,
}: HeartEmblemProps) {
  return <Ionicons name="heart" size={size} color={color} />;
}
