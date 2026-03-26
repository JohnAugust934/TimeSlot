import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

import { SectionCard } from '@/components/layout/section-card';
import { PageHeader } from '@/components/ui/page-header';
import { PreserveScrollOnSubmit } from '@/components/ui/preserve-scroll-on-submit';
import { ToastFeedback } from '@/components/ui/toast-feedback';
import { apiFetch } from '@/lib/api/client';
import { formatDateTime } from '@/lib/utils';

interface OptionItem {
  id: string;
  fullName?: string;
  name?: string;
  durationMinutes?: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

interface AppointmentItem {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  confirmationStatus: string;
  cancellationReason: string | null;
  professional: { fullName: string | null };
  client: { fullName: string | null };
  service: { name: string | null; durationMinutes: number | null };
}

interface AvailableSlotsResponse {
  date: string;
  slots: string[];
}

interface AppointmentsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const STATUS_OPTIONS = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW'] as const;
const CONFIRMATION_OPTIONS = ['PENDING', 'CONFIRMED', 'DECLINED'] as const;

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Faltou',
  RESCHEDULED: 'Remarcado',
};

const CONFIRMATION_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  DECLINED: 'Recusado',
};

function asString(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : '';
}

function localDateTimeToIso(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function translateStatus(value: string) {
  return STATUS_LABELS[value] ?? value;
}

function translateConfirmation(value: string) {
  return CONFIRMATION_LABELS[value] ?? value;
}

function buildFeedbackPath(message: string, type: 'success' | 'error') {
  const query = new URLSearchParams({ feedback: message, feedbackType: type });
  return `/appointments?${query.toString()}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const params = (await searchParams) ?? {};

  const filterStatus = asString(params.status).trim();
  const filterProfessionalId = asString(params.professionalId).trim();
  const filterDateFrom = asString(params.dateFrom).trim();
  const filterDateTo = asString(params.dateTo).trim();

  const slotsProfessionalId = asString(params.slotsProfessionalId).trim();
  const slotsServiceId = asString(params.slotsServiceId).trim();
  const slotsDate = asString(params.slotsDate).trim();

  const feedback = asString(params.feedback).trim();
  const feedbackType = asString(params.feedbackType).trim();

  async function createAppointment(formData: FormData) {
    'use server';

    try {
      const startsAtInput = String(formData.get('startsAt') ?? '').trim();
      const startsAtIso = localDateTimeToIso(startsAtInput);

      const payload = {
        professionalId: String(formData.get('professionalId') ?? '').trim(),
        clientId: String(formData.get('clientId') ?? '').trim(),
        serviceId: String(formData.get('serviceId') ?? '').trim(),
        startsAt: startsAtIso,
        notes: String(formData.get('notes') ?? '').trim() || undefined,
        internalNotes: String(formData.get('internalNotes') ?? '').trim() || undefined,
      };

      if (!payload.professionalId || !payload.clientId || !payload.serviceId || !payload.startsAt) {
        redirect(buildFeedbackPath('Preencha os dados obrigatorios do agendamento.', 'error'));
      }

      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      revalidatePath('/appointments');
      revalidatePath('/agenda');
      revalidatePath('/dashboard');
      redirect(buildFeedbackPath('Agendamento criado com sucesso.', 'success'));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(buildFeedbackPath(getErrorMessage(error, 'Falha ao criar agendamento.'), 'error'));
    }
  }

  async function cancelAppointment(formData: FormData) {
    'use server';

    try {
      const id = String(formData.get('id') ?? '').trim();
      if (!id) {
        redirect(buildFeedbackPath('Agendamento invalido para cancelamento.', 'error'));
      }

      await apiFetch(`/appointments/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({
          reason: String(formData.get('reason') ?? '').trim() || undefined,
        }),
      });

      revalidatePath('/appointments');
      revalidatePath('/agenda');
      revalidatePath('/dashboard');
      redirect(buildFeedbackPath('Agendamento cancelado com sucesso.', 'success'));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(buildFeedbackPath(getErrorMessage(error, 'Falha ao cancelar agendamento.'), 'error'));
    }
  }

  async function rescheduleAppointment(formData: FormData) {
    'use server';

    try {
      const id = String(formData.get('id') ?? '').trim();
      const startsAtInput = String(formData.get('startsAt') ?? '').trim();
      const startsAtIso = localDateTimeToIso(startsAtInput);

      if (!id || !startsAtIso) {
        redirect(buildFeedbackPath('Informe o novo horario para remarcar.', 'error'));
      }

      await apiFetch(`/appointments/${id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({
          startsAt: startsAtIso,
          reason: String(formData.get('reason') ?? '').trim() || undefined,
        }),
      });

      revalidatePath('/appointments');
      revalidatePath('/agenda');
      revalidatePath('/dashboard');
      redirect(buildFeedbackPath('Agendamento remarcado com sucesso.', 'success'));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(buildFeedbackPath(getErrorMessage(error, 'Falha ao remarcar agendamento.'), 'error'));
    }
  }

  async function updateAppointmentStatus(formData: FormData) {
    'use server';

    try {
      const id = String(formData.get('id') ?? '').trim();
      const status = String(formData.get('status') ?? '').trim();
      const confirmationStatus = String(formData.get('confirmationStatus') ?? '').trim();

      if (!id || !status) {
        redirect(buildFeedbackPath('Selecione os dados de status corretamente.', 'error'));
      }

      await apiFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          confirmationStatus: confirmationStatus || undefined,
        }),
      });

      revalidatePath('/appointments');
      revalidatePath('/agenda');
      revalidatePath('/dashboard');
      redirect(buildFeedbackPath('Status do agendamento atualizado com sucesso.', 'success'));
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      redirect(
        buildFeedbackPath(getErrorMessage(error, 'Falha ao atualizar status do agendamento.'), 'error'),
      );
    }
  }

  const [professionals, clients, services, appointments] = await Promise.all([
    apiFetch<PaginatedResponse<OptionItem>>('/professionals?active=true&page=1&limit=100').catch(
      () => ({ items: [], total: 0 }),
    ),
    apiFetch<PaginatedResponse<OptionItem>>('/clients?active=true&page=1&limit=100').catch(
      () => ({ items: [], total: 0 }),
    ),
    apiFetch<PaginatedResponse<OptionItem>>('/services?active=true&page=1&limit=100').catch(
      () => ({ items: [], total: 0 }),
    ),
    apiFetch<PaginatedResponse<AppointmentItem>>(
      `/appointments?${new URLSearchParams({
        page: '1',
        limit: '100',
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(filterProfessionalId ? { professionalId: filterProfessionalId } : {}),
        ...(filterDateFrom ? { dateFrom: `${filterDateFrom}T00:00:00.000Z` } : {}),
        ...(filterDateTo ? { dateTo: `${filterDateTo}T23:59:59.999Z` } : {}),
      }).toString()}`,
    ).catch(() => ({ items: [], total: 0 })),
  ]);

  const availableSlots =
    slotsProfessionalId && slotsServiceId && slotsDate
      ? await apiFetch<AvailableSlotsResponse>(
          `/appointments/available-slots?${new URLSearchParams({
            professionalId: slotsProfessionalId,
            serviceId: slotsServiceId,
            date: slotsDate,
          }).toString()}`,
        ).catch(() => null)
      : null;

  return (
    <div className="space-y-8">
      <PreserveScrollOnSubmit />
      <PageHeader
        title="Agendamentos"
        description="Fluxo operacional completo para criar, remarcar, cancelar e atualizar status com historico."
      />

      {feedback ? (
        <ToastFeedback message={feedback} type={feedbackType === 'success' ? 'success' : 'error'} />
      ) : null}

      <SectionCard
        title="Novo agendamento"
        description="Use os cadastros ativos para gerar agendamentos validos."
      >
        <form action={createAppointment} data-preserve-scroll="true" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <select
            name="professionalId"
            className="h-11 rounded-xl border border-line px-3 text-sm"
            required
          >
            <option value="">Selecione o profissional</option>
            {professionals.items.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.fullName}
              </option>
            ))}
          </select>

          <select name="clientId" className="h-11 rounded-xl border border-line px-3 text-sm" required>
            <option value="">Selecione o cliente</option>
            {clients.items.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName}
              </option>
            ))}
          </select>

          <select name="serviceId" className="h-11 rounded-xl border border-line px-3 text-sm" required>
            <option value="">Selecione o servico</option>
            {services.items.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>

          <input
            name="startsAt"
            type="datetime-local"
            className="h-11 rounded-xl border border-line px-3 text-sm"
            required
          />
          <input
            name="notes"
            placeholder="Observacoes"
            className="h-11 rounded-xl border border-line px-3 text-sm"
          />
          <input
            name="internalNotes"
            placeholder="Observacao interna"
            className="h-11 rounded-xl border border-line px-3 text-sm"
          />
          <button className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-[#0f1a30]">
            Criar agendamento
          </button>
        </form>

        <form method="get" className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-4">
          <select
            name="slotsProfessionalId"
            defaultValue={slotsProfessionalId}
            className="h-10 rounded-lg border border-line px-3 text-sm"
            required
          >
            <option value="">Profissional para consultar horarios</option>
            {professionals.items.map((professional) => (
              <option key={`slot-prof-${professional.id}`} value={professional.id}>
                {professional.fullName}
              </option>
            ))}
          </select>
          <select
            name="slotsServiceId"
            defaultValue={slotsServiceId}
            className="h-10 rounded-lg border border-line px-3 text-sm"
            required
          >
            <option value="">Servico para consultar horarios</option>
            {services.items.map((service) => (
              <option key={`slot-service-${service.id}`} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          <input
            name="slotsDate"
            type="date"
            defaultValue={slotsDate}
            className="h-10 rounded-lg border border-line px-3 text-sm"
            required
          />
          <button className="h-10 rounded-lg bg-white px-4 text-sm font-semibold text-ink ring-1 ring-line hover:bg-sand/70">
            Consultar horarios livres
          </button>
        </form>

        {availableSlots ? (
          <div className="mt-3 rounded-xl border border-line bg-sand/50 p-3 text-sm">
            <p className="mb-2 font-semibold text-ink">Horarios livres em {availableSlots.date}:</p>
            <div className="flex flex-wrap gap-2">
              {availableSlots.slots.map((slot) => (
                <span
                  key={slot}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink ring-1 ring-line"
                >
                  {slot}
                </span>
              ))}
              {availableSlots.slots.length === 0 ? (
                <span className="text-slate">Sem horarios livres nesta data.</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Fila operacional"
        description={`Total de ${appointments.total} agendamentos encontrados.`}
      >
        <form className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5" method="get">
          <select
            name="professionalId"
            defaultValue={filterProfessionalId}
            className="h-10 rounded-lg border border-line px-3 text-sm"
          >
            <option value="">Todos os profissionais</option>
            {professionals.items.map((professional) => (
              <option key={`filter-prof-${professional.id}`} value={professional.id}>
                {professional.fullName}
              </option>
            ))}
          </select>

          <select name="status" defaultValue={filterStatus} className="h-10 rounded-lg border border-line px-3 text-sm">
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {translateStatus(status)}
              </option>
            ))}
          </select>

          <input
            name="dateFrom"
            type="date"
            defaultValue={filterDateFrom}
            className="h-10 rounded-lg border border-line px-3 text-sm"
          />
          <input
            name="dateTo"
            type="date"
            defaultValue={filterDateTo}
            className="h-10 rounded-lg border border-line px-3 text-sm"
          />
          <button className="h-10 rounded-lg bg-white px-4 text-sm font-semibold text-ink ring-1 ring-line hover:bg-sand/70">
            Filtrar
          </button>
        </form>

        <div className="space-y-3">
          {appointments.items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-line bg-sand/40 p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {item.client.fullName ?? 'Cliente'} - {item.service.name ?? 'Servico'}
                  </p>
                  <p className="text-xs text-slate">
                    {item.professional.fullName ?? 'Profissional'} | {formatDateTime(item.startsAt)} ate{' '}
                    {formatDateTime(item.endsAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    Status: <span className="font-semibold text-ink">{translateStatus(item.status)}</span> |
                    Confirmacao:{' '}
                    <span className="font-semibold text-ink">
                      {translateConfirmation(item.confirmationStatus)}
                    </span>
                  </p>
                  {item.cancellationReason ? (
                    <p className="mt-1 text-xs text-danger">Motivo cancelamento: {item.cancellationReason}</p>
                  ) : null}
                </div>
                <div className="break-all text-xs text-slate">ID: {item.id}</div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <form action={updateAppointmentStatus} data-preserve-scroll="true" className="rounded-xl border border-line bg-white p-3">
                  <input type="hidden" name="id" value={item.id} />
                  <p className="mb-2 text-xs font-semibold text-slate">Atualizar status</p>
                  <select
                    name="status"
                    defaultValue={item.status}
                    className="mb-2 h-9 w-full rounded-lg border border-line px-2 text-xs"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={`${item.id}-status-${status}`} value={status}>
                        {translateStatus(status)}
                      </option>
                    ))}
                  </select>
                  <select
                    name="confirmationStatus"
                    defaultValue={item.confirmationStatus}
                    className="mb-2 h-9 w-full rounded-lg border border-line px-2 text-xs"
                  >
                    {CONFIRMATION_OPTIONS.map((status) => (
                      <option key={`${item.id}-confirmation-${status}`} value={status}>
                        {translateConfirmation(status)}
                      </option>
                    ))}
                  </select>
                  <button className="h-9 w-full rounded-lg bg-ink px-3 text-xs font-semibold text-white hover:bg-[#0f1a30]">
                    Salvar status
                  </button>
                </form>

                <form action={rescheduleAppointment} data-preserve-scroll="true" className="rounded-xl border border-line bg-white p-3">
                  <input type="hidden" name="id" value={item.id} />
                  <p className="mb-2 text-xs font-semibold text-slate">Remarcar</p>
                  <input
                    name="startsAt"
                    type="datetime-local"
                    className="mb-2 h-9 w-full rounded-lg border border-line px-2 text-xs"
                    required
                  />
                  <input
                    name="reason"
                    placeholder="Motivo"
                    className="mb-2 h-9 w-full rounded-lg border border-line px-2 text-xs"
                  />
                  <button className="h-9 w-full rounded-lg bg-white px-3 text-xs font-semibold text-ink ring-1 ring-line hover:bg-sand/70">
                    Remarcar
                  </button>
                </form>

                <form action={cancelAppointment} data-preserve-scroll="true" className="rounded-xl border border-line bg-white p-3">
                  <input type="hidden" name="id" value={item.id} />
                  <p className="mb-2 text-xs font-semibold text-slate">Cancelar</p>
                  <input
                    name="reason"
                    placeholder="Motivo do cancelamento"
                    className="mb-2 h-9 w-full rounded-lg border border-line px-2 text-xs"
                  />
                  <button className="h-9 w-full rounded-lg bg-danger px-3 text-xs font-semibold text-white hover:opacity-90">
                    Cancelar agendamento
                  </button>
                </form>
              </div>
            </article>
          ))}

          {appointments.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-5 text-sm text-slate">
              Nenhum agendamento encontrado para o filtro selecionado.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
