import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatRelativeTime, formatPercent } from '../../utils/formatters';
import * as rewardsApi from '../../api/rewards';
import type { Recommendation } from '../../types/models';
import type { RewardsScreenProps } from '../../types/navigation';

export function RecommendationDetailScreen({ route, navigation }: RewardsScreenProps<'RecommendationDetail'>) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { recommendationId } = route.params;

  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await rewardsApi.getRecommendation(recommendationId);
        setRecommendation(res.data);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [recommendationId]);

  const handleAccept = async () => {
    setActing(true);
    try {
      await rewardsApi.acceptRecommendation(recommendationId);
      setRecommendation((prev) => prev ? { ...prev, outcome: 'executed' } : prev);
    } catch {
      Alert.alert('Error', 'Failed to accept recommendation');
    } finally {
      setActing(false);
    }
  };

  const handleDismiss = async () => {
    setActing(true);
    try {
      await rewardsApi.dismissRecommendation(recommendationId);
      setRecommendation((prev) => prev ? { ...prev, outcome: 'dismissed' } : prev);
    } catch {
      Alert.alert('Error', 'Failed to dismiss recommendation');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!recommendation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Recommendation" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>Recommendation not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const confidencePct = recommendation.confidenceScore * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Recommendation" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        {recommendation.outcome !== 'recommended' && (
          <View style={[styles.statusBanner, {
            backgroundColor: recommendation.outcome === 'executed' ? colors.successLight : colors.warningLight,
          }]}>
            <Ionicons
              name={recommendation.outcome === 'executed' ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={recommendation.outcome === 'executed' ? colors.success : colors.warning}
            />
            <Text style={[styles.statusText, {
              color: recommendation.outcome === 'executed' ? colors.success : colors.warning,
            }]}>
              {recommendation.outcome === 'executed' ? 'Executed' : 'Dismissed'}
            </Text>
          </View>
        )}

        {/* Decision Type */}
        <Card elevated style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DECISION TYPE</Text>
          <Text style={[styles.decisionType, { color: colors.textPrimary }]}>
            {recommendation.decisionType.replace(/_/g, ' ')}
          </Text>
          <Text style={[styles.timeAgo, { color: colors.textTertiary }]}>
            {formatRelativeTime(recommendation.createdAt)}
          </Text>
        </Card>

        {/* Confidence */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CONFIDENCE</Text>
          <View style={styles.confidenceRow}>
            <View style={[styles.confidenceBar, { backgroundColor: colors.borderLight }]}>
              <View style={[styles.confidenceFill, {
                backgroundColor: confidencePct >= 70 ? colors.success : confidencePct >= 40 ? colors.warning : colors.error,
                width: `${confidencePct}%`,
              }]} />
            </View>
            <Text style={[styles.confidenceValue, { color: colors.textPrimary }]}>
              {formatPercent(confidencePct, 0)}
            </Text>
          </View>
        </Card>

        {/* Reasoning */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>REASONING</Text>
          <Text style={[styles.reasoning, { color: colors.textPrimary }]}>
            {recommendation.reasoning}
          </Text>
        </Card>

        {/* Agent Info */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SOURCE AGENT</Text>
          <View style={styles.agentRow}>
            <Ionicons name="hardware-chip-outline" size={24} color={colors.primary} />
            <Text style={[styles.agentName, { color: colors.textPrimary }]}>
              {recommendation.agentType.replace(/_/g, ' ')}
            </Text>
          </View>
        </Card>

        {/* Actions */}
        {recommendation.outcome === 'recommended' && (
          <View style={styles.actions}>
            <Button
              title="Accept Recommendation"
              onPress={handleAccept}
              loading={acting}
              fullWidth
              size="lg"
            />
            <Button
              title="Dismiss"
              onPress={handleDismiss}
              variant="outline"
              disabled={acting}
              fullWidth
              size="lg"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  statusText: { fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  decisionType: {
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  timeAgo: { fontSize: 13, marginTop: 4 },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceValue: { fontSize: 16, fontWeight: '700', minWidth: 44 },
  reasoning: { fontSize: 15, lineHeight: 22 },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agentName: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  actions: { marginTop: 8 },
});
