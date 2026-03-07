// =====================================================
// Speech Recognition Service (Web Speech API)
// =====================================================
// Uses the browser's built-in SpeechRecognition API for
// voice-to-text transcription. This is free and requires
// no API key. Works on Chrome, Edge, Safari (partial).
//
// For React Native (iOS/Android), this would be swapped
// for a native speech recognition module.
// =====================================================

// Type declarations for the Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

/**
 * Check if the Web Speech API is available in the current browser.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Request microphone permission from the user.
 * Returns true if granted, false otherwise.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately — we just needed the permission
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

let _activeRecognition: SpeechRecognitionInstance | null = null;

/**
 * Start listening for speech input.
 * Returns a stop function that can be called to end recognition.
 */
export function startListening(
  callbacks: SpeechRecognitionCallbacks,
  options?: { language?: string; continuous?: boolean },
): () => void {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onError?.('Speech recognition is not supported in this browser');
    return () => {};
  }

  // Stop any existing recognition
  if (_activeRecognition) {
    _activeRecognition.abort();
    _activeRecognition = null;
  }

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.continuous = options?.continuous ?? false;
  recognition.interimResults = true;
  recognition.lang = options?.language ?? 'en-US';

  recognition.onstart = () => {
    callbacks.onStart?.();
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    if (finalTranscript) {
      callbacks.onResult?.(finalTranscript, true);
    } else if (interimTranscript) {
      callbacks.onResult?.(interimTranscript, false);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    // 'no-speech' and 'aborted' are expected and not real errors
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      callbacks.onError?.(event.error);
    }
  };

  recognition.onend = () => {
    _activeRecognition = null;
    callbacks.onEnd?.();
  };

  _activeRecognition = recognition;
  recognition.start();

  // Return stop function
  return () => {
    if (_activeRecognition === recognition) {
      recognition.stop();
      _activeRecognition = null;
    }
  };
}

/**
 * Stop any active speech recognition.
 */
export function stopListening(): void {
  if (_activeRecognition) {
    _activeRecognition.stop();
    _activeRecognition = null;
  }
}

/**
 * Check if speech recognition is currently active.
 */
export function isListening(): boolean {
  return _activeRecognition !== null;
}
