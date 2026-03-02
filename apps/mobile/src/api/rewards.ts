import apiClient from './client';
import type { ApiResponse, PaginationParams } from '../types/api';
import type { RewardProgram, RewardsSummary, Recommendation } from '../types/models';

// =====================================================
// Rewards API
// =====================================================

export async function getRewardsSummary(): Promise<ApiResponse<RewardsSummary>> {
  const response = await apiClient.get<ApiResponse<RewardsSummary>>('/v1/rewards/summary');
  return response.data;
}

export async function getRewardPrograms(): Promise<ApiResponse<RewardProgram[]>> {
  const response = await apiClient.get<ApiResponse<RewardProgram[]>>('/v1/rewards/programs');
  return response.data;
}

export async function getOffers(): Promise<ApiResponse<Record<string, unknown>[]>> {
  const response = await apiClient.get<ApiResponse<Record<string, unknown>[]>>('/v1/rewards/offers');
  return response.data;
}

export async function getRewardsHistory(params?: PaginationParams): Promise<ApiResponse<Record<string, unknown>[]>> {
  const response = await apiClient.get<ApiResponse<Record<string, unknown>[]>>('/v1/rewards/history', { params });
  return response.data;
}

export async function getRecommendations(): Promise<ApiResponse<Recommendation[]>> {
  const response = await apiClient.get<ApiResponse<Recommendation[]>>('/v1/recommendations');
  return response.data;
}

export async function getRecommendation(id: string): Promise<ApiResponse<Recommendation>> {
  const response = await apiClient.get<ApiResponse<Recommendation>>(`/v1/recommendations/${id}`);
  return response.data;
}

export async function acceptRecommendation(id: string): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(`/v1/recommendations/${id}/accept`);
  return response.data;
}

export async function dismissRecommendation(id: string): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(`/v1/recommendations/${id}/dismiss`);
  return response.data;
}

export async function overrideRecommendation(id: string, reason: string): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(`/v1/recommendations/${id}/override`, { reason });
  return response.data;
}
