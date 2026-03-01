// =====================================================
// Spacing & Layout System
// =====================================================

export const spacing = {
  /** 2px */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 32px */
  xxxl: 32,
  /** 40px */
  xxxxl: 40,
  /** 48px */
  section: 48,
} as const;

export const borderRadius = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** Full rounding */
  full: 9999,
} as const;

export const hitSlop = {
  top: 10,
  right: 10,
  bottom: 10,
  left: 10,
} as const;
