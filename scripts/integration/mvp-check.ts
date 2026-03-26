import { strict as assert } from 'node:assert';

const BASE_URL = process.env.INTEGRATION_BASE_URL ?? 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@timeslot.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: {
    message?: string;
  };
}

async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

function isoAt(date: string, time: string) {
  return `${date}T${time}:00.000Z`;
}

async function findDateWithSlot(
  token: string,
  professionalId: string,
  serviceId: string,
  maxDaysAhead = 14,
) {
  const base = new Date();

  for (let i = 0; i <= maxDaysAhead; i += 1) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    const date = d.toISOString().slice(0, 10);

    const slotsResp = await apiRequest<{ date: string; slots: string[] }>(
      `/appointments/available-slots?professionalId=${encodeURIComponent(professionalId)}&serviceId=${encodeURIComponent(serviceId)}&date=${date}`,
      { method: 'GET' },
      token,
    );

    if (slotsResp.ok && (slotsResp.payload?.data?.slots?.length ?? 0) > 0) {
      return {
        date,
        slot: slotsResp.payload!.data.slots[0],
      };
    }
  }

  return null;
}

async function main() {
  console.log('Running MVP integration check...');

  const login = await apiRequest<{ accessToken: string; user: { id: string } }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    },
  );

  assert.equal(login.ok, true, `Login failed with status ${login.status}`);
  const token = login.payload?.data?.accessToken;
  assert.ok(token, 'Access token not returned on login');

  const professionalsResp = await apiRequest<{ items: Array<{ id: string }> }>(
    '/professionals?active=true&page=1&limit=20',
    { method: 'GET' },
    token,
  );
  assert.equal(professionalsResp.ok, true, 'Professionals list failed');

  const clientsResp = await apiRequest<{ items: Array<{ id: string }> }>(
    '/clients?active=true&page=1&limit=20',
    { method: 'GET' },
    token,
  );
  assert.equal(clientsResp.ok, true, 'Clients list failed');

  const servicesResp = await apiRequest<{ items: Array<{ id: string; durationMinutes: number }> }>(
    '/services?active=true&page=1&limit=20',
    { method: 'GET' },
    token,
  );
  assert.equal(servicesResp.ok, true, 'Services list failed');

  const professionalId = professionalsResp.payload?.data?.items?.[0]?.id;
  const clientId = clientsResp.payload?.data?.items?.[0]?.id;
  const serviceId = servicesResp.payload?.data?.items?.[0]?.id;

  assert.ok(professionalId, 'No active professional available');
  assert.ok(clientId, 'No active client available');
  assert.ok(serviceId, 'No active service available');

  const dateWithSlot = await findDateWithSlot(token!, professionalId!, serviceId!);
  assert.ok(dateWithSlot, 'No available slot found for integration checks');

  const startsAt = isoAt(dateWithSlot!.date, dateWithSlot!.slot);

  const createAppointment = await apiRequest<{ id: string }>(
    '/appointments',
    {
      method: 'POST',
      body: JSON.stringify({
        professionalId,
        clientId,
        serviceId,
        startsAt,
        notes: 'MVP integration check',
      }),
    },
    token,
  );

  assert.equal(createAppointment.ok, true, 'Appointment creation failed');
  const createdAppointmentId = createAppointment.payload?.data?.id;
  assert.ok(createdAppointmentId, 'Created appointment id not returned');

  const conflictAppointment = await apiRequest<unknown>(
    '/appointments',
    {
      method: 'POST',
      body: JSON.stringify({
        professionalId,
        clientId,
        serviceId,
        startsAt,
        notes: 'MVP integration conflict check',
      }),
    },
    token,
  );

  assert.equal(conflictAppointment.ok, false, 'Conflict appointment should fail');
  assert.equal(conflictAppointment.status, 409, 'Conflict appointment should return HTTP 409');

  const rescheduleDate = new Date(`${dateWithSlot!.date}T00:00:00.000Z`);
  rescheduleDate.setUTCDate(rescheduleDate.getUTCDate() + 1);
  const rescheduleStartsAt = `${rescheduleDate.toISOString().slice(0, 10)}T10:00:00.000Z`;

  const reschedule = await apiRequest<{ id: string }>(
    `/appointments/${createdAppointmentId}/reschedule`,
    {
      method: 'PATCH',
      body: JSON.stringify({ startsAt: rescheduleStartsAt, reason: 'MVP integration reschedule' }),
    },
    token,
  );

  assert.equal(reschedule.ok, true, 'Reschedule failed');
  const rescheduledAppointmentId = reschedule.payload?.data?.id;
  assert.ok(rescheduledAppointmentId, 'Rescheduled appointment id not returned');

  const cancel = await apiRequest<unknown>(
    `/appointments/${rescheduledAppointmentId}/cancel`,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'MVP integration cancel' }),
    },
    token,
  );

  assert.equal(cancel.ok, true, 'Cancel appointment failed');

  console.log('MVP integration check finished successfully.');
  console.log({
    professionalId,
    clientId,
    serviceId,
    createdAppointmentId,
    rescheduledAppointmentId,
  });
}

main().catch((error) => {
  console.error('MVP integration check failed:', error);
  process.exit(1);
});
