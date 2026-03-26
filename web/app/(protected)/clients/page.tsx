import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { PreserveScrollOnSubmit } from '@/components/ui/preserve-scroll-on-submit';
import { ToastFeedback } from '@/components/ui/toast-feedback';
import { apiFetch } from '@/lib/api/client';

interface ClientItem {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  birthDate: string | null;
  notes: string | null;
  active: boolean;
}

interface ClientsResponse {
  items: ClientItem[];
  total: number;
}

interface ClientsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function asString(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

function buildFeedbackPath(message: string, type: 'success' | 'error') {
  const query = new URLSearchParams({ feedback: message, feedbackType: type });
  return `/clients?${query.toString()}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = (await searchParams) ?? {};
  const search = asString(params.search).trim();
  const feedback = asString(params.feedback).trim();
  const feedbackType = asString(params.feedbackType).trim();

  async function createClient(formData: FormData) {
    'use server';

    try {
      const fullName = String(formData.get('fullName') ?? '').trim();
      const phone = String(formData.get('phone') ?? '').trim();
      const email = String(formData.get('email') ?? '').trim();

      if (!fullName || !phone || !email) {
        redirect(buildFeedbackPath('Preencha nome, telefone e e-mail para cadastrar.', 'error'));
      }

      await apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          phone,
          email,
          document: String(formData.get('document') ?? '').trim() || undefined,
          birthDate: String(formData.get('birthDate') ?? '').trim() || undefined,
          notes: String(formData.get('notes') ?? '').trim() || undefined,
        }),
      });

      revalidatePath('/clients');
      redirect(buildFeedbackPath('Cliente cadastrado com sucesso.', 'success'));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(buildFeedbackPath(getErrorMessage(error, 'Falha ao cadastrar cliente.'), 'error'));
    }
  }

  async function updateClient(formData: FormData) {
    'use server';

    try {
      const id = String(formData.get('id') ?? '').trim();
      const fullName = String(formData.get('fullName') ?? '').trim();
      const phone = String(formData.get('phone') ?? '').trim();
      const email = String(formData.get('email') ?? '').trim();

      if (!id || !fullName || !phone || !email) {
        redirect(buildFeedbackPath('Preencha os dados obrigatorios para atualizar.', 'error'));
      }

      await apiFetch(`/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName,
          phone,
          email,
          document: String(formData.get('document') ?? '').trim() || null,
          birthDate: String(formData.get('birthDate') ?? '').trim() || null,
          notes: String(formData.get('notes') ?? '').trim() || null,
          active: formData.get('active') === 'on',
        }),
      });

      revalidatePath('/clients');
      redirect(buildFeedbackPath('Cliente atualizado com sucesso.', 'success'));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(buildFeedbackPath(getErrorMessage(error, 'Falha ao atualizar cliente.'), 'error'));
    }
  }

  const query = new URLSearchParams({
    page: '1',
    limit: '100',
    ...(search ? { search } : {}),
  });

  const data = await apiFetch<ClientsResponse>(`/clients?${query.toString()}`);

  return (
    <div className="space-y-8">
      <PreserveScrollOnSubmit />
      <PageHeader
        title="Clientes"
        description="Cadastro generico de clientes/pacientes com estrutura flexivel para varios segmentos."
      />

      {feedback ? (
        <ToastFeedback message={feedback} type={feedbackType === 'success' ? 'success' : 'error'} />
      ) : null}

      <SectionCard title="Novo cliente" description="Cadastro rapido: nome, telefone e e-mail sao suficientes para iniciar.">
        <form action={createClient} data-preserve-scroll="true" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input name="fullName" placeholder="Nome completo" className="h-11 rounded-xl border border-line px-3 text-sm" required />
          <input name="phone" placeholder="Telefone" className="h-11 rounded-xl border border-line px-3 text-sm" required />
          <input name="email" type="email" placeholder="E-mail" className="h-11 rounded-xl border border-line px-3 text-sm" required />
          <input name="document" placeholder="Documento" className="h-11 rounded-xl border border-line px-3 text-sm" />
          <input name="birthDate" type="date" className="h-11 rounded-xl border border-line px-3 text-sm" />
          <button className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-[#0f1a30]">
            Salvar cliente
          </button>
          <textarea
            name="notes"
            placeholder="Observacoes"
            className="min-h-24 rounded-xl border border-line px-3 py-2 text-sm md:col-span-2 xl:col-span-3"
          />
        </form>
      </SectionCard>

      <SectionCard title="Base de clientes" description={`Total de ${data.total} clientes encontrados.`}>
        <form className="mb-4 flex flex-col gap-2 sm:flex-row" method="get">
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar por nome, telefone ou e-mail"
            className="h-11 flex-1 rounded-xl border border-line px-3 text-sm"
          />
          <button className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-line hover:bg-sand/70">
            Buscar
          </button>
        </form>

        <div className="space-y-3">
          {data.items.map((client) => (
            <form key={client.id} action={updateClient} data-preserve-scroll="true" className="grid gap-3 rounded-2xl border border-line bg-sand/40 p-4">
              <input type="hidden" name="id" value={client.id} />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <input name="fullName" defaultValue={client.fullName} className="h-10 rounded-lg border border-line px-3 text-sm" required />
                <input name="phone" defaultValue={client.phone ?? ''} className="h-10 rounded-lg border border-line px-3 text-sm" required />
                <input name="email" type="email" defaultValue={client.email ?? ''} className="h-10 rounded-lg border border-line px-3 text-sm" required />
                <input name="document" defaultValue={client.document ?? ''} className="h-10 rounded-lg border border-line px-3 text-sm" />
                <input
                  name="birthDate"
                  type="date"
                  defaultValue={client.birthDate ? String(client.birthDate).slice(0, 10) : ''}
                  className="h-10 rounded-lg border border-line px-3 text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-slate">
                  <input type="checkbox" name="active" defaultChecked={client.active} />
                  Ativo
                </label>
              </div>
              <textarea
                name="notes"
                defaultValue={client.notes ?? ''}
                placeholder="Observacoes"
                className="min-h-20 rounded-lg border border-line px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button className="h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-[#0f1a30]">
                  Atualizar
                </button>
                <span className="break-all text-xs text-slate">ID: {client.id}</span>
              </div>
            </form>
          ))}

          {data.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-5 text-sm text-slate">
              Nenhum cliente encontrado para este filtro.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
