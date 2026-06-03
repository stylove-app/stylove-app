/** Light editorial palette for splash, onboarding, and auth entry. */
export const EditorialOnboardingColors = {
  background: '#F8F4EC',
  backgroundAlt: '#F3EDE3',
  ivory: '#FFFCF7',
  cream: '#EDE4D3',
  beige: '#E2D5C0',
  beigeSoft: '#EBE3D6',
  burgundy: '#4A0E18',
  burgundyRich: '#3D0B14',
  burgundySoft: '#6B2434',
  text: '#2A2220',
  textSoft: '#6E645C',
  textMuted: '#9A9086',
  border: 'rgba(74, 14, 24, 0.12)',
  borderStrong: 'rgba(74, 14, 24, 0.2)',
  shadow: 'rgba(42, 34, 32, 0.08)',
  shadowBurgundy: 'rgba(74, 14, 24, 0.14)',
} as const;

export const EditorialOnboardingShadow = {
  card: {
    shadowColor: EditorialOnboardingColors.shadowBurgundy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  soft: {
    shadowColor: EditorialOnboardingColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;
