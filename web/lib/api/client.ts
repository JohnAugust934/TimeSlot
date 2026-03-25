import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

interface ApiRequestOptions extends RequestInit {
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.auth !== false && token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: options.cache ?? 'no-store',
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Falha ao comunicar com a API.');
  }

  return payload?.data ?? payload;
}
