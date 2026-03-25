import { StatCard } from '@/components/dashboard/stat-card';
import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api/client';
import { agendaItems } from '@/lib/demo-data';
import { formatPercent } from '@/lib/utils';

interface DashboardSummary {
  total: number;
  byStatus?: Record<string, number>;
}

interface OccupancyResponse {
  items: Array<{
    professionalId: string;
    professionalName: string;
    occupancyPercent: number;
    appointmentsCount: number;
  }>;
}

async function getDashboardData() {
  try {
    const [today, occupancy] = await Promise.all([
      apiFetch<DashboardSummary>('/dashboard/today-appointments'),
      apiFetch<OccupancyResponse>('/dashboard/professional-occupancy'),
    ]);

    return { today, occupancy };
  } catch {
    return {
      today: { total: 12, byStatus: { SCHEDULED: 5, CONFIRMED: 4, COMPLETED: 3 } },
      occupancy: {
        items: [
          {
            professionalId: 'prof-1',
            professionalName: 'Ana Martins',
            occupancyPercent: 76,
            appointmentsCount: 8,
          },
          {
            professionalId: 'prof-2',
            professionalName: 'Bruno Lima',
            occupancyPercent: 58,
            appointmentsCount: 5,
          },
        ],
      },
    };
  }
}

export default async function DashboardPage() {
  const { today, occupancy } = await getDashboardData();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Visao executiva da operacao com indicadores de atendimento, ocupacao e atividade recente."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Atendimentos do dia"
          value={today.total}
          helper="Baseado nos agendamentos da data atual"
          tone="accent"
        />
        <StatCard
          label="Confirmados"
          value={today.byStatus?.CONFIRMED ?? 0}
          helper="Agendamentos com confirmacao registrada"
        />
        <StatCard
          label="Concluidos"
          value={today.byStatus?.COMPLETED ?? 0}
          helper="Atendimentos encerrados hoje"
          tone="success"
        />
        <StatCard
          label="Agendados"
          value={today.byStatus?.SCHEDULED ?? 0}
          helper="Itens ainda previstos para o dia"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Proximos atendimentos"
          description="Lista enxuta para monitoramento rapido da equipe e da recepcao."
        >
          <div className="space-y-3">
            {agendaItems.map((item) => (
              <div
                key={`${item.time}-${item.client}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-sand/55 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{item.client}</p>
                  <p className="text-xs text-slate">
                    {item.professional} � {item.service}
                  </p>
                </div>
                <span className="text-sm font-semibold text-accent">{item.time}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Ocupacao por profissional"
          description="Acompanha a distribuicao da agenda e ajuda no balanceamento do time."
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
                <p className="text-xs text-slate">
                  {item.appointmentsCount} agendamentos no periodo
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
