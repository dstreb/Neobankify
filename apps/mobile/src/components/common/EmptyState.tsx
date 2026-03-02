import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={colors.textTertiary} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" size="sm" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
});
