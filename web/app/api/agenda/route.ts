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

interface BackendAgendaBlockItem {
  id: string;
  startsAt: string;
  endsAt: string;
  reason?: string | null;
  allDay?: boolean;
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

interface PaginatedResponse<T> {
  items: T[];
  totalPages?: number;
}

interface MappedAgendaAppointment extends AgendaAppointmentItem {
  localDate: string;
  startMinutes: number;
  endMinutes: number;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const PAGE_LIMIT = 100;
const AGENDA_TIME_ZONE = process.env.AGENDA_TIME_ZONE ?? 'America/Sao_Paulo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedDate = normalizeDate(searchParams.get('date'));
  const view = normalizeView(searchParams.get('view'));
  const requestedProfessionalId = searchParams.get('professionalId')?.trim() || null;

  try {
    const professionals = await fetchPaginatedAllPages<BackendProfessionalListItem>(
      '/professionals?active=true',
    );
    const selectedProfessionalId = resolveProfessionalId(professionals, requestedProfessionalId);

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
        summary: { totalAppointments: 0, occupiedSlots: 0, freeSlots: 0 },
      });
    }

    const range = buildRange(requestedDate, view);
    const [availabilities, blocks, appointments] = await Promise.all([
      fetchCollection<BackendAvailabilityItem>(
        `/availabilities?professionalId=${encodeURIComponent(selectedProfessionalId)}&active=true`,
      ),
      fetchCollection<BackendAgendaBlockItem>(
        `/agenda-blocks?professionalId=${encodeURIComponent(selectedProfessionalId)}&active=true&dateFrom=${encodeURIComponent(range.queryStartIso)}&dateTo=${encodeURIComponent(range.queryEndIso)}`,
      ),
      fetchPaginatedAllPages<BackendAppointmentItem>(
        `/appointments?professionalId=${encodeURIComponent(selectedProfessionalId)}&dateFrom=${encodeURIComponent(range.queryStartIso)}&dateTo=${encodeURIComponent(range.queryEndIso)}`,
      ),
    ]);

    const days = buildAgendaDays({
      startDate: range.startDate,
      endDate: range.endDate,
      availabilities,
      blocks,
      appointments,
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

    return NextResponse.json<AgendaResponse>({
      view,
      selectedDate: requestedDate,
      selectedProfessionalId,
      professionals: professionals.map((professional) => ({
        id: professional.id,
        fullName: professional.fullName,
        specialty: professional.specialty ?? null,
      })),
      range: {
        startDate: range.startDate,
        endDate: range.endDate,
        label: formatRangeLabel(range.startDate, range.endDate, view),
      },
      days,
      summary,
    });
  } catch (error) {
    console.error('Agenda API error', {
      requestedDate,
      view,
      requestedProfessionalId,
      error,
    });

    return NextResponse.json({ message: 'Nao foi possivel carregar a agenda.' }, { status: 502 });
  }
}

async function fetchPaginatedAllPages<T>(path: string) {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const separator = path.includes('?') ? '&' : '?';
    const payload = await apiFetch<PaginatedResponse<T>>(
      `${path}${separator}page=${page}&limit=${PAGE_LIMIT}`,
    );
    const currentItems = payload.items ?? [];
    items.push(...currentItems);

    if (
      currentItems.length === 0 ||
      currentItems.length < PAGE_LIMIT ||
      (payload.totalPages !== undefined && page >= payload.totalPages)
    ) {
      break;
    }

    page += 1;
  }

  return items;
}

async function fetchCollection<T>(path: string) {
  return apiFetch<T[]>(path);
}

function buildAgendaDays(input: {
  startDate: string;
  endDate: string;
  availabilities: BackendAvailabilityItem[];
  blocks: BackendAgendaBlockItem[];
  appointments: BackendAppointmentItem[];
}) {
  const dates = enumerateDates(input.startDate, input.endDate);
  const minTime = getMinStartTime(input.availabilities) ?? '08:00';
  const maxTime = getMaxEndTime(input.availabilities) ?? '18:00';
  const slotMinutes = getSlotMinutes(input.availabilities);

  return dates.map((date) => {
    const weekday = getWeekday(date);
    const dayAvailabilities = input.availabilities.filter(
      (availability) => availability.weekday === weekday,
    );
    const dayAppointments = input.appointments
      .map(mapAppointment)
      .filter((appointment) => appointment.localDate === date);

    const slots = buildSlots({
      date,
      minTime,
      maxTime,
      slotMinutes,
      dayAvailabilities,
      blocks: input.blocks,
      appointments: dayAppointments,
    });

    return {
      date,
      label: formatDateLabel(date),
      weekdayLabel: DAY_LABELS[weekday],
      appointmentsCount: dayAppointments.length,
      freeSlotsCount: slots.filter((slot) => slot.state === 'free').length,
      slots,
    } satisfies AgendaDayColumn;
  });
}

function buildSlots(input: {
  date: string;
  minTime: string;
  maxTime: string;
  slotMinutes: number;
  dayAvailabilities: BackendAvailabilityItem[];
  blocks: BackendAgendaBlockItem[];
  appointments: MappedAgendaAppointment[];
}) {
  const startMinutes = timeToMinutes(input.minTime);
  const endMinutes = timeToMinutes(input.maxTime);
  const slots: AgendaSlot[] = [];

  for (let minutes = startMinutes; minutes < endMinutes; minutes += input.slotMinutes) {
    const slotEndMinutes = Math.min(minutes + input.slotMinutes, endMinutes);
    const withinAvailability = input.dayAvailabilities.some((availability) => {
      const availabilityStart = timeToMinutes(availability.startTime);
      const availabilityEnd = timeToMinutes(availability.endTime);
      return minutes >= availabilityStart && slotEndMinutes <= availabilityEnd;
    });

    const appointment = input.appointments.find(
      (item) => minutes < item.endMinutes && slotEndMinutes > item.startMinutes,
    );

    const blockedReason = getBlockReasonForSlot(input.date, minutes, slotEndMinutes, input.blocks);

    let state: AgendaSlotState = 'unavailable';
    let unavailableReason: string | null = null;

    if (appointment) {
      state = 'occupied';
    } else if (blockedReason) {
      state = 'unavailable';
      unavailableReason = blockedReason;
    } else if (withinAvailability) {
      state = 'free';
    } else {
      state = 'unavailable';
      unavailableReason = 'Fora da disponibilidade do profissional';
    }

    slots.push({
      key: `${input.date}-${minutes}`,
      startsAt: `${input.date}T${minutesToTime(minutes)}:00`,
      endsAt: `${input.date}T${minutesToTime(slotEndMinutes)}:00`,
      timeLabel: minutesToTime(minutes),
      state,
      appointment,
      unavailableReason,
    });
  }

  return slots;
}

function getBlockReasonForSlot(
  date: string,
  slotStartMinutes: number,
  slotEndMinutes: number,
  blocks: BackendAgendaBlockItem[],
) {
  for (const block of blocks) {
    const start = new Date(block.startsAt);
    const end = new Date(block.endsAt);

    const startDate = getLocalDateString(start);
    const endDate = getLocalDateString(end);

    if (date < startDate || date > endDate) {
      continue;
    }

    const dayStart = date === startDate ? getLocalMinutes(start) : 0;
    const dayEnd = date === endDate ? getLocalMinutes(end) : 24 * 60;

    if (slotStartMinutes < dayEnd && slotEndMinutes > dayStart) {
      return block.reason?.trim() || 'Bloqueio de agenda do profissional';
    }
  }

  return null;
}

function buildRange(date: string, view: AgendaViewMode) {
  const startDate = view === 'week' ? startOfWeek(date) : date;
  const endDate = view === 'week' ? addDays(startDate, 6) : date;

  return {
    startDate,
    endDate,
    queryStartIso: `${addDays(startDate, -1)}T00:00:00.000Z`,
    queryEndIso: `${addDays(endDate, 1)}T23:59:59.999Z`,
  };
}

function mapAppointment(item: BackendAppointmentItem): MappedAgendaAppointment {
  const startsAt = new Date(item.startsAt);
  const endsAt = new Date(item.endsAt);

  return {
    id: item.id,
    clientName: item.client?.fullName ?? 'Cliente',
    serviceName: item.service?.name ?? 'Servico',
    startsAt: `${getLocalDateString(startsAt)}T${minutesToTime(getLocalMinutes(startsAt))}:00`,
    endsAt: `${getLocalDateString(endsAt)}T${minutesToTime(getLocalMinutes(endsAt))}:00`,
    status: item.status,
    confirmationStatus: item.confirmationStatus ?? null,
    notes: item.notes ?? null,
    localDate: getLocalDateString(startsAt),
    startMinutes: getLocalMinutes(startsAt),
    endMinutes: getLocalMinutes(endsAt),
  };
}

function resolveProfessionalId(
  professionals: BackendProfessionalListItem[],
  requestedProfessionalId: string | null,
) {
  if (
    requestedProfessionalId &&
    professionals.some((professional) => professional.id === requestedProfessionalId)
  ) {
    return requestedProfessionalId;
  }

  return professionals.at(0)?.id ?? null;
}

function normalizeDate(value: string | null) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return getLocalDateString(new Date());
}

function normalizeView(value: string | null): AgendaViewMode {
  return value === 'week' ? 'week' : 'day';
}

function startOfWeek(date: string) {
  const weekday = getWeekday(date);
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addDays(date, diff);
}

function addDays(date: string, amount: number) {
  const baseDate = new Date(`${date}T12:00:00.000Z`);
  baseDate.setUTCDate(baseDate.getUTCDate() + amount);
  return baseDate.toISOString().slice(0, 10);
}

function enumerateDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  for (let cursor = startDate; cursor <= endDate; cursor = addDays(cursor, 1)) {
    dates.push(cursor);
  }
  return dates;
}

function getWeekday(date: string) {
  return new Date(`${date}T12:00:00.000Z`).getUTCDay();
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
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

function getLocalDateString(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: AGENDA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getLocalMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: AGENDA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: AGENDA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function formatRangeLabel(startDate: string, endDate: string, view: AgendaViewMode) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: AGENDA_TIME_ZONE,
    day: '2-digit',
    month: 'short',
  });

  if (view === 'day') {
    return formatter.format(new Date(`${startDate}T12:00:00.000Z`));
  }

  return `${formatter.format(new Date(`${startDate}T12:00:00.000Z`))} - ${formatter.format(new Date(`${endDate}T12:00:00.000Z`))}`;
}
