export const StyloveColors = {
  ivory: '#F5F0E6',
  cream: '#EDE4D3',
  creamRich: '#E2D5C0',
  creamDark: '#D4C4A8',
  creamMuted: '#C9B896',
  burgundy: '#4A0E18',
  burgundyRich: '#3D0B14',
  wine: '#2E0810',
  wineDeep: '#1F0509',
  wineLight: '#6B1A28',
  black: '#0F0F0F',
  blackSoft: '#1C1816',
  cardDark: '#241418',
  cardElevated: '#2E1A1F',
  gray: '#4A4540',
  grayLight: '#8A8278',
  creamText: '#F5EDE0',
  white: '#FFFAF2',
  gold: '#C4A062',
  goldSoft: '#D4B878',
  goldMuted: '#A88850',
  glow: 'rgba(74, 14, 24, 0.28)',
} as const;

/** Cinematic dark palette — black, deep burgundy, warm gold. */
export const StyloveDarkColors = {
  ivory: '#0A0908',
  cream: '#121010',
  creamRich: '#1A1416',
  creamDark: '#241A1E',
  creamMuted: '#3A2A30',
  burgundy: '#6B1A28',
  burgundyRich: '#4A0E18',
  wine: '#2E0810',
  wineDeep: '#0F0508',
  wineLight: '#8A2840',
  black: '#F5EDE0',
  blackSoft: '#E8DDD0',
  cardDark: '#161012',
  cardElevated: '#1E1418',
  gray: '#A89890',
  grayLight: '#7A6E68',
  creamText: '#F5EDE0',
  white: '#141012',
  gold: '#D4B878',
  goldSoft: '#E8CC98',
  goldMuted: '#C4A062',
  glow: 'rgba(196, 160, 98, 0.18)',
} as const;

export type StylovePalette = {
  ivory: string;
  cream: string;
  creamRich: string;
  creamDark: string;
  creamMuted: string;
  burgundy: string;
  burgundyRich: string;
  wine: string;
  wineDeep: string;
  wineLight: string;
  black: string;
  blackSoft: string;
  cardDark: string;
  cardElevated: string;
  gray: string;
  grayLight: string;
  creamText: string;
  white: string;
  gold: string;
  goldSoft: string;
  goldMuted: string;
  glow: string;
};

export const StyloveGradients = {
  wine: [StyloveColors.wineDeep, StyloveColors.burgundy, StyloveColors.wineLight] as const,
  ivory: [StyloveColors.ivory, StyloveColors.cream] as const,
  header: [StyloveColors.wineDeep, StyloveColors.burgundyRich, StyloveColors.burgundy] as const,
};

export const StyloveShadow = {
  card: {
    shadowColor: StyloveColors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
  },
  soft: {
    shadowColor: StyloveColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  glow: {
    shadowColor: StyloveColors.burgundy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  editorial: {
    shadowColor: StyloveColors.wineDeep,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

export const StyloveSpacing = {
  screen: 24,
  section: 36,
  card: 22,
} as const;
