export const colors = {
  bg: '#F7F4EE',
  surface: '#FFFFFF',
  surfaceSunken: '#EFEBE3',
  ink: '#1E2420',
  inkMuted: '#6A706B',
  inkFaint: '#A3A79F',
  line: '#E4DFD5',
  accent: '#2F6B4F',
  accentSoft: '#DCEBE2',
  onAccent: '#FFFFFF',
  good: '#4E9A6B',
  warn: '#D9962B',
  alert: '#C2574A',
  macro: {
    protein: '#5B7FB8',
    carbs: '#D9A441',
    fat: '#C77D5E',
    fiber: '#6E9B5A',
  },
  scrim: 'rgba(30, 36, 32, 0.32)',
  cameraBg: '#000000',
  cameraGuide: 'rgba(255, 255, 255, 0.7)',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const layout = {
  screenPadding: spacing.lg,
  cardGap: spacing.sm,
  desktopBreakpoint: 768,
  sidebarWidth: 220,
  contentMaxWidth: 560,
  sideColumnWidth: 300,
  modalWidth: 480,
  tabBarHeight: 64,
  addButtonSize: 60,
  minTouchTarget: 44,
  buttonHeight: { m: 48, l: 56 },
  iconSize: 22,
  iconStroke: 1.5,
  thumbnail: 48,
  hairline: 1,
  accentBorder: 3,
  dotBorder: 2,
  ring: { size: 208, stroke: 14, miniSize: 64, miniStroke: 6 },
  bar: { height: 6, dot: 14 },
  sparkline: { width: 120, height: 32, dot: 3 },
  stepperButton: 36,
  illustration: 96,
  leafMark: 20,
  tile: 104,
  micButton: 96,
  shutter: 76,
  cropGuide: 0.82,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const elevation = {
  shadowColor: colors.ink,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
} as const;

export const motion = {
  ringSpringMs: 500,
  countUpMs: 600,
  autoAdvanceMs: 250,
  toastMs: 5000,
  pressedScale: 0.98,
  sheetDamping: 20,
  shimmerMs: 900,
} as const;

export const opacity = {
  pressed: 0.85,
  disabled: 0.45,
} as const;
