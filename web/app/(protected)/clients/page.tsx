import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { clients } from '@/lib/demo-data';

export default function ClientsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Clientes"
        description="Base preparada para cliente generico, com historico de relacionamento e contato centralizado."
      />
      <SectionCard
        title="Cadastros recentes"
        description="Lista inicial para recepcao e operacao comercial."
      >
        <div className="overflow-hidden rounded-2xl border border-line">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-sand/70 text-left text-slate">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3 font-semibold text-ink">{client.name}</td>
                  <td className="px-4 py-3 text-slate">{client.phone}</td>
                  <td className="px-4 py-3 text-slate">{client.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
