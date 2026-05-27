import { Easing, FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

export const LUXURY_MOTION = {
  breathMs: 5200,
  shimmerMs: 4800,
  driftMs: 18000,
  enterMs: 680,
  modalEnterMs: 560,
  modalSlideMs: 620,
} as const;

export const luxuryEasing = Easing.inOut(Easing.ease);

export function softFadeIn(delay = 0) {
  return FadeIn.duration(LUXURY_MOTION.enterMs).delay(delay);
}

export function softFadeInDown(delay = 0) {
  return FadeInDown.duration(LUXURY_MOTION.enterMs).delay(delay);
}

export function softFadeInUp(delay = 0) {
  return FadeInUp.duration(LUXURY_MOTION.modalSlideMs).delay(delay);
}

export function modalOverlayFade() {
  return FadeIn.duration(LUXURY_MOTION.modalEnterMs);
}
