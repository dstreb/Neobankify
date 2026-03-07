# Testing Neobankify Mobile App

## Overview
The Neobankify mobile app is a React Native (Expo) application. It can be tested via Expo web mode in a browser.

## Setup

### Starting the App
```bash
cd apps/mobile
npx expo start --web --port 8082
```
- The app will be available at `http://localhost:8082`
- If port 8082 is busy, try another port (e.g., 8083)
- Hot reload is enabled but may not always pick up changes to hooks like `useEffect`. If behavior seems stale, do a hard refresh (`Ctrl+Shift+R`)

### Exposing for External Testing
- Use the `deploy expose` tool to create a public tunnel URL for port 8082
- The tunnel URL requires basic auth credentials (generated automatically)
- Tunnel URLs expire when the session reboots — you'll need to re-expose after a reboot

## Navigation Structure
The app uses React Navigation with a bottom tab navigator containing 5 tabs:
1. **Home** — Dashboard with dark header, balance, quick actions (Deposit, Withdraw, Transfer)
2. **Offers** — Rewards and offers marketplace
3. **AI** — AI Banking Assistant (chat + voice)
4. **Wallet** — Cards, linked accounts, quick actions (Send Money, Request, Convert, Deposit)
5. **History** — Transaction history

### Cross-Tab Navigation
- Dashboard quick actions navigate from Home tab to Wallet tab's Payments screen using: `navigation.navigate('Wallet', { screen: 'Payments', params: { flow: '...' } })`
- React Navigation reuses mounted screens — `useState` initial values are ignored on subsequent navigations. The `useEffect` in PaymentsScreen syncs the step with route params.
- After cross-tab navigation, clicking the Wallet tab may show the Payments screen (still mounted) instead of Wallet home. Press back to return to Wallet home.

## Testing Deep-Linking
When testing deep-linking (buttons that navigate to specific screens):
1. Always hard refresh (`Ctrl+Shift+R`) before testing to ensure latest code is loaded
2. Test the primary flow first (e.g., Dashboard Deposit → Deposit Method screen)
3. Test the critical edge case: navigate to one flow (Deposit), go back, then navigate to a different flow (Transfer) — verify the second flow shows the correct screen, not the first
4. Test both Dashboard and Wallet tab quick actions independently

## Common Issues
- **Stale state after hot reload**: If hooks like `useEffect` don't seem to fire after code changes, do a full hard refresh (`Ctrl+Shift+R`)
- **Navigation stack persistence**: After cross-tab navigation, the Payments screen stays mounted in the Wallet tab's stack. You need to press back through the stack to reach the Wallet home screen.
- **System reboots**: The Expo server and tunnel URLs need to be restarted after session reboots. Check if the server is running before testing.
- **Multiple browser tabs**: Expo web may open multiple tabs. Close extra tabs to avoid confusion about which tab has the latest state.

## Devin Secrets Needed
- `GITHUB_TOKEN` — For pushing to the repo and creating PRs
- `ELEVENLABS_API_KEY` — For testing the AI voice mode feature (optional, only needed for voice testing)
