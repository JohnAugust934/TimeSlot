import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { PreserveScrollOnSubmit } from '@/components/ui/preserve-scroll-on-submit';
import { ToastFeedback } from '@/components/ui/toast-feedback';
import { apiFetch } from '@/lib/api/client';

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  active: boolean;
  professionalLinksCount: number;
}

interface ServicesResponse {
  items: ServiceItem[];
  total: number;
}

interface ServicesPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function asString(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

function buildFeedbackPath(message: string, type: 'success' | 'error') {
  const query = new URLSearchParams({ feedback: message, feedbackType: type });
  return `/services?${query.toString()}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = (await searchParams) ?? {};
  const search = asString(params.search).trim();
  const feedback = asString(params.feedback).trim();
  const feedbackType = asString(params.feedbackType).trim();

  async function createService(formData: FormData) {
    'use server';

    try {
      const name = String(formData.get('name') ?? '').trim();
      const durationMinutes = Number(formData.get('durationMinutes') ?? 0);

      if (!name || !Number.isFinite(durationMinutes) || durationMinutes < 1) {
        redirect(buildFeedbackPath('Informe nome e duracao valida para cadastrar.', 'error'));
      }

      await apiFetch('/services', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: String(formData.get('description') ?? '').trim() || undefined,
          durationMinutes,
          active: formData.get('active') === 'on',
        }),
      });

      revalidatePath('/services');
      redirect(buildFeedbackPath('Servico cadastrado com sucesso.', 'success'));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(buildFeedbackPath(getErrorMessage(error, 'Falha ao cadastrar servico.'), 'error'));
    }
  }

  async function updateService(formData: FormData) {
    'use server';

    try {
      const id = String(formData.get('id') ?? '').trim();
      const name = String(formData.get('name') ?? '').trim();
      const durationMinutes = Number(formData.get('durationMinutes') ?? 0);

      if (!id || !name || !Number.isFinite(durationMinutes) || durationMinutes < 1) {
        redirect(buildFeedbackPath('Preencha os dados obrigatorios para atualizar.', 'error'));
      }

      await apiFetch(`/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description: String(formData.get('description') ?? '').trim() || null,
          durationMinutes,
          active: formData.get('active') === 'on',
        }),
      });

      revalidatePath('/services');
      redirect(buildFeedbackPath('Servico atualizado com sucesso.', 'success'));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(buildFeedbackPath(getErrorMessage(error, 'Falha ao atualizar servico.'), 'error'));
    }
  }

  const query = new URLSearchParams({
    page: '1',
    limit: '100',
    ...(search ? { search } : {}),
  });

  const data = await apiFetch<ServicesResponse>(`/services?${query.toString()}`);

  return (
    <div className="space-y-8">
      <PreserveScrollOnSubmit />
      <PageHeader
        title="Servicos"
        description="Catalogo central de servicos com duracao em minutos e status operacional."
      />

      {feedback ? (
        <ToastFeedback message={feedback} type={feedbackType === 'success' ? 'success' : 'error'} />
      ) : null}

      <SectionCard title="Novo servico" description="Cadastre o servico com duracao para calculo de agenda.">
        <form action={createService} data-preserve-scroll="true" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input name="name" placeholder="Nome do servico" className="h-11 rounded-xl border border-line px-3 text-sm" required />
          <label className="text-xs text-slate">
            Duracao do servico (minutos)
            <input
              name="durationMinutes"
              type="number"
              min={1}
              max={1440}
              defaultValue={30}
              className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm"
              required
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-line px-3 text-sm">
            <input type="checkbox" name="active" defaultChecked />
            Ativo
          </label>
          <textarea
            name="description"
            placeholder="Descricao"
            className="min-h-24 rounded-xl border border-line px-3 py-2 text-sm md:col-span-2 xl:col-span-3"
          />
          <button className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-[#0f1a30]">
            Salvar servico
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Catalogo" description={`Total de ${data.total} servicos encontrados.`}>
        <form className="mb-4 flex flex-col gap-2 sm:flex-row" method="get">
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar por nome ou descricao"
            className="h-11 flex-1 rounded-xl border border-line px-3 text-sm"
          />
          <button className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-line hover:bg-sand/70">
            Buscar
          </button>
        </form>

        <div className="space-y-3">
          {data.items.map((service) => (
            <form key={service.id} action={updateService} data-preserve-scroll="true" className="grid gap-3 rounded-2xl border border-line bg-sand/40 p-4">
              <input type="hidden" name="id" value={service.id} />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <input name="name" defaultValue={service.name} className="h-10 rounded-lg border border-line px-3 text-sm" required />
                <label className="text-xs text-slate">
                  Duracao (minutos)
                  <input
                    name="durationMinutes"
                    type="number"
                    min={1}
                    max={1440}
                    defaultValue={service.durationMinutes}
                    className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-sm"
                    required
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate">
                  <input type="checkbox" name="active" defaultChecked={service.active} />
                  Ativo
                </label>
              </div>
              <textarea
                name="description"
                defaultValue={service.description ?? ''}
                placeholder="Descricao"
                className="min-h-20 rounded-lg border border-line px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate">
                <button className="h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-[#0f1a30]">
                  Atualizar
                </button>
                <span>Vinculos profissionais: {service.professionalLinksCount}</span>
                <span>ID: {service.id}</span>
              </div>
            </form>
          ))}

          {data.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-5 text-sm text-slate">
              Nenhum servico encontrado para este filtro.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
