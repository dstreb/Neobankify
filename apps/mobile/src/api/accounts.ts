import apiClient from './client';
import type { ApiResponse } from '../types/api';
import type { LinkedAccount } from '../types/models';

// =====================================================
// Account Aggregation API
// =====================================================

export async function getLinkedAccounts(): Promise<ApiResponse<LinkedAccount[]>> {
  const response = await apiClient.get<ApiResponse<LinkedAccount[]>>('/v1/accounts');
  return response.data;
}

export async function getLinkedAccount(accountId: string): Promise<ApiResponse<LinkedAccount>> {
  const response = await apiClient.get<ApiResponse<LinkedAccount>>(`/v1/accounts/${accountId}`);
  return response.data;
}

export async function createLinkToken(): Promise<ApiResponse<{ linkToken: string }>> {
  const response = await apiClient.post<ApiResponse<{ linkToken: string }>>('/v1/accounts/link-token');
  return response.data;
}

export async function exchangePublicToken(publicToken: string): Promise<ApiResponse<LinkedAccount>> {
  const response = await apiClient.post<ApiResponse<LinkedAccount>>('/v1/accounts/exchange-token', { publicToken });
  return response.data;
}

export async function unlinkAccount(accountId: string): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/v1/accounts/${accountId}`);
  return response.data;
}
