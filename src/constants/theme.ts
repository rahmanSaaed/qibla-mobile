export const Colors = {
  background: '#0b3d2e',
  backgroundTop: '#14573f',
  foreground: '#f5f1e3',
  muted: 'rgba(245, 241, 227, 0.7)',
  faint: 'rgba(245, 241, 227, 0.5)',
  surface: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.2)',
  divider: 'rgba(255, 255, 255, 0.1)',
  gold: '#d4af37',
  goldSoft: 'rgba(212, 175, 55, 0.12)',
  goldBorder: 'rgba(212, 175, 55, 0.4)',
  success: '#6ee7b7',
  successDeep: 'rgba(6, 78, 59, 0.7)',
  error: '#fca5a5',
  north: '#f87171',
} as const;

export const Fonts = {
  regular: 'Cairo_400Regular',
  semibold: 'Cairo_600SemiBold',
  bold: 'Cairo_700Bold',
  extrabold: 'Cairo_800ExtraBold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
} as const;

export const Radius = {
  md: 12,
  lg: 16,
} as const;

export const MaxContentWidth = 448;
