import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, style, elevated = false, padding = 'md' }: CardProps) {
  const { theme } = useTheme();
  const { colors, borderRadius: br, spacing } = theme;

  const getPadding = (): number => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return spacing.sm;
      case 'md': return spacing.lg;
      case 'lg': return spacing.xxl;
      default: return spacing.lg;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.cardBackground,
          borderRadius: br.lg,
          borderColor: colors.cardBorder,
          padding: getPadding(),
        },
        elevated && {
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
