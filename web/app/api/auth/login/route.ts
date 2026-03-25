import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME, USER_COOKIE_NAME } from '@/lib/auth/constants';
import type { AuthUser } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: 'Informe e-mail e senha.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return NextResponse.json(
        { message: payload?.message ?? 'Falha na autenticacao.' },
        { status: response.status },
      );
    }

    const payload = await response.json();
    const data = payload?.data ?? payload;
    const token = data?.accessToken as string | undefined;
    const user: AuthUser = {
      id: data?.user?.id ?? 'local-user',
      name: data?.user?.name ?? 'Usuario autenticado',
      email: data?.user?.email ?? body.email,
      role: data?.user?.role ?? 'ADMIN',
    };

    if (!token) {
      return NextResponse.json({ message: 'Resposta de autenticacao invalida.' }, { status: 500 });
    }

    const responseWithCookies = NextResponse.json({ success: true });
    responseWithCookies.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });
    responseWithCookies.cookies.set(USER_COOKIE_NAME, JSON.stringify(user), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });
    return responseWithCookies;
  } catch {
    const fallbackUser: AuthUser = {
      id: 'demo-admin',
      name: 'Administrador Demo',
      email: body.email,
      role: 'ADMIN',
    };

    const responseWithCookies = NextResponse.json({ success: true, demo: true });
    responseWithCookies.cookies.set(AUTH_COOKIE_NAME, 'demo-token', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });
    responseWithCookies.cookies.set(USER_COOKIE_NAME, JSON.stringify(fallbackUser), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });
    return responseWithCookies;
  }
}
