import Link from 'next/link';
import type { Route } from 'next';
import {
  CalendarDays,
  LayoutDashboard,
  Stethoscope,
  Users,
  BriefcaseBusiness,
  BookOpen,
  Clock3,
  Ban,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { AuthUser, UserRole } from '@/types/auth';

const navigation: Array<{
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}> = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'RECEPTIONIST', 'PROFESSIONAL'],
  },
  {
    href: '/professionals',
    label: 'Profissionais',
    icon: Stethoscope,
    roles: ['ADMIN', 'RECEPTIONIST'],
  },
  {
    href: '/clients',
    label: 'Clientes',
    icon: Users,
    roles: ['ADMIN', 'RECEPTIONIST', 'PROFESSIONAL'],
  },
  {
    href: '/services',
    label: 'Servicos',
    icon: BriefcaseBusiness,
    roles: ['ADMIN', 'RECEPTIONIST'],
  },
  {
    href: '/availabilities',
    label: 'Disponibilidade',
    icon: Clock3,
    roles: ['ADMIN', 'RECEPTIONIST', 'PROFESSIONAL'],
  },
  {
    href: '/agenda-blocks',
    label: 'Bloqueios',
    icon: Ban,
    roles: ['ADMIN', 'RECEPTIONIST', 'PROFESSIONAL'],
  },
  {
    href: '/agenda',
    label: 'Agenda',
    icon: CalendarDays,
    roles: ['ADMIN', 'RECEPTIONIST', 'PROFESSIONAL'],
  },
  {
    href: '/appointments',
    label: 'Agendamentos',
    icon: BookOpen,
    roles: ['ADMIN', 'RECEPTIONIST', 'PROFESSIONAL'],
  },
];

interface SidebarProps {
  pathname: string;
  user: AuthUser | null;
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ pathname, user, className, onNavigate }: SidebarProps) {
  const userRole = user?.role ?? 'ADMIN';
  const allowedItems = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        'flex h-full w-full max-w-[280px] flex-col rounded-[2rem] border border-white/60 bg-[#10213c] p-5 text-white shadow-panel',
        className,
      )}
    >
      <div className="mb-6 rounded-[1.25rem] bg-white/8 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-white/60">TimeSlot</p>
        <h2 className="mt-3 text-xl font-semibold">Agenda multi-profissional</h2>
        <p className="mt-2 text-sm text-white/70">
          Operacao web responsiva para equipes, recepcao e profissionais.
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {allowedItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
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

      <form action="/api/auth/logout" method="post" onSubmit={onNavigate}>
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
