import { Platform } from 'react-native';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../config';

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let configured = false;

/**
 * Loads the native Google sign-in module. This MUST stay a function-scoped `require`, never
 * a top-level `import` — the package uses React Native's TurboModule registry, which throws
 * synchronously at *import* time (not call time) when the native module isn't linked. A
 * top-level import would crash the web build and Expo Go before this is ever called.
 */
function loadGoogleSignin(): GoogleSigninModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-google-signin/google-signin');
}

function ensureConfigured(): GoogleSigninModule['GoogleSignin'] {
  const { GoogleSignin } = loadGoogleSignin();
  if (!configured) {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    });
    configured = true;
  }
  return GoogleSignin;
}

/**
 * Runs the native Google sign-in flow and returns an ID token, or null if the user cancelled.
 * Native-only (iOS/Android dev client) — callers must check GOOGLE_AUTH_CONFIGURED and
 * Platform.OS !== 'web' before calling this.
 */
export async function signInWithGoogle(): Promise<string | null> {
  const GoogleSignin = ensureConfigured();
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }
  const result = await GoogleSignin.signIn();
  if (result.type === 'cancelled') return null;
  if (!result.data.idToken) {
    throw new Error('Google did not return an ID token');
  }
  return result.data.idToken;
}
