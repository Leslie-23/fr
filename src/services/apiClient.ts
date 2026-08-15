import { API_BASE_URL } from '../config';
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from './tokenStore';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    await clearTokens();
    return null;
  }
  const { accessToken } = await res.json();
  await setAccessToken(accessToken);
  return accessToken as string;
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
  _isRetry = false
): Promise<T> {
  const accessToken = await getAccessToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && accessToken && !_isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiRequest<T>(path, options, true);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}
