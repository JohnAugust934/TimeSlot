import { NextResponse } from 'next/server';

import { apiFetch } from '@/lib/api/client';
import type {
  AgendaAppointmentItem,
  AgendaDayColumn,
  AgendaResponse,
  AgendaSlot,
  AgendaSlotState,
  AgendaViewMode,
} from '@/types/agenda';

interface BackendProfessionalListItem {
  id: string;
  fullName: string;
  specialty?: string | null;
}

interface BackendAvailabilityItem {
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes?: number | null;
}

interface BackendAppointmentItem {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AgendaAppointmentItem['status'];
  confirmationStatus?: string | null;
  notes?: string | null;
  client?: { fullName?: string | null } | null;
  service?: { name?: string | null } | null;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedDate = normalizeDate(searchParams.get('date'));
  const view = normalizeView(searchParams.get('view'));
  const requestedProfessionalId = searchParams.get('professionalId')?.trim() || null;

  try {
    const professionalsPayload = await apiFetch<{ items: BackendProfessionalListItem[] }>(
      '/professionals?page=1&limit=100&active=true',
    );
    const professionals = professionalsPayload.items ?? [];

    const selectedProfessionalId = requestedProfessionalId ?? professionals.at(0)?.id ?? null;

    if (!selectedProfessionalId || professionals.length === 0) {
      return NextResponse.json<AgendaResponse>({
        view,
        selectedDate: requestedDate,
        selectedProfessionalId: null,
        professionals: [],
        range: {
          startDate: requestedDate,
          endDate: requestedDate,
          label: 'Nenhum profissional ativo encontrado',
        },
        days: [],
        summary: {
          totalAppointments: 0,
          occupiedSlots: 0,
          freeSlots: 0,
        },
      });
    }

    const range = buildRange(requestedDate, view);
    const [availabilitiesPayload, appointmentsPayload] = await Promise.all([
      apiFetch<{ items: BackendAvailabilityItem[] }>(
        `/availabilities?professionalId=${selectedProfessionalId}&active=true&limit=100`,
      ),
      apiFetch<{ items: BackendAppointmentItem[] }>(
        `/appointments?professionalId=${selectedProfessionalId}&dateFrom=${range.startIso}&dateTo=${range.endIso}&limit=100`,
      ),
    ]);

    const days = buildAgendaDays({
      startDate: range.startDate,
      endDate: range.endDate,
      availabilities: availabilitiesPayload.items ?? [],
      appointments: appointmentsPayload.items ?? [],
    });

    const summary = days.reduce(
      (acc, day) => {
        acc.totalAppointments += day.appointmentsCount;
        acc.freeSlots += day.freeSlotsCount;
        acc.occupiedSlots += day.slots.filter((slot) => slot.state === 'occupied').length;
        return acc;
      },
      { totalAppointments: 0, occupiedSlots: 0, freeSlots: 0 },
    );

    const response: AgendaResponse = {
      view,
      selectedDate: requestedDate,
      selectedProfessionalId,
      professionals: professionals.map((professional) => ({
        id: professional.id,
        fullName: professional.fullName,
        specialty: professional.specialty ?? null,
      })),
      range: {
        startDate: formatDate(range.startDate),
        endDate: formatDate(range.endDate),
        label: formatRangeLabel(range.startDate, range.endDate, view),
      },
      days,
      summary,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(buildFallbackAgenda(requestedDate, view, requestedProfessionalId));
  }
}

function buildAgendaDays(input: {
  startDate: Date;
  endDate: Date;
  availabilities: BackendAvailabilityItem[];
  appointments: BackendAppointmentItem[];
}) {
  const dates = enumerateDates(input.startDate, input.endDate);
  const minTime = getMinStartTime(input.availabilities) ?? '08:00';
  const maxTime = getMaxEndTime(input.availabilities) ?? '18:00';
  const slotMinutes = getSlotMinutes(input.availabilities);

  return dates.map((date) => {
    const weekday = date.getUTCDay();
    const dayAvailabilities = input.availabilities.filter(
      (availability) => availability.weekday === weekday,
    );
    const dayAppointments = input.appointments
      .filter((appointment) => isSameDate(new Date(appointment.startsAt), date))
      .map(mapAppointment);

    const slots = buildSlots({
      date,
      minTime,
      maxTime,
      slotMinutes,
      dayAvailabilities,
      appointments: dayAppointments,
    });

    return {
      date: formatDate(date),
      label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date),
      weekdayLabel: DAY_LABELS[weekday],
      appointmentsCount: dayAppointments.length,
      freeSlotsCount: slots.filter((slot) => slot.state === 'free').length,
      slots,
    } satisfies AgendaDayColumn;
  });
}

function buildSlots(input: {
  date: Date;
  minTime: string;
  maxTime: string;
  slotMinutes: number;
  dayAvailabilities: BackendAvailabilityItem[];
  appointments: AgendaAppointmentItem[];
}) {
  const startMinutes = timeToMinutes(input.minTime);
  const endMinutes = timeToMinutes(input.maxTime);
  const slots: AgendaSlot[] = [];

  for (let minutes = startMinutes; minutes < endMinutes; minutes += input.slotMinutes) {
    const slotStart = setTime(input.date, minutes);
    const slotEnd = setTime(input.date, Math.min(minutes + input.slotMinutes, endMinutes));
    const withinAvailability = input.dayAvailabilities.some((availability) => {
      const availabilityStart = setTime(input.date, timeToMinutes(availability.startTime));
      const availabilityEnd = setTime(input.date, timeToMinutes(availability.endTime));
      return slotStart >= availabilityStart && slotEnd <= availabilityEnd;
    });

    const appointment = input.appointments.find((item) => {
      const startsAt = new Date(item.startsAt);
      const endsAt = new Date(item.endsAt);
      return slotStart < endsAt && slotEnd > startsAt;
    });

    let state: AgendaSlotState = 'unavailable';
    if (appointment) {
      state = 'occupied';
    } else if (withinAvailability) {
      state = 'free';
    }

    slots.push({
      key: `${formatDate(input.date)}-${minutes}`,
      startsAt: slotStart.toISOString(),
      endsAt: slotEnd.toISOString(),
      timeLabel: formatTime(slotStart),
      state,
      appointment,
    });
  }

  return slots;
}

function buildRange(date: string, view: AgendaViewMode) {
  const baseDate = new Date(`${date}T00:00:00.000Z`);
  const startDate = view === 'week' ? startOfWeek(baseDate) : baseDate;
  const endDate = view === 'week' ? addDays(startDate, 6) : baseDate;

  return {
    startDate,
    endDate,
    startIso: `${formatDate(startDate)}T00:00:00.000Z`,
    endIso: `${formatDate(endDate)}T23:59:59.999Z`,
  };
}

function buildFallbackAgenda(
  requestedDate: string,
  view: AgendaViewMode,
  requestedProfessionalId: string | null,
): AgendaResponse {
  const range = buildRange(requestedDate, view);
  const days = buildAgendaDays({
    startDate: range.startDate,
    endDate: range.endDate,
    availabilities: [
      { weekday: 1, startTime: '08:00:00', endTime: '18:00:00', slotMinutes: 30 },
      { weekday: 2, startTime: '08:00:00', endTime: '18:00:00', slotMinutes: 30 },
      { weekday: 3, startTime: '08:00:00', endTime: '18:00:00', slotMinutes: 30 },
      { weekday: 4, startTime: '08:00:00', endTime: '18:00:00', slotMinutes: 30 },
      { weekday: 5, startTime: '08:00:00', endTime: '18:00:00', slotMinutes: 30 },
    ],
    appointments: [
      {
        id: 'demo-1',
        startsAt: `${requestedDate}T09:00:00.000Z`,
        endsAt: `${requestedDate}T10:00:00.000Z`,
        status: 'CONFIRMED',
        confirmationStatus: 'CONFIRMED',
        client: { fullName: 'Mariana Costa' },
        service: { name: 'Consulta inicial' },
      },
      {
        id: 'demo-2',
        startsAt: `${requestedDate}T14:00:00.000Z`,
        endsAt: `${requestedDate}T15:00:00.000Z`,
        status: 'SCHEDULED',
        confirmationStatus: 'PENDING',
        client: { fullName: 'Paulo Reis' },
        service: { name: 'Retorno' },
      },
    ],
  });

  return {
    view,
    selectedDate: requestedDate,
    selectedProfessionalId: requestedProfessionalId ?? 'demo-professional',
    professionals: [
      { id: 'demo-professional', fullName: 'Ana Martins', specialty: 'Atendimento geral' },
      { id: 'demo-2', fullName: 'Bruno Lima', specialty: 'Estetica' },
    ],
    range: {
      startDate: formatDate(range.startDate),
      endDate: formatDate(range.endDate),
      label: formatRangeLabel(range.startDate, range.endDate, view),
    },
    days,
    summary: {
      totalAppointments: days.reduce((acc, day) => acc + day.appointmentsCount, 0),
      occupiedSlots: days.reduce(
        (acc, day) => acc + day.slots.filter((slot) => slot.state === 'occupied').length,
        0,
      ),
      freeSlots: days.reduce((acc, day) => acc + day.freeSlotsCount, 0),
    },
  };
}

function mapAppointment(item: BackendAppointmentItem): AgendaAppointmentItem {
  return {
    id: item.id,
    clientName: item.client?.fullName ?? 'Cliente',
    serviceName: item.service?.name ?? 'Servico',
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    status: item.status,
    confirmationStatus: item.confirmationStatus ?? null,
    notes: item.notes ?? null,
  };
}

function normalizeDate(value: string | null) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return formatDate(new Date());
}

function normalizeView(value: string | null): AgendaViewMode {
  return value === 'week' ? 'week' : 'day';
}

function startOfWeek(date: Date) {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

function enumerateDates(startDate: Date, endDate: Date) {
  const dates: Date[] = [];
  for (let cursor = new Date(startDate); cursor <= endDate; cursor = addDays(cursor, 1)) {
    dates.push(new Date(cursor));
  }
  return dates;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function setTime(date: Date, minutes: number) {
  const result = new Date(date);
  result.setUTCHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return result;
}

function getMinStartTime(availabilities: BackendAvailabilityItem[]) {
  return availabilities.map((availability) => availability.startTime.slice(0, 5)).sort()[0];
}

function getMaxEndTime(availabilities: BackendAvailabilityItem[]) {
  return availabilities
    .map((availability) => availability.endTime.slice(0, 5))
    .sort()
    .at(-1);
}

function getSlotMinutes(availabilities: BackendAvailabilityItem[]) {
  const values = availabilities
    .map((availability) => availability.slotMinutes ?? 30)
    .filter((value) => value > 0)
    .sort((a, b) => a - b);

  return values[0] ?? 30;
}

function isSameDate(left: Date, right: Date) {
  return formatDate(left) === formatDate(right);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(date: Date) {
  return date.toISOString().slice(11, 16);
}

function formatRangeLabel(startDate: Date, endDate: Date, view: AgendaViewMode) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  if (view === 'day') {
    return formatter.format(startDate);
  }

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}
