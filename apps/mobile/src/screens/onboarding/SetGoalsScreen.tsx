import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import type { OnboardingScreenProps } from '../../types/navigation';

interface GoalOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const GOALS: GoalOption[] = [
  {
    id: 'maximize_cashback',
    icon: 'cash-outline',
    title: 'Maximize Cashback',
    description: 'Get the most cash back on every purchase',
  },
  {
    id: 'travel_rewards',
    icon: 'airplane-outline',
    title: 'Travel Rewards',
    description: 'Earn points for flights, hotels, and travel',
  },
  {
    id: 'save_more',
    icon: 'wallet-outline',
    title: 'Save More Money',
    description: 'Reduce unnecessary spending and grow savings',
  },
  {
    id: 'optimize_cards',
    icon: 'card-outline',
    title: 'Optimize Card Usage',
    description: 'Use the right card for every purchase category',
  },
  {
    id: 'reduce_fees',
    icon: 'shield-outline',
    title: 'Reduce Fees',
    description: 'Minimize interest charges and annual fees',
  },
  {
    id: 'grow_wealth',
    icon: 'trending-up-outline',
    title: 'Grow Wealth',
    description: 'Put idle cash to work with smart investments',
  },
];

export function SetGoalsScreen(_props: OnboardingScreenProps<'SetGoals'>) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { completeOnboarding } = useAuth();
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // In production, save goals to API
      await completeOnboarding();
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            What are your goals?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select one or more goals so our AI can personalize your experience.
          </Text>
        </View>

        <View style={styles.goals}>
          {GOALS.map((goal) => {
            const isSelected = selectedGoals.has(goal.id);
            return (
              <TouchableOpacity
                key={goal.id}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: isSelected ? colors.primary + '10' : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.goalIcon, { backgroundColor: isSelected ? colors.primary + '15' : colors.borderLight }]}>
                    <Ionicons name={goal.icon} size={24} color={isSelected ? colors.primary : colors.textSecondary} />
                  </View>
                  <View style={styles.goalText}>
                    <Text style={[styles.goalTitle, { color: colors.textPrimary }]}>
                      {goal.title}
                    </Text>
                    <Text style={[styles.goalDesc, { color: colors.textSecondary }]}>
                      {goal.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button
          title={selectedGoals.size > 0 ? `Continue (${selectedGoals.size} selected)` : 'Skip for now'}
          onPress={handleFinish}
          loading={loading}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  goals: {
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalText: {
    flex: 1,
    marginLeft: 14,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  goalDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
  },
});
