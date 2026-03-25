import { AppointmentStatusBadge } from './appointment-status-badge';
import type { AgendaDayColumn } from '@/types/agenda';

interface AgendaDayViewProps {
  day: AgendaDayColumn | undefined;
}

export function AgendaDayView({ day }: AgendaDayViewProps) {
  if (!day) {
    return (
      <div className="rounded-[1.75rem] border border-line bg-white p-6 text-sm text-slate shadow-panel">
        Nenhum dia carregado para a agenda selecionada.
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-line bg-white p-4 shadow-panel lg:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate">
            {day.weekdayLabel}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">{day.label}</h3>
        </div>
        <p className="text-sm text-slate">{day.appointmentsCount} agendamentos</p>
      </div>

      <div className="space-y-2">
        {day.slots.map((slot) => (
          <div
            key={slot.key}
            className={`grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-2xl border px-3 py-3 ${getSlotClasses(slot.state)}`}
          >
            <div className="text-sm font-semibold text-ink">{slot.timeLabel}</div>
            {slot.appointment ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">{slot.appointment.clientName}</p>
                  <AppointmentStatusBadge status={slot.appointment.status} />
                </div>
                <p className="text-sm text-slate">{slot.appointment.serviceName}</p>
                <p className="text-xs text-slate">
                  {slot.appointment.startsAt.slice(11, 16)} -{' '}
                  {slot.appointment.endsAt.slice(11, 16)}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate">
                  {slot.state === 'free'
                    ? 'Horario livre para novo agendamento'
                    : 'Fora da disponibilidade'}
                </p>
                {slot.state === 'free' ? (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-accent ring-1 ring-line">
                    Livre
                  </span>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getSlotClasses(state: 'free' | 'occupied' | 'unavailable') {
  if (state === 'occupied') {
    return 'border-[#ffd9c3] bg-[#fff7f2]';
  }

  if (state === 'free') {
    return 'border-[#d8ead8] bg-[#f5fbf5]';
  }

  return 'border-line bg-[#f6f2ec]';
}
