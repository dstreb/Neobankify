import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as authApi from '../api/auth';
import * as storage from '../utils/storage';
import type { User } from '../types/models';
import type { LoginRequest, RegisterRequest } from '../types/api';

// =====================================================
// Auth Context
// =====================================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboardingComplete: boolean;
}

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isOnboardingComplete: false,
  });

  // Check for existing session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await storage.getAccessToken();
        const onboardingComplete = await storage.getOnboardingComplete();

        if (token) {
          const response = await authApi.getProfile();
          setState({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
            isOnboardingComplete: onboardingComplete,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        await storage.clearAllTokens();
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }
    checkAuth();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data);
    await storage.setAccessToken(response.data.accessToken);
    await storage.setRefreshToken(response.data.refreshToken);

    const profileResponse = await authApi.getProfile();
    const onboardingComplete = await storage.getOnboardingComplete();

    setState({
      user: profileResponse.data,
      isAuthenticated: true,
      isLoading: false,
      isOnboardingComplete: onboardingComplete,
    });
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    await storage.setAccessToken(response.data.accessToken);
    await storage.setRefreshToken(response.data.refreshToken);

    const profileResponse = await authApi.getProfile();

    setState({
      user: profileResponse.data,
      isAuthenticated: true,
      isLoading: false,
      isOnboardingComplete: false,
    });
  }, []);

  const logout = useCallback(async () => {
    await storage.clearAllTokens();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboardingComplete: false,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      setState((prev) => ({ ...prev, user: response.data }));
    } catch {
      // If profile fetch fails, user may be logged out
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    await storage.setOnboardingComplete(true);
    setState((prev) => ({ ...prev, isOnboardingComplete: true }));
  }, []);

  const value = useMemo(
    () => ({ ...state, login, register, logout, refreshUser, completeOnboarding }),
    [state, login, register, logout, refreshUser, completeOnboarding],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
