import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { PreserveScrollOnSubmit } from '@/components/ui/preserve-scroll-on-submit';
import { ToastFeedback } from '@/components/ui/toast-feedback';
import { apiFetch } from '@/lib/api/client';
import { formatDateTime } from '@/lib/utils';

interface ProfessionalOption {
  id: string;
  fullName: string;
}

interface AgendaBlockItem {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  allDay: boolean;
  active: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
}

interface AgendaBlocksPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const BLOCK_REASON_CATEGORIES = [
  { value: 'LUNCH_BREAK', label: 'Almoco' },
  { value: 'VACATION', label: 'Ferias' },
  { value: 'HOLIDAY', label: 'Feriado' },
  { value: 'MEETING', label: 'Reuniao' },
  { value: 'TRAINING', label: 'Treinamento' },
  { value: 'PERSONAL', label: 'Compromisso pessoal' },
  { value: 'UNAVAILABLE', label: 'Indisponibilidade' },
  { value: 'OTHER', label: 'Outros' },
] as const;

function asString(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

function buildFeedbackPath(message: string, type: 'success' | 'error', professionalId?: string) {
  const query = new URLSearchParams({ feedback: message, feedbackType: type });
  if (professionalId) {
    query.set('professionalId', professionalId);
  }
  return `/agenda-blocks?${query.toString()}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function toIsoFromDateTime(dateValue: string, timeValue: string) {
  const parsed = new Date(`${dateValue}T${timeValue}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function toAllDayIso(dateValue: string, endOfDay: boolean) {
  const time = endOfDay ? '23:59:59' : '00:00:00';
  const parsed = new Date(`${dateValue}T${time}`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function mapCategoryToReason(value: string) {
  return BLOCK_REASON_CATEGORIES.find((item) => item.value === value)?.label ?? 'Outros';
}

export default async function AgendaBlocksPage({ searchParams }: AgendaBlocksPageProps) {
  const params = (await searchParams) ?? {};
  const selectedProfessionalId = asString(params.professionalId).trim();
  const feedback = asString(params.feedback).trim();
  const feedbackType = asString(params.feedbackType).trim();

  async function createBlock(formData: FormData) {
    'use server';

    const professionalId = String(formData.get('professionalId') ?? '').trim();

    try {
      const startDate = String(formData.get('startDate') ?? '').trim();
      const endDate = String(formData.get('endDate') ?? '').trim();
      const startTime = String(formData.get('startTime') ?? '').trim();
      const endTime = String(formData.get('endTime') ?? '').trim();
      const allDay = formData.get('allDay') === 'on';
      const reasonCategory = String(formData.get('reasonCategory') ?? 'OTHER').trim();

      if (!professionalId || !startDate || !endDate) {
        redirect(buildFeedbackPath('Preencha os campos obrigatorios do bloqueio.', 'error', professionalId));
      }

      const startsAt = allDay
        ? toAllDayIso(startDate, false)
        : toIsoFromDateTime(startDate, startTime);
      const endsAt = allDay ? toAllDayIso(endDate, true) : toIsoFromDateTime(endDate, endTime);

      if (!startsAt || !endsAt) {
        redirect(
          buildFeedbackPath('Informe uma data e horario validos para o bloqueio.', 'error', professionalId),
        );
      }

      if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
        redirect(buildFeedbackPath('A data/hora final deve ser maior que a inicial.', 'error', professionalId));
      }

      await apiFetch('/agenda-blocks', {
        method: 'POST',
        body: JSON.stringify({
          professionalId,
          startsAt,
          endsAt,
          reason: mapCategoryToReason(reasonCategory),
          allDay,
        }),
      });

      revalidatePath('/agenda-blocks');
      revalidatePath('/agenda');
      redirect(buildFeedbackPath('Bloqueio criado com sucesso.', 'success', professionalId));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(
        buildFeedbackPath(getErrorMessage(error, 'Falha ao criar bloqueio.'), 'error', professionalId),
      );
    }
  }

  async function removeBlock(formData: FormData) {
    'use server';

    const id = String(formData.get('id') ?? '').trim();
    const professionalId = String(formData.get('professionalId') ?? '').trim();

    try {
      if (!id) {
        redirect(buildFeedbackPath('Bloqueio invalido para remocao.', 'error', professionalId));
      }

      await apiFetch(`/agenda-blocks/${id}`, { method: 'DELETE' });

      revalidatePath('/agenda-blocks');
      revalidatePath('/agenda');
      redirect(buildFeedbackPath('Bloqueio removido com sucesso.', 'success', professionalId));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(
        buildFeedbackPath(getErrorMessage(error, 'Falha ao remover bloqueio.'), 'error', professionalId),
      );
    }
  }

  const professionalsResponse = await apiFetch<PaginatedResponse<ProfessionalOption>>(
    '/professionals?active=true&page=1&limit=100',
  ).catch(() => ({ items: [] }));

  const professionals = professionalsResponse.items;
  const activeProfessionalId = selectedProfessionalId || professionals.at(0)?.id || '';

  const blocks = activeProfessionalId
    ? await apiFetch<AgendaBlockItem[]>(
        `/agenda-blocks?professionalId=${encodeURIComponent(activeProfessionalId)}&active=true`,
      ).catch(() => [])
    : [];

  return (
    <div className="space-y-8">
      <PreserveScrollOnSubmit />
      {feedback ? (
        <ToastFeedback
          message={feedback}
          type={feedbackType === 'success' ? 'success' : 'error'}
        />
      ) : null}

      <PageHeader
        title="Bloqueios de agenda"
        description="Cadastre indisponibilidades por categoria para refletir corretamente na agenda diaria."
      />

      <SectionCard title="Filtrar profissional" description="Visualize e remova bloqueios por profissional.">
        <form method="get" className="flex flex-col gap-3 sm:flex-row">
          <select
            name="professionalId"
            defaultValue={activeProfessionalId}
            className="h-11 flex-1 rounded-xl border border-line px-3 text-sm"
          >
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.fullName}
              </option>
            ))}
          </select>
          <button className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-line hover:bg-sand/70">
            Carregar bloqueios
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="Novo bloqueio"
        description="Escolha categoria e periodo. Marque dia inteiro para bloquear o dia todo sem horario manual."
      >
        <form action={createBlock} data-preserve-scroll="true" className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="text-xs text-slate">
            Profissional
            <select
              name="professionalId"
              defaultValue={activeProfessionalId}
              className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm"
              required
            >
              {professionals.map((professional) => (
                <option key={`create-${professional.id}`} value={professional.id}>
                  {professional.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate">
            Categoria do bloqueio
            <select
              name="reasonCategory"
              defaultValue="LUNCH_BREAK"
              className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm"
            >
              {BLOCK_REASON_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate">
            Data inicial
            <input
              name="startDate"
              type="date"
              className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm"
              required
            />
          </label>

          <label className="text-xs text-slate">
            Hora inicial (parcial)
            <input
              name="startTime"
              type="time"
              defaultValue="08:00"
              className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm"
            />
          </label>

          <label className="text-xs text-slate">
            Data final
            <input
              name="endDate"
              type="date"
              className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm"
              required
            />
          </label>

          <label className="text-xs text-slate">
            Hora final (parcial)
            <input
              name="endTime"
              type="time"
              defaultValue="18:00"
              className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm"
            />
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-line px-3 text-sm text-slate xl:col-span-2">
            <input type="checkbox" name="allDay" />
            Dia inteiro (ignora horas e bloqueia a data completa)
          </label>

          <button className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-[#0f1a30] xl:col-span-2">
            Salvar bloqueio
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Bloqueios ativos" description={`Total de ${blocks.length} bloqueios ativos.`}>
        <div className="space-y-3">
          {blocks.map((block) => (
            <form key={block.id} action={removeBlock} data-preserve-scroll="true" className="rounded-2xl border border-line bg-sand/40 p-4">
              <input type="hidden" name="id" value={block.id} />
              <input type="hidden" name="professionalId" value={activeProfessionalId} />
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <p className="text-sm text-slate">
                  <span className="font-semibold text-ink">Inicio:</span> {formatDateTime(block.startsAt)}
                </p>
                <p className="text-sm text-slate">
                  <span className="font-semibold text-ink">Fim:</span> {formatDateTime(block.endsAt)}
                </p>
                <p className="text-sm text-slate">
                  <span className="font-semibold text-ink">Tipo:</span> {block.allDay ? 'Dia inteiro' : 'Parcial'}
                </p>
                <p className="text-sm text-slate">
                  <span className="font-semibold text-ink">Categoria:</span>{' '}
                  {block.reason?.trim() || 'Outros'}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button className="h-10 rounded-lg bg-white px-4 text-sm font-semibold text-danger ring-1 ring-danger/40 hover:bg-danger/5">
                  Remover bloqueio
                </button>
                <span className="break-all text-xs text-slate">ID: {block.id}</span>
              </div>
            </form>
          ))}

          {blocks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-5 text-sm text-slate">
              Nenhum bloqueio ativo para o profissional selecionado.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
