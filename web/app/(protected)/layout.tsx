import { redirect } from 'next/navigation';

import { SidebarShell } from '@/components/layout/sidebar-shell';
import { Topbar } from '@/components/layout/topbar';
import { getSession } from '@/lib/auth/session';

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!session.token) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen p-3 md:p-4 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1600px] gap-3 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-4">
        <SidebarShell user={session.user} />
        <div className="flex min-w-0 flex-col gap-3 lg:gap-4">
          <Topbar user={session.user} />
          <main className="flex-1 rounded-[1.25rem] border border-white/60 bg-[#fcfaf6]/90 p-4 shadow-panel backdrop-blur md:rounded-[1.5rem] md:p-5 lg:rounded-[2rem] lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
