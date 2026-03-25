import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-[#0f1a30]',
  secondary: 'bg-white text-ink ring-1 ring-line hover:bg-sand/80',
  ghost: 'bg-transparent text-slate hover:bg-white/70',
};

export function Button({
  variant = 'primary',
  fullWidth,
  className,
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
