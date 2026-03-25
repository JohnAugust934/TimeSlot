import { Manrope, Newsreader } from 'next/font/google';
import type { Metadata } from 'next';

import './globals.css';
import { cn } from '@/lib/utils';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans' });
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'TimeSlot Web',
  description: 'Frontend do sistema de agendamento multi-profissional.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={cn(manrope.variable, newsreader.variable, 'font-sans antialiased')}>
        {children}
      </body>
    </html>
  );
}
