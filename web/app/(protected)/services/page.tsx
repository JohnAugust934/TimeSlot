import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { services } from '@/lib/demo-data';

export default function ServicesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Servicos"
        description="Catalogo central com duracao, ativacao e base pronta para associacao por profissional."
      />
      <SectionCard
        title="Catalogo"
        description="Cada servico ja nasce preparado para o calculo de agenda e disponibilidade."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((service) => (
            <article key={service.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-ink">{service.name}</h3>
                  <p className="mt-1 text-sm text-slate">
                    Duracao padrao de {service.duration} minutos.
                  </p>
                </div>
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-slate ring-1 ring-line">
                  {service.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
