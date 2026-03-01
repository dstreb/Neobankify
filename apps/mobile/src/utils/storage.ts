import * as SecureStore from 'expo-secure-store';

// =====================================================
// Secure Storage Wrapper
// =====================================================

const KEYS = {
  ACCESS_TOKEN: 'neobank_access_token',
  REFRESH_TOKEN: 'neobank_refresh_token',
  TENANT_ID: 'neobank_tenant_id',
  BIOMETRIC_ENABLED: 'neobank_biometric_enabled',
  ONBOARDING_COMPLETE: 'neobank_onboarding_complete',
  USER_PREFERENCES: 'neobank_user_preferences',
} as const;

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
}

export async function getTenantId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.TENANT_ID);
}

export async function setTenantId(tenantId: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.TENANT_ID, tenantId);
}

export async function getBiometricEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(KEYS.BIOMETRIC_ENABLED);
  return value === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEYS.BIOMETRIC_ENABLED, String(enabled));
}

export async function getOnboardingComplete(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(KEYS.ONBOARDING_COMPLETE);
  return value === 'true';
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ONBOARDING_COMPLETE, String(complete));
}

export async function clearAllTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
}

export async function clearAll(): Promise<void> {
  const allKeys = Object.values(KEYS);
  await Promise.all(allKeys.map((key) => SecureStore.deleteItemAsync(key)));
}
