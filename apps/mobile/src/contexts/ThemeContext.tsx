import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, createTheme, lightTheme, darkTheme } from '../theme';
import type { ColorPalette } from '../theme/colors';

// =====================================================
// Theme Context - White-Label Theming Engine
// =====================================================

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  applyBrandColors: (overrides: Partial<ColorPalette>) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  brandOverrides?: Partial<ColorPalette>;
  fontFamily?: string;
}

export function ThemeProvider({ children, brandOverrides, fontFamily }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system');
  const [colorOverrides, setColorOverrides] = useState<Partial<ColorPalette> | undefined>(brandOverrides);

  const isDark = mode === 'system'
    ? systemColorScheme === 'dark'
    : mode === 'dark';

  const theme = useMemo(
    () => colorOverrides ? createTheme(isDark, colorOverrides, fontFamily) : (isDark ? darkTheme : lightTheme),
    [isDark, colorOverrides, fontFamily],
  );

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      return systemColorScheme === 'dark' ? 'light' : 'dark';
    });
  }, [systemColorScheme]);

  const setThemeMode = useCallback((newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
  }, []);

  const applyBrandColors = useCallback((overrides: Partial<ColorPalette>) => {
    setColorOverrides(overrides);
  }, []);

  const value = useMemo(
    () => ({ theme, isDark, toggleTheme, setThemeMode, applyBrandColors }),
    [theme, isDark, toggleTheme, setThemeMode, applyBrandColors],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
