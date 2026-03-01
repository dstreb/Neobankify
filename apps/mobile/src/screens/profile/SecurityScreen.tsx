import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { getBiometricEnabled, setBiometricEnabled } from '../../utils/storage';
import type { ProfileScreenProps } from '../../types/navigation';

export function SecurityScreen({ navigation }: ProfileScreenProps<'Security'>) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  const [biometricEnabled, setBiometricState] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function loadSettings() {
      const enabled = await getBiometricEnabled();
      setBiometricState(enabled);
    }
    loadSettings();
  }, []);

  const toggleBiometric = async () => {
    const newState = !biometricEnabled;
    setBiometricState(newState);
    await setBiometricEnabled(newState);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    try {
      // In production, call change password API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Password changed successfully');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      Alert.alert('Error', 'Failed to change password');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Security" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Biometric Authentication */}
        <Card style={{ marginBottom: spacing.lg }}>
          <TouchableOpacity onPress={toggleBiometric} style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="finger-print-outline" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Biometric Login
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Use Face ID or fingerprint to sign in
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, { backgroundColor: biometricEnabled ? colors.primary : colors.border }]}>
              <View style={[styles.toggleKnob, { transform: [{ translateX: biometricEnabled ? 20 : 0 }] }]} />
            </View>
          </TouchableOpacity>
        </Card>

        {/* Change Password */}
        <Card style={{ marginBottom: spacing.lg }}>
          <TouchableOpacity
            onPress={() => setShowChangePassword(!showChangePassword)}
            style={styles.settingRow}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                  Change Password
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  Update your account password
                </Text>
              </View>
            </View>
            <Ionicons
              name={showChangePassword ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {showChangePassword && (
            <View style={styles.passwordForm}>
              <Input
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                isPassword
                placeholder="Enter current password"
              />
              <Input
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                isPassword
                placeholder="Enter new password"
              />
              <Input
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                placeholder="Re-enter new password"
              />
              <Button
                title="Update Password"
                onPress={handleChangePassword}
                fullWidth
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </Card>

        {/* Session Info */}
        <Card style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SESSION</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Login</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Just now</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Device</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>This device</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 14,
    flex: 1,
  },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingDesc: { fontSize: 13, marginTop: 2 },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 4,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  passwordForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500' },
});
