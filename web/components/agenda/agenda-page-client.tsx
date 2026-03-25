'use client';

import { useEffect, useState } from 'react';

import { AgendaDayView } from './agenda-day-view';
import { AgendaLegend } from './agenda-legend';
import { AgendaToolbar } from './agenda-toolbar';
import { AgendaWeekView } from './agenda-week-view';
import { PageHeader } from '@/components/ui/page-header';
import { loadAgenda } from '@/lib/api/agenda';
import type { AgendaResponse, AgendaViewMode } from '@/types/agenda';

interface AgendaPageClientProps {
  initialDate: string;
}

export function AgendaPageClient({ initialDate }: AgendaPageClientProps) {
  const [view, setView] = useState<AgendaViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [data, setData] = useState<AgendaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchAgenda() {
      setLoading(true);
      setError(null);

      try {
        const response = await loadAgenda({
          date: selectedDate,
          view,
          professionalId: selectedProfessionalId,
        });

        if (!active) {
          return;
        }

        setData(response);
        setSelectedProfessionalId(response.selectedProfessionalId);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        setError(
          fetchError instanceof Error ? fetchError.message : 'Nao foi possivel carregar a agenda.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchAgenda();

    return () => {
      active = false;
    };
  }, [selectedDate, selectedProfessionalId, view]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Painel operacional com visualizacao por dia e semana, foco em disponibilidade real e status dos agendamentos."
      />

      <AgendaToolbar
        professionals={data?.professionals ?? []}
        selectedProfessionalId={selectedProfessionalId}
        selectedDate={selectedDate}
        view={view}
        summary={
          data?.summary ?? {
            totalAppointments: 0,
            occupiedSlots: 0,
            freeSlots: 0,
          }
        }
        onDateChange={setSelectedDate}
        onProfessionalChange={(value) => setSelectedProfessionalId(value || null)}
        onViewChange={setView}
        onStepDate={(direction) => {
          const baseDate = new Date(`${selectedDate}T00:00:00.000Z`);
          const amount = view === 'week' ? 7 : 1;
          baseDate.setUTCDate(baseDate.getUTCDate() + (direction === 'next' ? amount : -amount));
          setSelectedDate(baseDate.toISOString().slice(0, 10));
        }}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            {data?.range.label ?? 'Carregando periodo...'}
          </p>
          <p className="text-xs text-slate">
            Profissional selecionado e disponibilidade aplicada em tempo real.
          </p>
        </div>
        <AgendaLegend />
      </div>

      {loading ? (
        <div className="rounded-[1.75rem] border border-line bg-white p-8 text-sm text-slate shadow-panel">
          Carregando agenda...
        </div>
      ) : error ? (
        <div className="rounded-[1.75rem] border border-danger/30 bg-white p-8 text-sm text-danger shadow-panel">
          {error}
        </div>
      ) : view === 'day' ? (
        <AgendaDayView day={data?.days[0]} />
      ) : (
        <AgendaWeekView days={data?.days ?? []} />
      )}
    </div>
  );
}
