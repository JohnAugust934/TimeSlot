import type { AuthUser } from '@/types/auth';

interface TopbarProps {
  user: AuthUser | null;
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="flex flex-col gap-3 rounded-[1.25rem] border border-line bg-white/90 px-4 py-3 shadow-panel backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 md:rounded-[1.75rem] md:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate sm:text-xs">
          Painel operacional
        </p>
        <h1 className="mt-1 text-base font-semibold text-ink sm:text-lg">Bem-vindo de volta</h1>
      </div>
      <div className="text-left sm:text-right">
        <p className="text-sm font-semibold text-ink">{user?.name ?? 'Usuario autenticado'}</p>
        <p className="text-xs text-slate">{user?.role ?? 'ADMIN'}</p>
      </div>
    </header>
  );
}
