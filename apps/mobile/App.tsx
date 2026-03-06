import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { TenantProvider } from './src/contexts/TenantContext';
import { AIProvider } from './src/contexts/AIContext';
import { SavingsPotsProvider } from './src/contexts/SavingsPotsContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useTheme } from './src/contexts/ThemeContext';
import { setupElevenLabs } from './src/config/elevenlabs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Try to initialize ElevenLabs from env/config at module load.
// If no key is available yet, users can enter it in Chat Settings.
try {
  // @ts-ignore — process.env may not exist in all RN environments
  const envKey = typeof process !== 'undefined' && process.env?.ELEVENLABS_API_KEY;
  if (envKey) {
    setupElevenLabs(envKey);
  }
} catch {
  // Silently ignore — user can configure in settings
}

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TenantProvider>
            <AuthProvider>
              <AIProvider>
                <SavingsPotsProvider>
                  <AppContent />
                </SavingsPotsProvider>
              </AIProvider>
            </AuthProvider>
          </TenantProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
