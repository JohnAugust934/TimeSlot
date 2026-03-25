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
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <SidebarShell />
        <div className="flex flex-col gap-4">
          <Topbar user={session.user} />
          <main className="flex-1 rounded-[2rem] border border-white/60 bg-[#fcfaf6]/90 p-5 shadow-panel backdrop-blur lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
