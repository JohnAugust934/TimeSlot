import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { agendaItems } from '@/lib/demo-data';

export default function AppointmentsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Agendamentos"
        description="Lista operacional para criacao, confirmacao, remarcacao e cancelamento com historico."
      />
      <SectionCard
        title="Fila operacional"
        description="Ponto inicial para filtros por status, periodo, profissional e cliente."
      >
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-sand/70 text-left text-slate">
              <tr>
                <th className="px-4 py-3 font-medium">Horario</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Profissional</th>
                <th className="px-4 py-3 font-medium">Servico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {agendaItems.map((item) => (
                <tr key={`${item.time}-${item.client}`}>
                  <td className="px-4 py-3 font-semibold text-ink">{item.time}</td>
                  <td className="px-4 py-3 text-slate">{item.client}</td>
                  <td className="px-4 py-3 text-slate">{item.professional}</td>
                  <td className="px-4 py-3 text-slate">{item.service}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
