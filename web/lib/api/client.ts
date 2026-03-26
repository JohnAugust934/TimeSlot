import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME } from '@/lib/auth/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

interface ApiRequestOptions extends RequestInit {
  auth?: boolean;
}

interface ErrorPayload {
  message?: string;
  error?: {
    message?: string;
    code?: string;
    details?: string[];
  };
}

function resolveErrorMessage(payload: ErrorPayload | null) {
  if (!payload) {
    return 'Falha ao comunicar com a API.';
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  if (payload.error?.message?.trim()) {
    return payload.error.message;
  }

  if (payload.error?.details?.length) {
    return payload.error.details.join(' | ');
  }

  return 'Falha ao comunicar com a API.';
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

  const payload = (await response.json().catch(() => null)) as ErrorPayload | null;

  if (!response.ok) {
    throw new Error(resolveErrorMessage(payload));
  }

  return (payload as { data?: T } | null)?.data ?? (payload as T);
}
