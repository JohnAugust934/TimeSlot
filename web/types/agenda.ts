export type AgendaViewMode = 'day' | 'week';
export type AgendaSlotState = 'free' | 'occupied' | 'unavailable';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export interface AgendaProfessionalOption {
  id: string;
  fullName: string;
  specialty?: string | null;
}

export interface AgendaAppointmentItem {
  id: string;
  clientName: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  confirmationStatus?: string | null;
  notes?: string | null;
}

export interface AgendaSlot {
  key: string;
  startsAt: string;
  endsAt: string;
  timeLabel: string;
  state: AgendaSlotState;
  appointment?: AgendaAppointmentItem;
}

export interface AgendaDayColumn {
  date: string;
  label: string;
  weekdayLabel: string;
  appointmentsCount: number;
  freeSlotsCount: number;
  slots: AgendaSlot[];
}

export interface AgendaSummary {
  totalAppointments: number;
  occupiedSlots: number;
  freeSlots: number;
}

export interface AgendaResponse {
  view: AgendaViewMode;
  selectedDate: string;
  selectedProfessionalId: string | null;
  professionals: AgendaProfessionalOption[];
  range: {
    startDate: string;
    endDate: string;
    label: string;
  };
  days: AgendaDayColumn[];
  summary: AgendaSummary;
}
