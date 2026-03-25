import { AppointmentStatusBadge } from './appointment-status-badge';
import type { AgendaDayColumn } from '@/types/agenda';

interface AgendaWeekViewProps {
  days: AgendaDayColumn[];
}

export function AgendaWeekView({ days }: AgendaWeekViewProps) {
  const timeLabels = days[0]?.slots.map((slot) => slot.timeLabel) ?? [];

  return (
    <div className="rounded-[1.75rem] border border-line bg-white shadow-panel">
      <div className="overflow-x-auto">
        <div className="grid min-w-[880px] grid-cols-[76px_repeat(7,minmax(150px,1fr))]">
          <div className="border-b border-line bg-sand/60 p-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate">
            Hora
          </div>
          {days.map((day) => (
            <div key={day.date} className="border-b border-l border-line bg-sand/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">
                {day.weekdayLabel}
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{day.label}</p>
            </div>
          ))}

          {timeLabels.map((timeLabel, rowIndex) => (
            <>
              <div
                key={`time-${timeLabel}`}
                className="border-b border-line p-3 text-xs font-semibold text-slate"
              >
                {timeLabel}
              </div>
              {days.map((day) => {
                const slot = day.slots[rowIndex];
                return (
                  <div
                    key={`${day.date}-${timeLabel}`}
                    className={`border-b border-l border-line p-2 ${getSlotClasses(slot.state)}`}
                  >
                    {slot.appointment ? (
                      <div className="space-y-1 rounded-xl bg-white/85 p-2">
                        <p className="text-xs font-semibold text-ink">
                          {slot.appointment.clientName}
                        </p>
                        <p className="text-[11px] text-slate">{slot.appointment.serviceName}</p>
                        <AppointmentStatusBadge status={slot.appointment.status} />
                      </div>
                    ) : slot.state === 'free' ? (
                      <div className="rounded-xl border border-dashed border-[#afd3af] bg-white/50 px-2 py-3 text-center text-[11px] font-medium text-[#356135]">
                        Livre
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      <div className="grid gap-3 border-t border-line p-4 md:hidden">
        {days.map((day) => (
          <div key={`mobile-${day.date}`} className="rounded-2xl border border-line bg-sand/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">
                  {day.weekdayLabel}
                </p>
                <p className="text-sm font-semibold text-ink">{day.label}</p>
              </div>
              <span className="text-xs text-slate">{day.appointmentsCount} agend.</span>
            </div>
            <div className="space-y-2">
              {day.slots
                .filter((slot) => slot.state !== 'unavailable')
                .slice(0, 6)
                .map((slot) => (
                  <div
                    key={slot.key}
                    className={`rounded-xl px-3 py-2 ${getSlotClasses(slot.state)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-ink">{slot.timeLabel}</span>
                      {slot.appointment ? (
                        <AppointmentStatusBadge status={slot.appointment.status} />
                      ) : (
                        <span className="text-[11px] font-semibold text-[#356135]">Livre</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSlotClasses(state: 'free' | 'occupied' | 'unavailable') {
  if (state === 'occupied') {
    return 'bg-[#fff4eb]';
  }

  if (state === 'free') {
    return 'bg-[#f2fbf2]';
  }

  return 'bg-[#f8f4ee]';
}
