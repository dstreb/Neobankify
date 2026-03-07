// =====================================================
// ElevenLabs Configuration
// =====================================================
// Centralized configuration for the ElevenLabs Voice AI
// integration. The API key can be set here or via the
// chat settings UI.
//
// In production, the API key should be proxied through
// your backend to avoid client-side exposure.
// =====================================================

import { initElevenLabs } from '../services/elevenlabs';

// Voice ID provided by client
const ELEVENLABS_VOICE_ID = '77f6FLYGLKZrrkKUqV4J';

// Low-latency model for conversational use
const ELEVENLABS_MODEL_ID = 'eleven_flash_v2_5';

// Conversational AI Agent ID provided by client
const ELEVENLABS_AGENT_ID = 'agent_0901kk35n9rperwav6v46029kzh8';

// API key — set via setupElevenLabs() or directly here for dev
let _apiKey = '';

/**
 * Initialize ElevenLabs with the given API key.
 * Call this at app startup or when the user provides their key.
 */
export function setupElevenLabs(apiKey: string): void {
  _apiKey = apiKey;
  initElevenLabs({
    apiKey,
    voiceId: ELEVENLABS_VOICE_ID,
    modelId: ELEVENLABS_MODEL_ID,
  });
}

/**
 * Get the current API key (for display/settings UI).
 */
export function getElevenLabsApiKey(): string {
  return _apiKey;
}

/**
 * Constants for use in settings UI.
 */
export const ELEVENLABS_DEFAULTS = {
  voiceId: ELEVENLABS_VOICE_ID,
  modelId: ELEVENLABS_MODEL_ID,
  agentId: ELEVENLABS_AGENT_ID,
} as const;

/**
 * Get the Conversational AI agent ID.
 */
export function getAgentId(): string {
  return ELEVENLABS_AGENT_ID;
}
