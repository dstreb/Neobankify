import { ColorPalette, defaultLightColors, defaultDarkColors } from './colors';
import { TypographyScale, createTypography } from './typography';
import { spacing, borderRadius } from './spacing';

// =====================================================
// Theme Engine - White-Label Support
// =====================================================

export interface Theme {
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  isDark: boolean;
}

export function createTheme(
  isDark: boolean,
  overrides?: Partial<ColorPalette>,
  fontFamily?: string,
): Theme {
  const baseColors = isDark ? defaultDarkColors : defaultLightColors;
  const colors = overrides ? { ...baseColors, ...overrides } : baseColors;

  return {
    colors,
    typography: createTypography(fontFamily),
    spacing,
    borderRadius,
    isDark,
  };
}

export const lightTheme = createTheme(false);
export const darkTheme = createTheme(true);

export { spacing, borderRadius } from './spacing';
export type { ColorPalette } from './colors';
export type { TypographyScale } from './typography';
