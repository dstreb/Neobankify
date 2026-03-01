import apiClient from './client';
import type { ApiResponse, PaginationParams } from '../types/api';
import type { Transaction } from '../types/models';

// =====================================================
// Transactions API
// =====================================================

export async function getTransactions(params?: PaginationParams): Promise<ApiResponse<Transaction[]>> {
  const response = await apiClient.get<ApiResponse<Transaction[]>>('/v1/transactions', { params });
  return response.data;
}

export async function getTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
  const response = await apiClient.get<ApiResponse<Transaction>>(`/v1/transactions/${transactionId}`);
  return response.data;
}
