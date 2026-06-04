import { Platform } from 'react-native';

export const palette = {
  canvas: '#F7F9FA',
  canvasStrong: '#EAF2EF',
  surface: '#FFFFFF',
  surfaceWarm: '#FFF8E8',
  ink: '#13231F',
  inkSoft: '#344943',
  muted: '#667872',
  mutedLight: '#DCE6E2',
  primary: '#116A5C',
  primaryDark: '#0A493F',
  primarySoft: '#DDF3EC',
  blue: '#315CA8',
  blueSoft: '#E6EEFF',
  amber: '#B56D12',
  amberSoft: '#FFF0CF',
  rose: '#B42318',
  roseSoft: '#FFE7E3',
  violet: '#6353B6',
  violetSoft: '#EEEAFE',
  white: '#FFFFFF',
  black: '#0B1412',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
};

export const typography = {
  eyebrow: 12,
  small: 13,
  body: 16,
  lead: 18,
  title: 30,
  display: 36,
};

export const shadows = {
  card: Platform.select({
    web: { boxShadow: '0 10px 24px rgba(11, 20, 18, 0.08)' },
    default: {
      shadowColor: '#0B1412',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 5,
    },
  }),
  lift: Platform.select({
    web: { boxShadow: '0 16px 30px rgba(11, 20, 18, 0.12)' },
    default: {
      shadowColor: '#0B1412',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.12,
      shadowRadius: 30,
      elevation: 8,
    },
  }),
};
