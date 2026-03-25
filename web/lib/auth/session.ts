import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME, USER_COOKIE_NAME } from './constants';
import type { AuthUser } from '@/types/auth';

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
  const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value ?? null;

  let user: AuthUser | null = null;

  if (userCookie) {
    try {
      user = JSON.parse(userCookie) as AuthUser;
    } catch {
      user = null;
    }
  }

  return { token, user };
}
