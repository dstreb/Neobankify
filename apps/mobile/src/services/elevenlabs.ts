// =====================================================
// ElevenLabs Text-to-Speech Service
// =====================================================
// Uses the ElevenLabs REST API to convert AI response text
// into spoken audio using a specific voice.
//
// In production, the API key should be proxied through your
// backend to avoid exposing it in client-side code.
// =====================================================

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// Default voice ID provided by client
const DEFAULT_VOICE_ID = '77f6FLYGLKZrrkKUqV4J';

// Model options — Flash v2.5 is recommended for low latency
const DEFAULT_MODEL_ID = 'eleven_flash_v2_5';

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
}

let _config: ElevenLabsConfig | null = null;

/**
 * Initialize the ElevenLabs service with an API key.
 * Call this once at app startup.
 */
export function initElevenLabs(config: ElevenLabsConfig): void {
  _config = {
    apiKey: config.apiKey,
    voiceId: config.voiceId || DEFAULT_VOICE_ID,
    modelId: config.modelId || DEFAULT_MODEL_ID,
  };
}

/**
 * Check if ElevenLabs is configured and ready to use.
 */
export function isElevenLabsReady(): boolean {
  return _config !== null && _config.apiKey.length > 0;
}

/**
 * Convert text to speech using ElevenLabs API.
 * Returns an audio Blob that can be played.
 */
export async function textToSpeech(
  text: string,
  options?: { voiceId?: string; modelId?: string },
): Promise<Blob> {
  if (!_config) {
    throw new Error('ElevenLabs not initialized. Call initElevenLabs() first.');
  }

  const voiceId = options?.voiceId || _config.voiceId || DEFAULT_VOICE_ID;
  const modelId = options?.modelId || _config.modelId || DEFAULT_MODEL_ID;

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': _config.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${errorText}`);
  }

  return response.blob();
}

/**
 * Convert text to speech and play it immediately.
 * Returns a cleanup function to stop playback.
 */
export async function speakText(
  text: string,
  options?: {
    voiceId?: string;
    modelId?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
  },
): Promise<() => void> {
  try {
    const audioBlob = await textToSpeech(text, options);
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.addEventListener('play', () => options?.onStart?.());
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(audioUrl);
      options?.onEnd?.();
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(audioUrl);
      options?.onError?.(new Error('Audio playback failed'));
    });

    await audio.play();

    // Return cleanup function
    return () => {
      audio.pause();
      audio.currentTime = 0;
      URL.revokeObjectURL(audioUrl);
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    options?.onError?.(err);
    return () => {};
  }
}

/**
 * Get the current configuration (for display purposes).
 */
export function getElevenLabsConfig(): { voiceId: string; modelId: string } | null {
  if (!_config) return null;
  return {
    voiceId: _config.voiceId || DEFAULT_VOICE_ID,
    modelId: _config.modelId || DEFAULT_MODEL_ID,
  };
}
