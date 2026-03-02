import apiClient from './client';
import type { ApiResponse, AuthTokens, LoginRequest, RegisterRequest } from '../types/api';
import type { User } from '../types/models';

// =====================================================
// Auth API
// =====================================================

export async function login(data: LoginRequest): Promise<ApiResponse<AuthTokens>> {
  const response = await apiClient.post<ApiResponse<AuthTokens>>('/v1/auth/login', data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<ApiResponse<AuthTokens & { userId: string }>> {
  const response = await apiClient.post<ApiResponse<AuthTokens & { userId: string }>>('/v1/auth/register', data);
  return response.data;
}

export async function refreshToken(refreshTokenStr: string): Promise<ApiResponse<AuthTokens>> {
  const response = await apiClient.post<ApiResponse<AuthTokens>>('/v1/auth/refresh', {
    refreshToken: refreshTokenStr,
  });
  return response.data;
}

export async function getProfile(): Promise<ApiResponse<User>> {
  const response = await apiClient.get<ApiResponse<User>>('/v1/users/me');
  return response.data;
}

export async function updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
  const response = await apiClient.patch<ApiResponse<User>>('/v1/users/me', data);
  return response.data;
}
