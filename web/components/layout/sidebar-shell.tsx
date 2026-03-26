'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Sidebar } from './sidebar';
import { Button } from '@/components/ui/button';
import type { AuthUser } from '@/types/auth';

interface SidebarShellProps {
  user: AuthUser | null;
}

export function SidebarShell({ user }: SidebarShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between rounded-2xl border border-line bg-white/90 px-4 py-3 shadow-panel lg:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate">TimeSlot</p>
          <p className="text-sm font-semibold text-ink">Menu do sistema</p>
        </div>
        <Button type="button" variant="secondary" className="h-9 px-3" onClick={() => setMobileOpen(true)}>
          <Menu className="mr-2 size-4" />
          Menu
        </Button>
      </div>

      <div className="hidden lg:block">
        <Sidebar pathname={pathname} user={user} />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[86vw] max-w-[320px] p-3">
            <Sidebar
              pathname={pathname}
              user={user}
              className="max-w-none"
              onNavigate={() => setMobileOpen(false)}
            />
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full bg-white/15 p-2 text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
