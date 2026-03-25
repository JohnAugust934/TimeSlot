import Link from 'next/link';
import type { Route } from 'next';
import {
  CalendarDays,
  LayoutDashboard,
  Stethoscope,
  Users,
  BriefcaseBusiness,
  BookOpen,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const navigation: Array<{ href: Route; label: string; icon: typeof LayoutDashboard }> = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/professionals', label: 'Profissionais', icon: Stethoscope },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/services', label: 'Servicos', icon: BriefcaseBusiness },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/appointments', label: 'Agendamentos', icon: BookOpen },
];

interface SidebarProps {
  pathname: string;
}

export function Sidebar({ pathname }: SidebarProps) {
  return (
    <aside className="flex h-full w-full max-w-[280px] flex-col rounded-[2rem] border border-white/60 bg-[#10213c] p-5 text-white shadow-panel">
      <div className="mb-8 rounded-[1.5rem] bg-white/8 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-white/60">TimeSlot</p>
        <h2 className="mt-3 text-2xl font-semibold">Agenda multi-profissional</h2>
        <p className="mt-2 text-sm text-white/70">
          Operacao web responsiva para equipes, recepcao e profissionais.
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                active ? 'bg-white text-ink' : 'text-white/78 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <form action="/api/auth/logout" method="post">
        <button
          className="mt-6 w-full rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10"
          type="submit"
        >
          Sair
        </button>
      </form>
    </aside>
  );
}
