import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { PreserveScrollOnSubmit } from '@/components/ui/preserve-scroll-on-submit';
import { ToastFeedback } from '@/components/ui/toast-feedback';
import { apiFetch } from '@/lib/api/client';

interface ProfessionalItem {
  id: string;
  fullName: string;
  category: string | null;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
}

interface ProfessionalsResponse {
  items: ProfessionalItem[];
  total: number;
}

interface ProfessionalsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function asString(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

function buildFeedbackPath(message: string, type: 'success' | 'error') {
  const query = new URLSearchParams({ feedback: message, feedbackType: type });
  return `/professionals?${query.toString()}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export default async function ProfessionalsPage({ searchParams }: ProfessionalsPageProps) {
  const params = (await searchParams) ?? {};
  const search = asString(params.search).trim();
  const feedback = asString(params.feedback).trim();
  const feedbackType = asString(params.feedbackType).trim();

  async function createProfessional(formData: FormData) {
    'use server';

    try {
      const fullName = String(formData.get('fullName') ?? '').trim();
      if (!fullName) {
        redirect(buildFeedbackPath('Informe o nome completo para cadastrar.', 'error'));
      }

      await apiFetch('/professionals', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          category: String(formData.get('category') ?? '').trim() || undefined,
          specialty: String(formData.get('specialty') ?? '').trim() || undefined,
          phone: String(formData.get('phone') ?? '').trim() || undefined,
          email: String(formData.get('email') ?? '').trim() || undefined,
        }),
      });

      revalidatePath('/professionals');
      redirect(buildFeedbackPath('Profissional cadastrado com sucesso.', 'success'));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(buildFeedbackPath(getErrorMessage(error, 'Falha ao cadastrar profissional.'), 'error'));
    }
  }

  async function updateProfessional(formData: FormData) {
    'use server';

    try {
      const id = String(formData.get('id') ?? '').trim();
      const fullName = String(formData.get('fullName') ?? '').trim();

      if (!id || !fullName) {
        redirect(buildFeedbackPath('Preencha os dados obrigatorios para atualizar.', 'error'));
      }

      await apiFetch(`/professionals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName,
          category: String(formData.get('category') ?? '').trim() || null,
          specialty: String(formData.get('specialty') ?? '').trim() || null,
          phone: String(formData.get('phone') ?? '').trim() || null,
          email: String(formData.get('email') ?? '').trim() || null,
          active: formData.get('active') === 'on',
        }),
      });

      revalidatePath('/professionals');
      redirect(buildFeedbackPath('Profissional atualizado com sucesso.', 'success'));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(buildFeedbackPath(getErrorMessage(error, 'Falha ao atualizar profissional.'), 'error'));
    }
  }

  const query = new URLSearchParams({
    page: '1',
    limit: '100',
    ...(search ? { search } : {}),
  });

  const data = await apiFetch<ProfessionalsResponse>(`/professionals?${query.toString()}`);

  return (
    <div className="space-y-8">
      <PreserveScrollOnSubmit />
      <PageHeader
        title="Profissionais"
        description="Cadastro da equipe com dados essenciais para agenda, atendimento e operacao."
      />

      {feedback ? (
        <ToastFeedback message={feedback} type={feedbackType === 'success' ? 'success' : 'error'} />
      ) : null}

      <SectionCard title="Novo profissional" description="Cadastro rapido para iniciar o uso do sistema.">
        <form action={createProfessional} data-preserve-scroll="true" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            name="fullName"
            placeholder="Nome completo"
            className="h-11 rounded-xl border border-line px-3 text-sm"
            required
          />
          <input
            name="category"
            placeholder="Categoria (ex: Saude, Estetica)"
            className="h-11 rounded-xl border border-line px-3 text-sm"
          />
          <input
            name="specialty"
            placeholder="Especialidade"
            className="h-11 rounded-xl border border-line px-3 text-sm"
          />
          <input
            name="phone"
            placeholder="Telefone"
            className="h-11 rounded-xl border border-line px-3 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="E-mail"
            className="h-11 rounded-xl border border-line px-3 text-sm"
          />
          <button className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-[#0f1a30]">
            Salvar profissional
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Equipe cadastrada" description={`Total de ${data.total} profissionais encontrados.`}>
        <form className="mb-4 flex flex-col gap-2 sm:flex-row" method="get">
          <input
            name="search"
            defaultValue={search}
            placeholder="Buscar por nome, email, telefone ou especialidade"
            className="h-11 flex-1 rounded-xl border border-line px-3 text-sm"
          />
          <button className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-line hover:bg-sand/70">
            Buscar
          </button>
        </form>

        <div className="space-y-3">
          {data.items.map((professional) => (
            <form
              key={professional.id}
              action={updateProfessional}
              data-preserve-scroll="true"
              className="grid gap-3 rounded-2xl border border-line bg-sand/40 p-4"
            >
              <input type="hidden" name="id" value={professional.id} />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <input
                  name="fullName"
                  defaultValue={professional.fullName}
                  className="h-10 rounded-lg border border-line px-3 text-sm"
                  required
                />
                <input
                  name="category"
                  defaultValue={professional.category ?? ''}
                  className="h-10 rounded-lg border border-line px-3 text-sm"
                />
                <input
                  name="specialty"
                  defaultValue={professional.specialty ?? ''}
                  className="h-10 rounded-lg border border-line px-3 text-sm"
                />
                <input
                  name="phone"
                  defaultValue={professional.phone ?? ''}
                  className="h-10 rounded-lg border border-line px-3 text-sm"
                />
                <input
                  name="email"
                  defaultValue={professional.email ?? ''}
                  className="h-10 rounded-lg border border-line px-3 text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-slate">
                  <input type="checkbox" name="active" defaultChecked={professional.active} />
                  Ativo
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-[#0f1a30]">
                  Atualizar
                </button>
                <span className="break-all text-xs text-slate">ID: {professional.id}</span>
              </div>
            </form>
          ))}

          {data.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-5 text-sm text-slate">
              Nenhum profissional encontrado para este filtro.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
