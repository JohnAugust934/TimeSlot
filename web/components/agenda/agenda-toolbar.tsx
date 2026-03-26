'use client';

import type { Route } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import type { AgendaProfessionalOption, AgendaSummary, AgendaViewMode } from '@/types/agenda';

interface AgendaToolbarProps {
  professionals: AgendaProfessionalOption[];
  selectedProfessionalId: string | null;
  selectedDate: string;
  view: AgendaViewMode;
  summary: AgendaSummary;
  onDateChange: (value: string) => void;
  onProfessionalChange: (value: string) => void;
  onViewChange: (value: AgendaViewMode) => void;
  onStepDate: (direction: 'previous' | 'next') => void;
}

export function AgendaToolbar({
  professionals,
  selectedProfessionalId,
  selectedDate,
  view,
  summary,
  onDateChange,
  onProfessionalChange,
  onViewChange,
  onStepDate,
}: AgendaToolbarProps) {
  const createHref = `/appointments?${new URLSearchParams({
    professionalId: selectedProfessionalId ?? '',
    date: selectedDate,
  }).toString()}` as Route;

  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-line bg-white p-4 shadow-panel lg:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">
            Agenda operacional
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Horarios livres e ocupados</h2>
        </div>
        <Link href={createHref}>
          <Button className="w-full lg:w-auto">Criar agendamento</Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_auto_minmax(220px,280px)_minmax(180px,240px)] lg:items-center">
        <div className="inline-flex rounded-2xl bg-sand p-1">
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${view === 'day' ? 'bg-white text-ink shadow-sm' : 'text-slate'}`}
            onClick={() => onViewChange('day')}
            type="button"
          >
            Dia
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${view === 'week' ? 'bg-white text-ink shadow-sm' : 'text-slate'}`}
            onClick={() => onViewChange('week')}
            type="button"
          >
            Semana
          </button>
        </div>

        <div className="flex items-center gap-2 sm:justify-end lg:justify-start">
          <Button type="button" variant="secondary" onClick={() => onStepDate('previous')}>
            Anterior
          </Button>
          <Button type="button" variant="secondary" onClick={() => onStepDate('next')}>
            Proximo
          </Button>
        </div>

        <input
          className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          type="date"
          value={selectedDate}
          onChange={(event) => onDateChange(event.target.value)}
        />

        <select
          className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          value={selectedProfessionalId ?? ''}
          onChange={(event) => onProfessionalChange(event.target.value)}
          disabled={professionals.length === 0}
        >
          {professionals.length === 0 ? <option value="">Nenhum profissional</option> : null}
          {professionals.map((professional) => (
            <option key={professional.id} value={professional.id}>
              {professional.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Agendamentos" value={summary.totalAppointments} />
        <SummaryCard label="Slots ocupados" value={summary.occupiedSlots} />
        <SummaryCard label="Slots livres" value={summary.freeSlots} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-sand/65 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
