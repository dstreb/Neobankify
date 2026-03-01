import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTenant } from '../../contexts/TenantContext';
import { Button } from '../../components/common/Button';
import type { AuthScreenProps } from '../../types/navigation';

export function WelcomeScreen({ navigation }: AuthScreenProps<'Welcome'>) {
  const { theme } = useTheme();
  const { colors } = theme;
  const { brandConfig } = useTenant();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="wallet-outline" size={48} color={colors.textInverse} />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>
            {brandConfig.appName}
          </Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            AI-powered rewards optimization
          </Text>
        </View>

        <View style={styles.features}>
          {[
            { icon: 'gift-outline' as const, title: 'Maximize Rewards', desc: 'AI finds the best card for every purchase' },
            { icon: 'shield-checkmark-outline' as const, title: 'Smart Guardrails', desc: 'Prevents overspending and debt accumulation' },
            { icon: 'trending-up-outline' as const, title: 'Grow Idle Cash', desc: 'Optimize your savings with intelligent sweeps' },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight + '15' }]}>
                <Ionicons name={feature.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  {feature.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Register')}
            fullWidth
            size="lg"
          />
          <Button
            title="I already have an account"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            fullWidth
            size="lg"
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    marginTop: 4,
  },
  features: {
    gap: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureDesc: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 20,
  },
  actions: {
    marginBottom: 16,
  },
});
