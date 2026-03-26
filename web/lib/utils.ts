import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(new Date(value))
    .replace(/\//g, '-');
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return `${formatDate(value)} ${formatTime(value)}`;
}

export function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}
