import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export function Header({ title, subtitle, showBack, onBack, rightAction }: HeaderProps) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.leftSection}>
        {showBack && onBack && (
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            style={{ marginRight: spacing.sm }}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity
          onPress={rightAction.onPress}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name={rightAction.icon} size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
