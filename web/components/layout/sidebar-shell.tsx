'use client';

import { usePathname } from 'next/navigation';

import { Sidebar } from './sidebar';

export function SidebarShell() {
  const pathname = usePathname();

  return <Sidebar pathname={pathname} />;
}
