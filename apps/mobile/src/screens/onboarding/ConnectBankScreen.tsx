import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import type { OnboardingScreenProps } from '../../types/navigation';

export function ConnectBankScreen({ navigation }: OnboardingScreenProps<'ConnectBank'>) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const [connecting, setConnecting] = useState(false);

  const handleConnectBank = async () => {
    setConnecting(true);
    try {
      // In production, initialize Plaid Link here
      await new Promise((resolve) => setTimeout(resolve, 2000));
      navigation.navigate('SetGoals');
    } catch {
      // Handle error
    } finally {
      setConnecting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.infoLight }]}>
            <Ionicons name="link-outline" size={40} color={colors.info} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Connect your bank
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Securely link your accounts to track spending and optimize rewards automatically.
          </Text>
        </View>

        <Card elevated style={{ marginBottom: spacing.lg }}>
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.success} />
            <View style={styles.trustText}>
              <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>
                Bank-level security
              </Text>
              <Text style={[styles.trustDesc, { color: colors.textSecondary }]}>
                256-bit encryption protects your data
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.trustItem}>
            <Ionicons name="eye-off-outline" size={24} color={colors.success} />
            <View style={styles.trustText}>
              <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>
                Read-only access
              </Text>
              <Text style={[styles.trustDesc, { color: colors.textSecondary }]}>
                We can never move money or make transactions
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.success} />
            <View style={styles.trustText}>
              <Text style={[styles.trustTitle, { color: colors.textPrimary }]}>
                SOC2 compliant
              </Text>
              <Text style={[styles.trustDesc, { color: colors.textSecondary }]}>
                Enterprise-grade security standards
              </Text>
            </View>
          </View>
        </Card>

        <Button
          title="Connect Bank Account"
          onPress={handleConnectBank}
          loading={connecting}
          fullWidth
          size="lg"
        />

        <Button
          title="Skip for now"
          onPress={() => navigation.navigate('SetGoals')}
          variant="ghost"
          fullWidth
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  trustText: {
    flex: 1,
    marginLeft: 16,
  },
  trustTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  trustDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
