import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { AIAction } from '../../types/models';

// =====================================================
// Actionable AI Suggestion Card
// =====================================================

interface ActionCardProps {
  action: AIAction;
  onExecute: (action: AIAction) => void;
}

const ACTION_ICONS: Record<AIAction['type'], keyof typeof Ionicons.glyphMap> = {
  switch_card: 'swap-horizontal-outline',
  activate_offer: 'pricetag-outline',
  optimize_rewards: 'trending-up-outline',
  set_goal: 'flag-outline',
  link_account: 'link-outline',
  custom: 'flash-outline',
};

export function ActionCard({ action, onExecute }: ActionCardProps) {
  const { theme } = useTheme();
  const { colors, borderRadius } = theme;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.primary + '08',
          borderColor: colors.primary + '25',
          borderRadius: borderRadius.lg,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name={ACTION_ICONS[action.type]} size={18} color={colors.primary} />
        </View>
        <View style={styles.textContent}>
          <Text style={[styles.label, { color: colors.primary }]}>{action.label}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {action.description}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: action.executed ? colors.success + '15' : colors.primary,
            borderRadius: borderRadius.md,
          },
        ]}
        onPress={() => onExecute(action)}
        disabled={action.executed}
        activeOpacity={0.7}
      >
        {action.executed ? (
          <>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.buttonText, { color: colors.success, marginLeft: 6 }]}>Done</Text>
          </>
        ) : (
          <>
            <Ionicons name="flash" size={16} color={colors.textInverse} />
            <Text style={[styles.buttonText, { color: colors.textInverse, marginLeft: 6 }]}>
              Take Action
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContent: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
