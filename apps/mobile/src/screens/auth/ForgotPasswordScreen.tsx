import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { isValidEmail } from '../../utils/validators';
import type { AuthScreenProps } from '../../types/navigation';

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const { theme } = useTheme();
  const { colors } = theme;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // In production, call forgot password API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSent(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
            <Ionicons name="mail-outline" size={48} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
            Check your email
          </Text>
          <Text style={[styles.successText, { color: colors.textSecondary }]}>
            We&apos;ve sent a password reset link to {email}. Please check your inbox.
          </Text>
          <Button
            title="Back to Sign In"
            onPress={() => navigation.navigate('Login')}
            fullWidth
            style={{ marginTop: 32 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Reset password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the email associated with your account and we&apos;ll send you a reset link.
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon="mail-outline"
          />

          <Button
            title="Send Reset Link"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="lg"
          />

          <Button
            title="Back to Sign In"
            onPress={() => navigation.navigate('Login')}
            variant="ghost"
            fullWidth
            style={{ marginTop: 12 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
