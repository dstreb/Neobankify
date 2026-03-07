# Testing Mobile App - ElevenLabs Voice AI Integration

## Overview
The mobile app (Expo React Native) includes an AI Banking Assistant with two voice modes:
1. **Text Chat + TTS**: User types messages, AI responds with text + rich cards. "Listen" button uses ElevenLabs REST API for text-to-speech.
2. **Voice Mode (Conversational AI)**: Full real-time voice conversation via ElevenLabs Conversational AI agent (WebSocket). Agent handles STT, AI processing, and TTS automatically.

## Devin Secrets Needed
- `ELEVENLABS_API_KEY` — ElevenLabs API key for TTS and agent auth
- `GITHUB_TOKEN` — For pushing to the repo

## Environment Setup

### Starting the Expo Dev Server
```bash
cd /home/ubuntu/neobank-platform/apps/mobile
EXPO_PUBLIC_ELEVENLABS_API_KEY="$ELEVENLABS_API_KEY" npx expo start --web --port 8082 --clear
```

**Important:** The `EXPO_PUBLIC_` prefix is required for Expo web to embed env vars in the client bundle. Without it, the API key is only available server-side and voice features won't auto-configure.

### Demo Credentials
- Username: `user`
- Password: Check AuthContext.tsx for the current demo password hash

## Navigation Path to Voice Mode
1. Click **AI** tab (3rd tab in bottom navigation, sparkle icon)
2. Click **"Get Started"** on the welcome screen
3. Click **"I Understand, Continue"** on the limitations screen
4. Now on chat screen — the **mic button** (microphone icon) is in the bottom-right of the input bar (visible when text input is empty; send button shows when text is typed)
5. Click the **mic button** to enter voice mode

## Testing Voice Mode

### What to verify:
- Voice mode UI shows: "Voice Mode" title, "ElevenLabs Conversational AI" subtitle
- Status progression: "Connecting to AI Agent..." → "Connected — speak to start" → "Listening to you..." / "Agent is speaking..."
- User transcript appears under "You said:"
- Agent response appears in green under "Agent:"
- Stop button ends conversation and saves messages to chat history
- Close (X) button exits voice mode without errors

### Known Limitations in Headless/CI Environments
- **Microphone access will be denied** in headless Chrome environments (no physical mic). This causes the error: "Microphone access denied. Please allow microphone access to use voice mode." This is expected behavior.
- To fully test voice mode end-to-end, you need a browser with microphone access (e.g., David testing via the exposed tunnel URL).
- The Conversational AI agent connection (WebSocket) requires the agent to be properly configured in ElevenLabs dashboard.

### Testing Text Chat + TTS (Listen Button)
This doesn't require a microphone:
1. On the chat screen, type a message like "Show my balance"
2. Click the send button
3. Verify AI response appears with a rich card and a **"Listen"** button
4. Click "Listen" to verify TTS audio plays

## Configuration
- **Agent ID**: Configured in `apps/mobile/src/config/elevenlabs.ts` — `getAgentId()`
- **Voice ID**: Configured in same file — used for TTS Listen buttons
- **Service modules**: 
  - `services/conversationalAI.ts` — Wraps `Conversation.startSession()` from `@elevenlabs/client`
  - `services/elevenlabs.ts` — REST API TTS for Listen buttons
  - `services/speechRecognition.ts` — Web Speech API (legacy, still imported but not used in voice mode)

## Exposing for External Testing
```bash
# Use the deploy tool with command='expose' and port=8082
# This generates a public URL with basic auth credentials
```
The tunnel URL requires basic auth — share both the URL and credentials with the tester.

## Common Issues
- **"Listen" buttons not appearing**: ElevenLabs API key not reaching client-side. Ensure `EXPO_PUBLIC_ELEVENLABS_API_KEY` is set when starting Expo.
- **Voice mode fails to connect**: Agent ID may be invalid or agent may be private. Verify in ElevenLabs dashboard.
- **favicon.ico 500 error in console**: Pre-existing issue, not related to voice features. Can be ignored.
- **`props.pointerEvents` deprecation warning**: Pre-existing React Native Web warning. Can be ignored.
