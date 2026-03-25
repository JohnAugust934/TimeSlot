import type { AuthUser } from '@/types/auth';

interface TopbarProps {
  user: AuthUser | null;
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="flex items-center justify-between rounded-[1.75rem] border border-line bg-white/90 px-6 py-4 shadow-panel backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate">
          Painel operacional
        </p>
        <h1 className="mt-1 text-lg font-semibold text-ink">Bem-vindo de volta</h1>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-ink">{user?.name ?? 'Usuario autenticado'}</p>
        <p className="text-xs text-slate">{user?.role ?? 'ADMIN'}</p>
      </div>
    </header>
  );
}
