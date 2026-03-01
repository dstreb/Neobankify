import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

// =====================================================
// Quick Action Suggestion Chips
// =====================================================

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Optimize Rewards', icon: 'gift-outline', prompt: 'How can I earn more cashback this month?' },
  { label: 'Spending Analysis', icon: 'pie-chart-outline', prompt: 'Analyze my spending patterns' },
  { label: 'Best Card', icon: 'card-outline', prompt: 'Which card should I use for groceries?' },
  { label: 'Activate Offers', icon: 'pricetag-outline', prompt: 'What offers should I activate?' },
  { label: 'Savings Tips', icon: 'wallet-outline', prompt: 'How can I save more money?' },
  { label: 'Set a Goal', icon: 'flag-outline', prompt: 'Help me set a financial goal' },
];

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
}

export function QuickActions({ onSelect }: QuickActionsProps) {
  const { theme } = useTheme();
  const { colors, borderRadius } = theme;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textTertiary }]}>Suggestions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[
              styles.chip,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}
            onPress={() => onSelect(action.prompt)}
            activeOpacity={0.7}
          >
            <Ionicons name={action.icon} size={14} color={colors.primary} style={styles.chipIcon} />
            <Text style={[styles.chipText, { color: colors.textPrimary }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginHorizontal: 2,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
