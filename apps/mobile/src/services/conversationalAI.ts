// =====================================================
// ElevenLabs Conversational AI Service
// =====================================================
// Uses the @elevenlabs/client SDK to create real-time
// voice conversations with an ElevenLabs AI agent.
//
// The agent handles both STT and TTS internally — the
// user speaks into the mic, the agent processes their
// speech, generates a response, and speaks it back.
// =====================================================

import { Conversation } from '@elevenlabs/client';

export interface ConversationCallbacks {
  /** Called when connection status changes: 'connecting' | 'connected' | 'disconnected' */
  onStatusChange?: (status: string) => void;
  /** Called when mode changes between 'listening' and 'speaking' */
  onModeChange?: (mode: { mode: string }) => void;
  /** Called when a new message is received (user transcript or agent response) */
  onMessage?: (message: { source: string; message: string }) => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Called when conversation is disconnected */
  onDisconnect?: () => void;
  /** Called when conversation is connected */
  onConnect?: () => void;
}

/**
 * Overrides to customize the agent's behavior per-conversation.
 * Allows injecting dynamic user data (account balances, transactions, etc.)
 * into the agent's system prompt and first message.
 */
export interface ConversationOverrides {
  /** Override the agent's system prompt (e.g., inject financial data) */
  systemPrompt?: string;
  /** Override the agent's first message (e.g., personalized greeting) */
  firstMessage?: string;
}

let _activeConversation: typeof Conversation.prototype | null = null;

/**
 * Start a real-time voice conversation with an ElevenLabs agent.
 * This handles microphone input, speech recognition, AI response
 * generation, and text-to-speech output automatically.
 *
 * @param agentId - The ElevenLabs agent ID
 * @param callbacks - Optional event callbacks
 * @param overrides - Optional overrides for system prompt, first message, etc.
 * @returns The Conversation instance for control
 */
export async function startConversation(
  agentId: string,
  callbacks?: ConversationCallbacks,
  overrides?: ConversationOverrides,
): Promise<typeof Conversation.prototype> {
  // End any existing conversation first
  await endConversation();

  // Request microphone permission first
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately — we only needed to check permission
    stream.getTracks().forEach((track) => track.stop());
  } catch {
    throw new Error('Microphone access denied. Please allow microphone access to use voice mode.');
  }

  // Common callback handlers for session config
  const callbackHandlers = {
    onStatusChange: (status: { status: string }) => {
      callbacks?.onStatusChange?.(status.status);
    },
    onModeChange: (mode: { mode: string }) => {
      callbacks?.onModeChange?.(mode);
    },
    onMessage: (message: { source: string; message: string }) => {
      callbacks?.onMessage?.(message);
    },
    onError: (error: string) => {
      callbacks?.onError?.(error);
    },
    onDisconnect: () => {
      _activeConversation = null;
      callbacks?.onDisconnect?.();
    },
    onConnect: () => {
      callbacks?.onConnect?.();
    },
  };

  let conversation: typeof Conversation.prototype;

  // Try with overrides first (for dynamic financial context injection).
  // If overrides are not enabled in the agent's security settings,
  // fall back to connecting without overrides.
  const hasOverrides = !!(overrides?.systemPrompt || overrides?.firstMessage);

  if (hasOverrides) {
    try {
      conversation = await Conversation.startSession({
        agentId,
        overrides: {
          agent: {
            ...(overrides.systemPrompt ? { prompt: { prompt: overrides.systemPrompt } } : {}),
            ...(overrides.firstMessage ? { firstMessage: overrides.firstMessage } : {}),
          },
        },
        ...callbackHandlers,
      } as Parameters<typeof Conversation.startSession>[0]);
    } catch (overrideError) {
      // Overrides likely not enabled in agent security settings — retry without them
      console.warn('[ConvAI] Overrides failed, retrying without:', overrideError);
      conversation = await Conversation.startSession({
        agentId,
        ...callbackHandlers,
      } as Parameters<typeof Conversation.startSession>[0]);
    }
  } else {
    conversation = await Conversation.startSession({
      agentId,
      ...callbackHandlers,
    } as Parameters<typeof Conversation.startSession>[0]);
  }

  _activeConversation = conversation;
  return conversation;
}

/**
 * End the current conversation session.
 */
export async function endConversation(): Promise<void> {
  if (_activeConversation) {
    try {
      await _activeConversation.endSession();
    } catch {
      // Ignore errors during cleanup
    }
    _activeConversation = null;
  }
}

/**
 * Check if there is an active conversation.
 */
export function isConversationActive(): boolean {
  return _activeConversation !== null;
}

/**
 * Get the active conversation instance.
 */
export function getActiveConversation(): typeof Conversation.prototype | null {
  return _activeConversation;
}

/**
 * Set the volume of the agent's voice output.
 * @param volume - 0 to 1
 */
export async function setConversationVolume(volume: number): Promise<void> {
  if (_activeConversation) {
    await _activeConversation.setVolume({ volume });
  }
}
