import { AgendaPageClient } from '@/components/agenda/agenda-page-client';

export default function AgendaPage() {
  const initialDate = new Date().toISOString().slice(0, 10);

  return <AgendaPageClient initialDate={initialDate} />;
}
