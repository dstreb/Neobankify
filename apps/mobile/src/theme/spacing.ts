// =====================================================
// Spacing & Layout System - swiftbank UI Kit v1.1
// =====================================================

export const spacing = {
  /** 4px — 2xs */
  xxs: 4,
  /** 8px — xs */
  xs: 8,
  /** 12px — sm */
  sm: 12,
  /** 16px — md */
  md: 16,
  /** 20px — lg */
  lg: 20,
  /** 24px — xl */
  xl: 24,
  /** 32px — 2xl */
  xxl: 32,
  /** 40px — 3xl */
  xxxl: 40,
  /** 48px — 4xl */
  xxxxl: 48,
  /** 64px — 5xl */
  section: 64,
  /** 80px — 6xl */
  sectionLg: 80,
} as const;

export const borderRadius = {
  /** 8px — sm */
  sm: 8,
  /** 12px — md */
  md: 12,
  /** 16px — lg */
  lg: 16,
  /** 24px — xl */
  xl: 24,
  /** 32px — 2xl */
  xxl: 32,
  /** 48px — 3xl */
  xxxl: 48,
  /** 64px — 4xl */
  xxxxl: 64,
  /** Full rounding */
  full: 9999,
} as const;

export const hitSlop = {
  top: 10,
  right: 10,
  bottom: 10,
  left: 10,
} as const;
