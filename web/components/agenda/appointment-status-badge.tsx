import type { AgendaAppointmentItem } from '@/types/agenda';
import { cn } from '@/lib/utils';

const statusMap: Record<AgendaAppointmentItem['status'], { label: string; className: string }> = {
  SCHEDULED: { label: 'Agendado', className: 'bg-[#eef2ff] text-[#3146a6]' },
  CONFIRMED: { label: 'Confirmado', className: 'bg-[#eef8f2] text-success' },
  IN_PROGRESS: { label: 'Em andamento', className: 'bg-[#fff4eb] text-accent' },
  COMPLETED: { label: 'Concluido', className: 'bg-[#edf6f9] text-[#24556b]' },
  CANCELLED: { label: 'Cancelado', className: 'bg-[#fdecec] text-danger' },
  NO_SHOW: { label: 'Falta', className: 'bg-[#fff4eb] text-[#9a5d00]' },
  RESCHEDULED: { label: 'Remarcado', className: 'bg-[#f4f1fe] text-[#5b3db5]' },
};

interface AppointmentStatusBadgeProps {
  status: AgendaAppointmentItem['status'];
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const config = statusMap[status];

  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', config.className)}>
      {config.label}
    </span>
  );
}
