import apiClient from './client';
import type { ApiResponse } from '../types/api';
import type { Card } from '../types/models';

// =====================================================
// Cards API
// =====================================================

export async function getCards(): Promise<ApiResponse<Card[]>> {
  const response = await apiClient.get<ApiResponse<Card[]>>('/v1/cards');
  return response.data;
}

export async function getCard(cardId: string): Promise<ApiResponse<Card>> {
  const response = await apiClient.get<ApiResponse<Card>>(`/v1/cards/${cardId}`);
  return response.data;
}

export async function addCard(data: {
  cardName: string;
  lastFour: string;
  network: string;
  expirationDate: string;
  rewardProgramId?: string;
  isPrimary?: boolean;
}): Promise<ApiResponse<Card>> {
  const response = await apiClient.post<ApiResponse<Card>>('/v1/cards', data);
  return response.data;
}

export async function updateCard(cardId: string, data: Partial<Card>): Promise<ApiResponse<Card>> {
  const response = await apiClient.patch<ApiResponse<Card>>(`/v1/cards/${cardId}`, data);
  return response.data;
}

export async function deleteCard(cardId: string): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/v1/cards/${cardId}`);
  return response.data;
}

export async function setPrimaryCard(cardId: string): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.patch<ApiResponse<{ message: string }>>(`/v1/cards/${cardId}/primary`, {});
  return response.data;
}
