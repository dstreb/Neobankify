import { TextStyle } from 'react-native';

// =====================================================
// Typography System
// =====================================================

export interface TypographyScale {
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

const baseFontFamily = 'System';

export function createTypography(fontFamily?: string): TypographyScale {
  const family = fontFamily || baseFontFamily;

  return {
    h1: {
      fontFamily: family,
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontFamily: family,
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 36,
      letterSpacing: -0.3,
    },
    h3: {
      fontFamily: family,
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h4: {
      fontFamily: family,
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
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
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 44,
      fontVariant: ['tabular-nums'],
    },
  };
}
