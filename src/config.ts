/**
 * Server base URL for auth/sync. Override per-environment via EXPO_PUBLIC_API_URL
 * (e.g. in a .env file) since "localhost" only resolves to the dev machine itself —
 * an Android emulator needs http://10.0.2.2:4000, a physical device needs your LAN IP.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Google sign-in client IDs, from Google Cloud Console. `webClientId` is required on both
 * platforms — Google issues ID tokens against the web client, not the iOS/Android one — and
 * doubles as the audience the server checks against (see server/.env.example). Unset until
 * real credentials are added; the "Continue with Google" button stays disabled until then.
 */
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
export const GOOGLE_AUTH_CONFIGURED = GOOGLE_WEB_CLIENT_ID.length > 0;
