import { StatCard } from '@/components/dashboard/stat-card';
import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/client';
import { formatDateTime, formatPercent } from '@/lib/utils';

interface DashboardSummary {
  total: number;
  byStatus?: Record<string, number>;
}

interface UpcomingResponse {
  items: Array<{
    id: string;
    startsAt: string;
    status: string;
    client: { fullName: string | null };
    professional: { fullName: string | null };
    service: { name: string | null };
  }>;
}

interface CounterResponse {
  total: number;
}

interface OccupancyResponse {
  items: Array<{
    professionalId: string;
    professionalName: string;
    occupancyPercent: number;
    appointmentsCount: number;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Faltou',
  RESCHEDULED: 'Remarcado',
};

function translateStatus(value: string) {
  return STATUS_LABELS[value] ?? value;
}

export default async function DashboardPage() {
  const [today, upcoming, noShows, cancellations, newClients, occupancy] = await Promise.all([
    apiFetch<DashboardSummary>('/dashboard/today-appointments').catch(
      () => ({ total: 0, byStatus: {} } as DashboardSummary),
    ),
    apiFetch<UpcomingResponse>('/dashboard/upcoming-appointments?limit=8').catch(() => ({ items: [] })),
    apiFetch<CounterResponse>('/dashboard/no-shows').catch(() => ({ total: 0 })),
    apiFetch<CounterResponse>('/dashboard/cancellations').catch(() => ({ total: 0 })),
    apiFetch<CounterResponse>('/dashboard/new-clients').catch(() => ({ total: 0 })),
    apiFetch<OccupancyResponse>('/dashboard/professional-occupancy').catch(() => ({ items: [] })),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Indicadores de operacao em tempo real para recepcao, gestao e equipe profissional."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Atendimentos do dia" value={today.total} helper="Data atual" tone="accent" />
        <StatCard
          label="Confirmados"
          value={today.byStatus?.['CONFIRMED'] ?? 0}
          helper="Status confirmado"
        />
        <StatCard
          label="Concluidos"
          value={today.byStatus?.['COMPLETED'] ?? 0}
          helper="Atendidos hoje"
          tone="success"
        />
        <StatCard label="Faltas" value={noShows.total} helper="Periodo vigente" />
        <StatCard label="Cancelamentos" value={cancellations.total} helper="Periodo vigente" />
        <StatCard label="Novos clientes" value={newClients.total} helper="Periodo vigente" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Proximos atendimentos"
          description="Fila priorizada para acompanhamento da operacao."
        >
          <div className="space-y-3">
            {upcoming.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-sand/55 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{item.client.fullName ?? 'Cliente'}</p>
                  <p className="text-xs text-slate">
                    {item.professional.fullName ?? 'Profissional'} - {item.service.name ?? 'Servico'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-sm font-semibold text-accent">{formatDateTime(item.startsAt)}</span>
                  <p className="text-xs text-slate">{translateStatus(item.status)}</p>
                </div>
              </div>
            ))}
            {upcoming.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-slate">
                Sem atendimentos futuros no periodo.
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Ocupacao por profissional"
          description="Distribuicao da agenda para apoiar balanceamento da equipe."
        >
          <div className="space-y-4">
            {occupancy.items.map((item) => (
              <div key={item.professionalId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{item.professionalName}</span>
                  <span className="text-slate">{formatPercent(item.occupancyPercent)}</span>
                </div>
                <div className="h-2 rounded-full bg-sand">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${item.occupancyPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate">{item.appointmentsCount} agendamentos no periodo</p>
              </div>
            ))}
            {occupancy.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-4 text-sm text-slate">
                Sem dados de ocupacao para exibir.
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
