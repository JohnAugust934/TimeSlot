'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type LoginFormValues, loginSchema } from '@/lib/schemas/login-schema';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@timeslot.local',
      password: '123456',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setFormError(payload?.message ?? 'Nao foi possivel autenticar.');
      return;
    }

    const redirectTarget = (searchParams.get('redirect') ?? '/dashboard') as Route;
    router.push(redirectTarget);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label="E-mail"
        type="email"
        placeholder="voce@empresa.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Senha"
        type="password"
        placeholder="Sua senha"
        error={errors.password?.message}
        {...register('password')}
      />
      {formError ? <p className="text-sm font-medium text-danger">{formError}</p> : null}
      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
