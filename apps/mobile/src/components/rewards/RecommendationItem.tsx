import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../common/Card';
import type { Recommendation } from '../../types/models';
import { formatRelativeTime, formatPercent } from '../../utils/formatters';

interface RecommendationItemProps {
  recommendation: Recommendation;
  onAccept: () => void;
  onDismiss: () => void;
  onPress: () => void;
}

const AGENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  rewards_optimization: 'gift-outline',
  idle_cash: 'trending-up-outline',
  risk_guardrail: 'shield-checkmark-outline',
  behavioral_learning: 'analytics-outline',
};

export function RecommendationItem({
  recommendation,
  onAccept,
  onDismiss,
  onPress,
}: RecommendationItemProps) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  const icon = AGENT_ICONS[recommendation.agentType] || 'bulb-outline';
  const confidence = recommendation.confidenceScore * 100;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card elevated style={{ marginBottom: spacing.md }}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight + '20' }]}>
            <Ionicons name={icon} size={24} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.type, { color: colors.textSecondary }]}>
              {recommendation.decisionType.replace(/_/g, ' ').toUpperCase()}
            </Text>
            <Text style={[styles.time, { color: colors.textTertiary }]}>
              {formatRelativeTime(recommendation.createdAt)}
            </Text>
          </View>
          <View style={[styles.confidenceBadge, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.confidenceText, { color: colors.success }]}>
              {formatPercent(confidence, 0)}
            </Text>
          </View>
        </View>

        <Text style={[styles.reasoning, { color: colors.textPrimary }]} numberOfLines={3}>
          {recommendation.reasoning}
        </Text>

        {recommendation.outcome === 'recommended' && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onAccept}
              style={[styles.actionButton, { backgroundColor: colors.success }]}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.actionText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDismiss}
              style={[styles.actionButton, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  type: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 12,
    marginTop: 2,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reasoning: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
