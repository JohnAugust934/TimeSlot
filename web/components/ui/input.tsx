import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-ink">
      <span>{label}</span>
      <input
        className={cn(
          'h-11 rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate/60 focus:border-accent focus:ring-2 focus:ring-accent/20',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-danger">{error}</span> : null}
    </label>
  );
}
