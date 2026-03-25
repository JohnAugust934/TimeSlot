import type { AgendaResponse, AgendaViewMode } from '@/types/agenda';

interface LoadAgendaParams {
  date: string;
  view: AgendaViewMode;
  professionalId?: string | null;
}

export async function loadAgenda(params: LoadAgendaParams): Promise<AgendaResponse> {
  const searchParams = new URLSearchParams({
    date: params.date,
    view: params.view,
  });

  if (params.professionalId) {
    searchParams.set('professionalId', params.professionalId);
  }

  const response = await fetch(`/api/agenda?${searchParams.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Nao foi possivel carregar a agenda.');
  }

  return payload?.data ?? payload;
}
