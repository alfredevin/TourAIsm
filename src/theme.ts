import type { TextStyle, ViewStyle } from 'react-native';

export const APP_NAME = 'Biyahe';

export type Scheme = 'light' | 'dark';
export type ThemeMode = Scheme | 'system';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  successSoft: string;
  accent: string;
  accentSoft: string;
  danger: string;
  // Turn-by-turn banner, like the green header in navigation apps.
  nav: string;
  navDeep: string;
  routeCasing: string;
  mapBackdrop: string;
  mapRoad: string;
  mapBlock: string;
  shadow: string;
};

const light: ThemeColors = {
  background: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F4F9',
  primary: '#2563EB',
  primarySoft: '#E6EEFF',
  onPrimary: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  accent: '#F97316',
  accentSoft: '#FFEDD5',
  danger: '#DC2626',
  nav: '#0F8A4F',
  navDeep: '#0B6B3D',
  routeCasing: '#1E3A8A',
  mapBackdrop: '#EAF0FB',
  mapRoad: '#FFFFFF',
  mapBlock: '#DCE5F6',
  shadow: '#0F172A',
};

const dark: ThemeColors = {
  background: '#0B1120',
  surface: '#151D2E',
  surfaceAlt: '#1D2739',
  primary: '#4F8BFF',
  primarySoft: '#1C2A4A',
  onPrimary: '#FFFFFF',
  text: '#F1F5F9',
  muted: '#94A3B8',
  border: '#263247',
  success: '#22C55E',
  successSoft: '#12301F',
  accent: '#FB923C',
  accentSoft: '#3A2414',
  danger: '#F87171',
  nav: '#13804A',
  navDeep: '#0D5F37',
  routeCasing: '#0B2A6B',
  mapBackdrop: '#111A2B',
  mapRoad: '#24324B',
  mapBlock: '#1A2538',
  shadow: '#000000',
};

export const palettes: Record<Scheme, ThemeColors> = { light, dark };

export type ThemeShadows = { card: ViewStyle; soft: ViewStyle };

function makeShadows(scheme: Scheme): ThemeShadows {
  const { shadow } = palettes[scheme];
  const boost = scheme === 'dark' ? 3 : 1;
  return {
    card: {
      shadowColor: shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08 * boost,
      shadowRadius: 24,
      elevation: 6,
    },
    soft: {
      shadowColor: shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06 * boost,
      shadowRadius: 12,
      elevation: 2,
    },
  };
}

export type Theme = {
  scheme: Scheme;
  colors: ThemeColors;
  shadows: ThemeShadows;
};

export const themes: Record<Scheme, Theme> = {
  light: { scheme: 'light', colors: light, shadows: makeShadows('light') },
  dark: { scheme: 'dark', colors: dark, shadows: makeShadows('dark') },
};

export const radius = {
  card: 24,
  button: 16,
  pill: 999,
} as const;

// Colorless so screens can apply the theme's text color.
export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
} satisfies Record<string, TextStyle>;
