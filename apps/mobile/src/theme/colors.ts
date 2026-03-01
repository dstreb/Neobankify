// =====================================================
// Color System - White-Label Ready
// =====================================================

export interface ColorPalette {
  // Brand colors (overridden by tenant config)
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  accent: string;

  // Semantic colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Neutrals
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
  primary: '#1a1a2e',
  primaryLight: '#2d2d5e',
  primaryDark: '#0f0f1a',
  secondary: '#16213e',
  secondaryLight: '#1f3055',
  accent: '#0f3460',

  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  background: '#f8f9fc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',
  disabled: '#cbd5e1',

  cardBackground: '#ffffff',
  cardBorder: '#e2e8f0',
  cardShadow: 'rgba(0, 0, 0, 0.05)',

  tabActive: '#1a1a2e',
  tabInactive: '#94a3b8',
  tabBackground: '#ffffff',
};

export const defaultDarkColors: ColorPalette = {
  primary: '#818cf8',
  primaryLight: '#a5b4fc',
  primaryDark: '#6366f1',
  secondary: '#38bdf8',
  secondaryLight: '#7dd3fc',
  accent: '#c084fc',

  success: '#34d399',
  successLight: '#064e3b',
  warning: '#fbbf24',
  warningLight: '#78350f',
  error: '#f87171',
  errorLight: '#7f1d1d',
  info: '#60a5fa',
  infoLight: '#1e3a5f',

  background: '#0f172a',
  surface: '#1e293b',
  surfaceElevated: '#334155',
  border: '#334155',
  borderLight: '#1e293b',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textInverse: '#0f172a',
  disabled: '#475569',

  cardBackground: '#1e293b',
  cardBorder: '#334155',
  cardShadow: 'rgba(0, 0, 0, 0.3)',

  tabActive: '#818cf8',
  tabInactive: '#64748b',
  tabBackground: '#1e293b',
};
