// =====================================================
// Color System - swiftbank UI Kit v1.1
// =====================================================

export interface ColorPalette {
  // Brand colors (swiftbank sky blue palette)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  accent: string;

  // Brand scale
  brand10: string;
  brand20: string;
  brand30: string;
  brand40: string;
  brand50: string;
  brand60: string;
  brand70: string;
  brand80: string;
  brand90: string;

  // Semantic colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Neutrals (Gray scale)
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  disabled: string;

  // Card-specific
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;

  // Tab bar
  tabActive: string;
  tabInactive: string;
  tabBackground: string;
}

export const defaultLightColors: ColorPalette = {
  // Brand — swiftbank sky blue
  primary: '#0369A1',
  primaryLight: '#0EA5E9',
  primaryDark: '#075985',
  secondary: '#38BDF8',
  secondaryLight: '#7DD3FC',
  accent: '#BAE6FD',

  // Brand scale
  brand10: '#F0F9FF',
  brand20: '#E0F2FE',
  brand30: '#BAE6FD',
  brand40: '#7DD3FC',
  brand50: '#38BDF8',
  brand60: '#0EA5E9',
  brand70: '#0369A1',
  brand80: '#075985',
  brand90: '#0C4A6E',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutrals — swiftbank gray scale
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  disabled: '#D1D5DB',

  // Card
  cardBackground: '#FFFFFF',
  cardBorder: '#E5E7EB',
  cardShadow: 'rgba(0, 0, 0, 0.05)',

  // Tab bar — swiftbank spec
  tabActive: '#0369A1',
  tabInactive: '#9CA3AF',
  tabBackground: '#FFFFFF',
};

export const defaultDarkColors: ColorPalette = {
  // Brand — swiftbank sky blue (lighter for dark mode)
  primary: '#38BDF8',
  primaryLight: '#7DD3FC',
  primaryDark: '#0EA5E9',
  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  accent: '#0369A1',

  // Brand scale (inverted for dark mode)
  brand10: '#0C4A6E',
  brand20: '#075985',
  brand30: '#0369A1',
  brand40: '#0EA5E9',
  brand50: '#38BDF8',
  brand60: '#7DD3FC',
  brand70: '#38BDF8',
  brand80: '#BAE6FD',
  brand90: '#E0F2FE',

  // Semantic
  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#78350F',
  error: '#F87171',
  errorLight: '#7F1D1D',
  info: '#60A5FA',
  infoLight: '#1E3A5F',

  // Neutrals — swiftbank dark mode
  background: '#111827',
  surface: '#1F2937',
  surfaceElevated: '#374151',
  border: '#374151',
  borderLight: '#1F2937',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  textInverse: '#111827',
  disabled: '#4B5563',

  // Card
  cardBackground: '#1F2937',
  cardBorder: '#374151',
  cardShadow: 'rgba(0, 0, 0, 0.3)',

  // Tab bar
  tabActive: '#38BDF8',
  tabInactive: '#6B7280',
  tabBackground: '#1F2937',
};
