import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME, USER_COOKIE_NAME } from '@/lib/auth/constants';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.set(AUTH_COOKIE_NAME, '', { httpOnly: true, path: '/', expires: new Date(0) });
  response.cookies.set(USER_COOKIE_NAME, '', { httpOnly: true, path: '/', expires: new Date(0) });
  return response;
}
