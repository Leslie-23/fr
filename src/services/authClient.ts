import { resetLocalDatabase } from '../db/client';
import { apiRequest } from './apiClient';
import { clearTokens, getStoredUser, saveStoredUser, saveTokens } from './tokenStore';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function register(email: string, password: string): Promise<AuthUser> {
  const res = await apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: { email, password } });
  await saveTokens(res);
  await saveStoredUser(res.user);
  return res.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } });
  await saveTokens(res);
  await saveStoredUser(res.user);
  return res.user;
}

export async function loginWithGoogle(idToken: string): Promise<AuthUser> {
  const res = await apiRequest<AuthResponse>('/auth/google', { method: 'POST', body: { idToken } });
  await saveTokens(res);
  await saveStoredUser(res.user);
  return res.user;
}

export async function logout(): Promise<void> {
  await clearTokens();
}

/**
 * Soft-deletes the account server-side (marks inactive, blocks future logins) — all
 * business/entry data stays intact. Always logs the local session out afterward, even if
 * the server call fails, since the account should no longer be treated as usable.
 */
export async function deactivateAccount(): Promise<void> {
  try {
    await apiRequest('/account/deactivate', { method: 'POST' });
  } finally {
    await clearTokens();
  }
}

/**
 * Hard-deletes the account: permanently erases the user and all their synced business/entry
 * data server-side, then wipes this device's local copy too. Irreversible. Only clears local
 * state once the server confirms success — if the request fails, nothing local is touched,
 * so the user can safely retry.
 */
export async function clearAccount(): Promise<void> {
  await apiRequest('/account', { method: 'DELETE' });
  await resetLocalDatabase();
  await clearTokens();
}

/** Returns the locally cached session, if any. Doesn't validate the token against the server. */
export async function getSession(): Promise<AuthUser | null> {
  return getStoredUser();
}
