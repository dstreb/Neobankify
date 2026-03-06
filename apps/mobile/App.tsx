import React from 'react';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

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
