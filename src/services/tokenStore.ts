import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'ledger.accessToken';
const REFRESH_KEY = 'ledger.refreshToken';
const USER_KEY = 'ledger.user';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens(tokens: TokenPair): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setAccessToken(accessToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function saveStoredUser(user: { id: string; email: string }): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getStoredUser(): Promise<{ id: string; email: string } | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
