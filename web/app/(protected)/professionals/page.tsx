import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { professionals } from '@/lib/demo-data';

export default function ProfessionalsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Profissionais"
        description="Gestao de agenda, status operacional e composicao da equipe multi-profissional."
      />
      <SectionCard
        title="Equipe cadastrada"
        description="Estrutura inicial preparada para vinculo com servicos, unidades e disponibilidade."
      >
        <div className="grid gap-3">
          {professionals.map((professional) => (
            <div
              key={professional.id}
              className="flex items-center justify-between rounded-2xl border border-line bg-sand/55 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-ink">{professional.name}</p>
                <p className="text-sm text-slate">{professional.specialty}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate ring-1 ring-line">
                {professional.status}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
