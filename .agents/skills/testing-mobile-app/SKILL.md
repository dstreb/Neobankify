# Testing Neobankify Mobile App

## Overview
The Neobankify mobile app is a React Native (Expo) app located at `apps/mobile/`. It can be tested via Expo web mode in a browser.

## Setup

### Starting the app
```bash
cd apps/mobile
EXPO_PUBLIC_ELEVENLABS_API_KEY="$ELEVENLABS_API_KEY" npx expo start --web --port 8082 --clear
```

- The app takes ~30 seconds to bundle (~700 modules)
- A `favicon.png` file may need to be created in `apps/mobile/assets/` if it doesn't exist (Expo throws ENOENT otherwise — non-blocking but noisy)
- The app runs in DEMO_MODE (hardcoded in `AuthContext.tsx`) which bypasses authentication

### Mobile viewport
- Open Chrome DevTools (F12) and set device to iPhone 12 Pro (390x844) for mobile-accurate testing
- Or test in desktop mode — the app renders full-width

### Exposing for external testing
- Use the `deploy expose` tool on port 8082 to generate a public tunnel URL
- Sessions may reboot, requiring re-expose with a fresh URL

## Devin Secrets Needed
- `ELEVENLABS_API_KEY` — Required for voice mode (ElevenLabs Conversational AI agent connection)

## Navigation Structure
Bottom tabs: **Home | Offers | AI | Wallet | History**

### AI Banking Assistant
1. Click **AI** tab (3rd tab, sparkles icon)
2. **Onboarding welcome** → Click "Get Started"
3. **Onboarding limitations** → Click "I Understand, Continue"
4. **Chat interface** — Type messages, see rich cards, quick suggestion chips
5. **Voice mode** — Click mic button (bottom-right of chat input)

### Voice Mode Testing
- Voice mode requires microphone permission from the browser
- In headless/automated environments, mic permission may be denied — this is expected and shows an error message
- The voice mode UI has a split-screen layout:
  - **Top**: Header row (close button, title, status, stop/start button) + compact visualizer (animated mic icon, timer, transcript snippets)
  - **Bottom**: Scrollable widget panel that auto-populates with rich cards based on agent responses
- Empty state shows "Ask a question to see visuals" with sparkles icon
- When agent mentions keywords like "balance", "spending", "transactions", matching rich cards appear
- Close (X) button returns to chat with messages preserved

### Rich Card Testing (Chat Mode)
- Type "What is my balance?" → account_balance card appears
- Type "Show my spending" → spending_breakdown card appears  
- Type "Recent transactions" → recent_transactions card appears
- The same `renderRichCard()` function is used in both chat and voice widget panel

## Common Issues
- **Expo port conflicts**: If port 8082 is in use, Expo may prompt to use another port or fail. Kill existing processes first: `pkill -f expo; pkill -f metro`
- **Session reboots**: The VM may reboot periodically, killing the Expo process. You'll need to restart and re-expose.
- **Voice agent disconnect**: If the ElevenLabs agent disconnects immediately, check that no `first_message` or `prompt` overrides are being passed in the connection call. The agent's security settings may not allow overrides. Use `sendContextualUpdate()` after connection instead.
- **Microphone in headless browser**: `getUserMedia` will fail in headless environments. The voice mode UI will show "Microphone access denied" but the layout can still be verified visually.

## Key Files
- `apps/mobile/src/screens/ai/AIChatScreen.tsx` — Main AI chat + voice mode screen
- `apps/mobile/src/data/aiResponses.ts` — Rich card types, keyword patterns, mock AI responses
- `apps/mobile/src/services/conversationalAI.ts` — ElevenLabs Conversational AI SDK wrapper
- `apps/mobile/src/data/financialContext.ts` — Financial data injection for voice agent
- `apps/mobile/src/config/elevenlabs.ts` — ElevenLabs API key and agent ID configuration
