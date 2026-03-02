import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useTheme();
  const { colors, borderRadius: br } = theme;

  const getBackgroundColor = (): string => {
    if (disabled) return colors.disabled;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      case 'danger': return colors.error;
      default: return colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textTertiary;
    switch (variant) {
      case 'primary': return colors.textInverse;
      case 'secondary': return colors.textInverse;
      case 'outline': return colors.primary;
      case 'ghost': return colors.primary;
      case 'danger': return colors.textInverse;
      default: return colors.textInverse;
    }
  };

  const getPadding = (): { paddingVertical: number; paddingHorizontal: number } => {
    switch (size) {
      case 'sm': return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'md': return { paddingVertical: 12, paddingHorizontal: 24 };
      case 'lg': return { paddingVertical: 16, paddingHorizontal: 32 };
      default: return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm': return 14;
      case 'md': return 16;
      case 'lg': return 18;
      default: return 16;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: br.md,
          ...getPadding(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: getFontSize(),
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
