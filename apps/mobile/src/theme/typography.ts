import { TextStyle } from 'react-native';

// =====================================================
// Typography System - swiftbank UI Kit v1.1
// Font: Inter (Google Font)
// =====================================================

export interface TypographyScale {
  // Display sizes (swiftbank)
  displayLg: TextStyle;
  displayMd: TextStyle;
  displaySm: TextStyle;
  // Legacy aliases
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  subtitle1: TextStyle;
  subtitle2: TextStyle;
  body1: TextStyle;
  body2: TextStyle;
  button: TextStyle;
  caption: TextStyle;
  overline: TextStyle;
  amount: TextStyle;
  amountLarge: TextStyle;
}

// Inter is the swiftbank design system font
const baseFontFamily = 'Inter';

export function createTypography(fontFamily?: string): TypographyScale {
  const family = fontFamily || baseFontFamily;

  return {
    // swiftbank display sizes
    displayLg: {
      fontFamily: family,
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 38,
      letterSpacing: -0.5,
    },
    displayMd: {
      fontFamily: family,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    displaySm: {
      fontFamily: family,
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    // Legacy aliases mapped to swiftbank scale
    h1: {
      fontFamily: family,
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 38,
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: family,
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    h3: {
      fontFamily: family,
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    h4: {
      fontFamily: family,
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 26,
    },
    subtitle1: {
      fontFamily: family,
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 26,
    },
    subtitle2: {
      fontFamily: family,
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
    },
    body1: {
      fontFamily: family,
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    body2: {
      fontFamily: family,
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    button: {
      fontFamily: family,
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
      letterSpacing: 0.3,
    },
    caption: {
      fontFamily: family,
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    overline: {
      fontFamily: family,
      fontSize: 10,
      fontWeight: '600',
      lineHeight: 14,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    amount: {
      fontFamily: family,
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 28,
      fontVariant: ['tabular-nums'],
    },
    amountLarge: {
      fontFamily: family,
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 38,
      fontVariant: ['tabular-nums'],
    },
  };
}
