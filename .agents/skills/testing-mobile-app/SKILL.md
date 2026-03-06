# Testing Neobankify Mobile App

## Overview
The mobile app is a React Native (Expo) project located at `apps/mobile/`. It can be tested via Expo web mode in a browser without requiring iOS/Android simulators.

## Prerequisites

### Demo Mode Setup (Local-Only Changes)
The app requires a backend for auth and tenant context. For local testing without a backend, apply these temporary changes (DO NOT commit):

1. **AuthContext** (`apps/mobile/src/contexts/AuthContext.tsx`): Add a `DEMO_MODE = true` flag that bypasses login and provides mock user data (email: 'demo@neobank.com', firstName: 'Demo', lastName: 'User').
2. **TenantContext** (`apps/mobile/src/contexts/TenantContext.tsx`): Add a `DEMO_MODE = true` flag that provides mock tenant config with all feature flags enabled.
3. **Entry point** (`apps/mobile/index.js`): Create this file with `import registerRootComponent from 'expo/build/launch/registerRootComponent'; import App from './App'; registerRootComponent(App);` and update `package.json` main field to `./index.js`.

### Web Dependencies
Expo web mode requires additional packages. Install with:
```bash
npm install react-native-web@~0.19.6 @expo/metro-runtime@~3.1.3 react-dom@18.2.0 --legacy-peer-deps
```
Note: `--legacy-peer-deps` is needed due to peer dependency conflicts between react-dom versions.

## Booting the App

```bash
cd apps/mobile
npx expo start --web --port 8082
```

If port 8082 is in use, Expo will prompt for an alternative port (e.g., 8083). Accept it.

The app will be available at `http://localhost:<port>`.

## Testing in Browser

### Device Emulation
Open Chrome DevTools (F12) and use the device toolbar to emulate a mobile device. **iPhone 12 Pro (390x844)** is a good choice for testing.

### TextInput Quirk (Expo Web)
React Native Web TextInput fields may not accept keyboard input when clicking directly in the full browser view. **Workaround:**
1. Open Chrome DevTools (F12) — this switches to device emulation mode
2. Click on the input field in the device emulation view
3. Type normally — the input should now accept text

This is an Expo web-specific issue and does NOT affect native iOS/Android builds.

### Exposing to User
To let the user interact with the app remotely, use the `deploy` tool with `command: 'expose'` and the port number. This creates a public tunnel URL with basic auth.

## Key Navigation Paths

- **Home tab** → Dashboard with dark header, account selector, My Accounts section
- **Add Account** → Two entry points:
  1. Dashboard → My Accounts → "Add New Account" button
  2. Dashboard → Tap account pill in header → Account picker modal → "Add Account"
- **Profile** → Tap avatar icon in top-right corner of any screen
- **5 bottom tabs**: Home, Offers, AI, Wallet, History

## Common Console Errors (Safe to Ignore)

- `ExpoSecureStore.default.deleteValueWithKeyAsync is not a function` — SecureStore not available in web mode
- `props.pointerEvents is deprecated. Use style.pointerEvents` — React Native Web deprecation warning
- `Failed to load resource: :8083/favicon.ico:1` — No favicon configured for Expo web

## Devin Secrets Needed
- `GITHUB_TOKEN` — For pushing to the repo and creating/updating PRs
