import apiClient from './client';
import type { ApiResponse } from '../types/api';
import type { ChatMessage } from '../types/models';

// =====================================================
// AI Assistant API
// =====================================================

export interface SendMessageRequest {
  conversationId?: string;
  message: string;
  context?: {
    screenContext?: string;
    recentTransactions?: boolean;
    rewardsSummary?: boolean;
    cardPortfolio?: boolean;
  };
}

export interface SendMessageResponse {
  conversationId: string;
  message: ChatMessage;
}

export interface ConversationListItem {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

/**
 * Send a message to the AI assistant and receive a response.
 */
export async function sendMessage(
  request: SendMessageRequest,
): Promise<ApiResponse<SendMessageResponse>> {
  const response = await apiClient.post('/v1/ai/chat', request);
  return response.data;
}

/**
 * Get conversation history.
 */
export async function getConversations(): Promise<ApiResponse<ConversationListItem[]>> {
  const response = await apiClient.get('/v1/ai/conversations');
  return response.data;
}

/**
 * Get messages for a specific conversation.
 */
export async function getConversationMessages(
  conversationId: string,
): Promise<ApiResponse<ChatMessage[]>> {
  const response = await apiClient.get(`/v1/ai/conversations/${conversationId}/messages`);
  return response.data;
}

/**
 * Execute an AI-suggested action.
 */
export async function executeAction(
  actionId: string,
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  const response = await apiClient.post(`/v1/ai/actions/${actionId}/execute`);
  return response.data;
}

/**
 * Send voice audio for transcription and AI processing.
 */
export async function sendVoiceMessage(
  audioBase64: string,
  conversationId?: string,
): Promise<ApiResponse<SendMessageResponse>> {
  const response = await apiClient.post('/v1/ai/voice', {
    audio: audioBase64,
    conversationId,
  });
  return response.data;
}
