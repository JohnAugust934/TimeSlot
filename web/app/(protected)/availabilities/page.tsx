import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { PreserveScrollOnSubmit } from '@/components/ui/preserve-scroll-on-submit';
import { ToastFeedback } from '@/components/ui/toast-feedback';
import { apiFetch } from '@/lib/api/client';

interface ProfessionalOption {
  id: string;
  fullName: string;
}

interface AvailabilityItem {
  id: string;
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number | null;
  unitId: string | null;
  active: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
}

interface AvailabilitiesPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terca' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sabado' },
];

const SLOT_MINUTES_OPTIONS = [10, 15, 20, 30, 45, 60];

function asString(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

function buildFeedbackPath(message: string, type: 'success' | 'error', professionalId?: string) {
  const query = new URLSearchParams({ feedback: message, feedbackType: type });
  if (professionalId) {
    query.set('professionalId', professionalId);
  }
  return `/availabilities?${query.toString()}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export default async function AvailabilitiesPage({ searchParams }: AvailabilitiesPageProps) {
  const params = (await searchParams) ?? {};
  const selectedProfessionalId = asString(params.professionalId).trim();
  const feedback = asString(params.feedback).trim();
  const feedbackType = asString(params.feedbackType).trim();

  async function createAvailability(formData: FormData) {
    'use server';

    const professionalId = String(formData.get('professionalId') ?? '').trim();

    try {
      const payload = {
        professionalId,
        weekday: Number(formData.get('weekday')),
        startTime: String(formData.get('startTime') ?? '').trim(),
        endTime: String(formData.get('endTime') ?? '').trim(),
        slotMinutes: Number(formData.get('slotMinutes') ?? 0) || undefined,
      };

      if (!payload.professionalId || !payload.startTime || !payload.endTime) {
        redirect(buildFeedbackPath('Preencha os campos obrigatorios.', 'error', professionalId));
      }

      await apiFetch('/availabilities', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      revalidatePath('/availabilities');
      revalidatePath('/agenda');
      redirect(buildFeedbackPath('Disponibilidade criada com sucesso.', 'success', professionalId));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(
        buildFeedbackPath(
          getErrorMessage(error, 'Falha ao criar disponibilidade.'),
          'error',
          professionalId,
        ),
      );
    }
  }

  async function updateAvailability(formData: FormData) {
    'use server';

    const id = String(formData.get('id') ?? '').trim();
    const professionalId = String(formData.get('professionalId') ?? '').trim();

    try {
      if (!id || !professionalId) {
        redirect(buildFeedbackPath('Registro invalido para atualizacao.', 'error', professionalId));
      }

      await apiFetch(`/availabilities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          weekday: Number(formData.get('weekday')),
          startTime: String(formData.get('startTime') ?? '').trim(),
          endTime: String(formData.get('endTime') ?? '').trim(),
          slotMinutes: Number(formData.get('slotMinutes') ?? 0) || null,
          active: formData.get('active') === 'on',
        }),
      });

      revalidatePath('/availabilities');
      revalidatePath('/agenda');
      redirect(
        buildFeedbackPath('Disponibilidade atualizada com sucesso.', 'success', professionalId),
      );
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(
        buildFeedbackPath(
          getErrorMessage(error, 'Falha ao atualizar disponibilidade.'),
          'error',
          professionalId,
        ),
      );
    }
  }

  async function removeAvailability(formData: FormData) {
    'use server';

    const id = String(formData.get('id') ?? '').trim();
    const professionalId = String(formData.get('professionalId') ?? '').trim();

    try {
      if (!id) {
        redirect(buildFeedbackPath('Registro invalido para remocao.', 'error', professionalId));
      }

      await apiFetch(`/availabilities/${id}`, { method: 'DELETE' });

      revalidatePath('/availabilities');
      revalidatePath('/agenda');
      redirect(buildFeedbackPath('Disponibilidade removida com sucesso.', 'success', professionalId));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(
        buildFeedbackPath(
          getErrorMessage(error, 'Falha ao remover disponibilidade.'),
          'error',
          professionalId,
        ),
      );
    }
  }

  const professionalsResponse = await apiFetch<PaginatedResponse<ProfessionalOption>>(
    '/professionals?active=true&page=1&limit=100',
  ).catch(() => ({ items: [] }));

  const professionals = professionalsResponse.items;
  const activeProfessionalId = selectedProfessionalId || professionals.at(0)?.id || '';

  const availabilities = activeProfessionalId
    ? await apiFetch<AvailabilityItem[]>(
        `/availabilities?professionalId=${encodeURIComponent(activeProfessionalId)}`,
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
        title="Disponibilidades"
        description="Defina os horarios semanais por profissional para liberar os encaixes automaticamente."
      />

      <SectionCard title="Filtrar profissional" description="A grade abaixo acompanha o profissional selecionado.">
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
            Carregar grade
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="Nova disponibilidade"
        description="Escolha profissional, dia e horarios. O intervalo e em minutos entre cada opcao de agenda."
      >
        <form action={createAvailability} data-preserve-scroll="true" className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
            Dia da semana
            <select name="weekday" className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm" required>
              {WEEKDAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate">
            Hora inicial
            <input name="startTime" type="time" className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm" required />
          </label>

          <label className="text-xs text-slate">
            Hora final
            <input name="endTime" type="time" className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm" required />
          </label>

          <label className="text-xs text-slate">
            Intervalo entre horarios (minutos)
            <select name="slotMinutes" defaultValue="30" className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm" required>
              {SLOT_MINUTES_OPTIONS.map((minutes) => (
                <option key={`slot-${minutes}`} value={minutes}>
                  {minutes} minutos
                </option>
              ))}
            </select>
          </label>

          <button className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-[#0f1a30] xl:col-span-2">
            Salvar disponibilidade
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Grade semanal" description={`Total de ${availabilities.length} disponibilidades cadastradas.`}>
        <div className="space-y-3">
          {availabilities.map((item) => (
            <form key={item.id} action={updateAvailability} data-preserve-scroll="true" className="grid gap-3 rounded-2xl border border-line bg-sand/40 p-4">
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="professionalId" value={activeProfessionalId} />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <label className="text-xs text-slate">
                  Dia da semana
                  <select name="weekday" defaultValue={String(item.weekday)} className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-sm">
                    {WEEKDAY_OPTIONS.map((day) => (
                      <option key={`${item.id}-${day.value}`} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-slate">
                  Hora inicial
                  <input
                    name="startTime"
                    type="time"
                    defaultValue={item.startTime.slice(0, 5)}
                    className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-sm"
                    required
                  />
                </label>

                <label className="text-xs text-slate">
                  Hora final
                  <input
                    name="endTime"
                    type="time"
                    defaultValue={item.endTime.slice(0, 5)}
                    className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-sm"
                    required
                  />
                </label>

                <label className="text-xs text-slate">
                  Intervalo (minutos)
                  <select
                    name="slotMinutes"
                    defaultValue={String(item.slotMinutes ?? 30)}
                    className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-sm"
                  >
                    {SLOT_MINUTES_OPTIONS.map((minutes) => (
                      <option key={`${item.id}-slot-${minutes}`} value={minutes}>
                        {minutes} minutos
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 self-end text-sm text-slate">
                  <input type="checkbox" name="active" defaultChecked={item.active} />
                  Ativo
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-[#0f1a30]">
                  Atualizar
                </button>
                <button
                  formAction={removeAvailability}
                  className="h-10 rounded-lg bg-white px-4 text-sm font-semibold text-danger ring-1 ring-danger/40 hover:bg-danger/5"
                >
                  Remover
                </button>
                <span className="break-all text-xs text-slate">ID: {item.id}</span>
              </div>
            </form>
          ))}

          {availabilities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-5 text-sm text-slate">
              Nenhuma disponibilidade encontrada para o profissional selecionado.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
