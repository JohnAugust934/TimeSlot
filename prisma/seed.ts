import {
  AppointmentHistoryAction,
  AppointmentStatus,
  ConfirmationStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

function getRequiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value || value.trim().length === 0) {
    throw new Error(`Environment variable ${name} is required for seed execution.`);
  }

  return value;
}

function buildBaseDayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

function atDayTime(baseDay: Date, dayOffset: number, hour: number, minute: number): Date {
  const date = new Date(baseDay);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

async function cleanDatabase() {
  await prisma.appointmentHistory.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.agendaBlock.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.professionalService.deleteMany();
  await prisma.professionalUnit.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.client.deleteMany();
  await prisma.service.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  const adminName = getRequiredEnv('SEED_ADMIN_NAME', 'Administrador Local');
  const adminEmail = getRequiredEnv('SEED_ADMIN_EMAIL', 'admin@timeslot.local');
  const adminPassword = getRequiredEnv('SEED_ADMIN_PASSWORD', 'Admin@123456');

  const receptionPassword = getRequiredEnv('SEED_RECEPTION_PASSWORD', 'Recepcao@123456');
  const professionalPassword = getRequiredEnv('SEED_PROFESSIONAL_PASSWORD', 'Profissional@123456');

  await cleanDatabase();

  const [adminPasswordHash, receptionPasswordHash, professionalPasswordHash] = await Promise.all([
    bcrypt.hash(adminPassword, SALT_ROUNDS),
    bcrypt.hash(receptionPassword, SALT_ROUNDS),
    bcrypt.hash(professionalPassword, SALT_ROUNDS),
  ]);

  const [adminUser, receptionistUser, professionalUser1, professionalUser2] = await Promise.all([
    prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        active: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Recepcao TimeSlot',
        email: 'recepcao@timeslot.local',
        passwordHash: receptionPasswordHash,
        role: UserRole.RECEPTIONIST,
        active: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Dra. Ana Martins',
        email: 'ana@timeslot.local',
        passwordHash: professionalPasswordHash,
        role: UserRole.PROFESSIONAL,
        active: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Dr. Bruno Lima',
        email: 'bruno@timeslot.local',
        passwordHash: professionalPasswordHash,
        role: UserRole.PROFESSIONAL,
        active: true,
      },
    }),
  ]);

  const [unitMain, unitSouth] = await Promise.all([
    prisma.unit.create({
      data: {
        name: 'Unidade Centro',
        city: 'Sao Paulo',
        state: 'SP',
        address: 'Av. Paulista, 1000',
        active: true,
      },
    }),
    prisma.unit.create({
      data: {
        name: 'Unidade Sul',
        city: 'Sao Paulo',
        state: 'SP',
        address: 'Rua das Flores, 200',
        active: true,
      },
    }),
  ]);

  const [professional1, professional2, professional3] = await Promise.all([
    prisma.professional.create({
      data: {
        fullName: 'Ana Martins',
        category: 'Saude',
        specialty: 'Atendimento clinico',
        phone: '(11) 99999-1001',
        email: 'ana.profissional@timeslot.local',
        userId: professionalUser1.id,
        active: true,
      },
    }),
    prisma.professional.create({
      data: {
        fullName: 'Bruno Lima',
        category: 'Estetica',
        specialty: 'Procedimentos faciais',
        phone: '(11) 99999-1002',
        email: 'bruno.profissional@timeslot.local',
        userId: professionalUser2.id,
        active: true,
      },
    }),
    prisma.professional.create({
      data: {
        fullName: 'Carla Souza',
        category: 'Bem-estar',
        specialty: 'Massoterapia',
        phone: '(11) 99999-1003',
        email: 'carla.profissional@timeslot.local',
        active: false,
      },
    }),
  ]);

  await prisma.professionalUnit.createMany({
    data: [
      { professionalId: professional1.id, unitId: unitMain.id, active: true },
      { professionalId: professional1.id, unitId: unitSouth.id, active: true },
      { professionalId: professional2.id, unitId: unitMain.id, active: true },
      { professionalId: professional3.id, unitId: unitSouth.id, active: true },
    ],
  });

  const [service1, service2, service3, service4] = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Consulta Inicial',
        description: 'Primeiro atendimento do cliente.',
        durationMinutes: 60,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Retorno',
        description: 'Reavaliacao de evolucao.',
        durationMinutes: 30,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Sessao Tecnica',
        description: 'Sessao com plano tecnico personalizado.',
        durationMinutes: 45,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Servico Inativo de Exemplo',
        description: 'Item para validar listagem de ativos/inativos.',
        durationMinutes: 90,
        active: false,
      },
    }),
  ]);

  await prisma.professionalService.createMany({
    data: [
      { professionalId: professional1.id, serviceId: service1.id, active: true },
      { professionalId: professional1.id, serviceId: service2.id, active: true },
      { professionalId: professional1.id, serviceId: service3.id, active: true },
      { professionalId: professional2.id, serviceId: service2.id, active: true },
      { professionalId: professional2.id, serviceId: service3.id, active: true },
      { professionalId: professional3.id, serviceId: service4.id, active: true },
    ],
  });

  const baseDay = buildBaseDayUtc();

  const weekdays = [1, 2, 3, 4, 5];
  for (const weekday of weekdays) {
    await prisma.availability.createMany({
      data: [
        {
          professionalId: professional1.id,
          unitId: unitMain.id,
          weekday,
          startTime: atDayTime(baseDay, 0, 8, 0),
          endTime: atDayTime(baseDay, 0, 12, 0),
          intervalMinutes: 30,
          active: true,
        },
        {
          professionalId: professional1.id,
          unitId: unitMain.id,
          weekday,
          startTime: atDayTime(baseDay, 0, 13, 0),
          endTime: atDayTime(baseDay, 0, 18, 0),
          intervalMinutes: 30,
          active: true,
        },
        {
          professionalId: professional2.id,
          unitId: unitMain.id,
          weekday,
          startTime: atDayTime(baseDay, 0, 9, 0),
          endTime: atDayTime(baseDay, 0, 17, 0),
          intervalMinutes: 30,
          active: true,
        },
      ],
    });
  }

  const lunchStart = atDayTime(baseDay, 0, 12, 0);
  const lunchEnd = atDayTime(baseDay, 0, 13, 0);
  const vacationStart = atDayTime(baseDay, 3, 0, 0);
  const vacationEnd = atDayTime(baseDay, 4, 0, 0);

  await prisma.agendaBlock.createMany({
    data: [
      {
        professionalId: professional1.id,
        unitId: unitMain.id,
        startsAt: lunchStart,
        endsAt: lunchEnd,
        reason: 'Intervalo de almoco',
        allDay: false,
        active: true,
      },
      {
        professionalId: professional2.id,
        unitId: unitMain.id,
        startsAt: vacationStart,
        endsAt: vacationEnd,
        reason: 'Bloqueio de agenda para indisponibilidade',
        allDay: true,
        active: true,
      },
    ],
  });

  const clients = await prisma.client.createManyAndReturn({
    data: [
      {
        fullName: 'Mariana Costa',
        phone: '(11) 98888-0001',
        email: 'mariana.costa@email.com',
        document: '11111111111',
        birthDate: atDayTime(baseDay, -12000, 0, 0),
        notes: 'Prefere contato via WhatsApp.',
        active: true,
      },
      {
        fullName: 'Paulo Reis',
        phone: '(11) 98888-0002',
        email: 'paulo.reis@email.com',
        document: '22222222222',
        birthDate: atDayTime(baseDay, -14000, 0, 0),
        notes: null,
        active: true,
      },
      {
        fullName: 'Fernanda Melo',
        phone: '(11) 98888-0003',
        email: 'fernanda.melo@email.com',
        document: '33333333333',
        birthDate: atDayTime(baseDay, -13000, 0, 0),
        notes: 'Cliente recorrente.',
        active: true,
      },
      {
        fullName: 'Lucas Almeida',
        phone: '(11) 98888-0004',
        email: 'lucas.almeida@email.com',
        document: '44444444444',
        birthDate: atDayTime(baseDay, -11000, 0, 0),
        notes: null,
        active: true,
      },
      {
        fullName: 'Juliana Prado',
        phone: '(11) 98888-0005',
        email: 'juliana.prado@email.com',
        document: '55555555555',
        birthDate: atDayTime(baseDay, -10000, 0, 0),
        notes: null,
        active: true,
      },
      {
        fullName: 'Rafael Nunes',
        phone: '(11) 98888-0006',
        email: 'rafael.nunes@email.com',
        document: '66666666666',
        birthDate: atDayTime(baseDay, -9000, 0, 0),
        notes: null,
        active: true,
      },
      {
        fullName: 'Clara Dias',
        phone: '(11) 98888-0007',
        email: 'clara.dias@email.com',
        document: '77777777777',
        birthDate: atDayTime(baseDay, -8000, 0, 0),
        notes: null,
        active: true,
      },
      {
        fullName: 'Cliente Inativo',
        phone: '(11) 98888-0008',
        email: 'inativo@email.com',
        document: '88888888888',
        birthDate: atDayTime(baseDay, -7000, 0, 0),
        notes: 'Registro para teste de filtro de ativos.',
        active: false,
      },
    ],
  });

  const clientByName = new Map(clients.map((client) => [client.fullName, client]));

  const appointmentSeed = [
    {
      professionalId: professional1.id,
      clientId: clientByName.get('Mariana Costa')!.id,
      serviceId: service1.id,
      unitId: unitMain.id,
      startsAt: atDayTime(baseDay, 0, 9, 0),
      status: AppointmentStatus.CONFIRMED,
      confirmationStatus: ConfirmationStatus.CONFIRMED,
      notes: 'Primeiro atendimento.',
      internalNotes: 'Chegar 10 minutos antes.',
    },
    {
      professionalId: professional1.id,
      clientId: clientByName.get('Paulo Reis')!.id,
      serviceId: service2.id,
      unitId: unitMain.id,
      startsAt: atDayTime(baseDay, 0, 10, 30),
      status: AppointmentStatus.SCHEDULED,
      confirmationStatus: ConfirmationStatus.PENDING,
      notes: null,
      internalNotes: null,
    },
    {
      professionalId: professional1.id,
      clientId: clientByName.get('Fernanda Melo')!.id,
      serviceId: service3.id,
      unitId: unitMain.id,
      startsAt: atDayTime(baseDay, 0, 14, 0),
      status: AppointmentStatus.IN_PROGRESS,
      confirmationStatus: ConfirmationStatus.CONFIRMED,
      notes: null,
      internalNotes: null,
    },
    {
      professionalId: professional2.id,
      clientId: clientByName.get('Lucas Almeida')!.id,
      serviceId: service2.id,
      unitId: unitMain.id,
      startsAt: atDayTime(baseDay, 0, 9, 30),
      status: AppointmentStatus.SCHEDULED,
      confirmationStatus: ConfirmationStatus.PENDING,
      notes: null,
      internalNotes: null,
    },
    {
      professionalId: professional2.id,
      clientId: clientByName.get('Juliana Prado')!.id,
      serviceId: service3.id,
      unitId: unitMain.id,
      startsAt: atDayTime(baseDay, -1, 11, 0),
      status: AppointmentStatus.COMPLETED,
      confirmationStatus: ConfirmationStatus.CONFIRMED,
      notes: 'Atendimento concluido normalmente.',
      internalNotes: null,
    },
    {
      professionalId: professional1.id,
      clientId: clientByName.get('Rafael Nunes')!.id,
      serviceId: service2.id,
      unitId: unitMain.id,
      startsAt: atDayTime(baseDay, -2, 15, 0),
      status: AppointmentStatus.NO_SHOW,
      confirmationStatus: ConfirmationStatus.CONFIRMED,
      notes: null,
      internalNotes: null,
    },
    {
      professionalId: professional2.id,
      clientId: clientByName.get('Clara Dias')!.id,
      serviceId: service1.id,
      unitId: unitMain.id,
      startsAt: atDayTime(baseDay, -1, 14, 0),
      status: AppointmentStatus.CANCELLED,
      confirmationStatus: ConfirmationStatus.DECLINED,
      notes: null,
      internalNotes: null,
      cancellationReason: 'Cliente solicitou cancelamento.',
      cancelledAt: atDayTime(baseDay, -1, 9, 0),
    },
  ];

  const appointments = [] as Array<{
    id: string;
    startsAt: Date;
    endsAt: Date;
    status: AppointmentStatus;
  }>;

  for (const item of appointmentSeed) {
    const service = [service1, service2, service3].find(
      (current) => current.id === item.serviceId,
    )!;
    const endsAt = addMinutes(item.startsAt, service.durationMinutes);

    const appointment = await prisma.appointment.create({
      data: {
        professionalId: item.professionalId,
        clientId: item.clientId,
        serviceId: item.serviceId,
        unitId: item.unitId,
        startsAt: item.startsAt,
        endsAt,
        status: item.status,
        confirmationStatus: item.confirmationStatus,
        notes: item.notes,
        internalNotes: item.internalNotes,
        cancellationReason: 'cancellationReason' in item ? item.cancellationReason : null,
        cancelledAt: 'cancelledAt' in item ? item.cancelledAt : null,
        createdByUserId: receptionistUser.id,
      },
      select: { id: true, startsAt: true, endsAt: true, status: true },
    });

    appointments.push(appointment);
  }

  const oldRescheduledStartsAt = atDayTime(baseDay, 1, 10, 0);
  const oldRescheduled = await prisma.appointment.create({
    data: {
      professionalId: professional1.id,
      clientId: clientByName.get('Mariana Costa')!.id,
      serviceId: service2.id,
      unitId: unitMain.id,
      startsAt: oldRescheduledStartsAt,
      endsAt: addMinutes(oldRescheduledStartsAt, service2.durationMinutes),
      status: AppointmentStatus.RESCHEDULED,
      confirmationStatus: ConfirmationStatus.PENDING,
      notes: 'Remarcado para melhor horario.',
      createdByUserId: receptionistUser.id,
    },
    select: { id: true, startsAt: true, endsAt: true, status: true },
  });

  const newRescheduledStartsAt = atDayTime(baseDay, 2, 10, 0);
  const newRescheduled = await prisma.appointment.create({
    data: {
      professionalId: professional1.id,
      clientId: clientByName.get('Mariana Costa')!.id,
      serviceId: service2.id,
      unitId: unitMain.id,
      startsAt: newRescheduledStartsAt,
      endsAt: addMinutes(newRescheduledStartsAt, service2.durationMinutes),
      status: AppointmentStatus.SCHEDULED,
      confirmationStatus: ConfirmationStatus.PENDING,
      notes: 'Novo horario confirmado com cliente.',
      createdByUserId: receptionistUser.id,
      rescheduledFromId: oldRescheduled.id,
    },
    select: { id: true, startsAt: true, endsAt: true, status: true },
  });

  appointments.push(oldRescheduled, newRescheduled);

  await prisma.appointmentHistory.createMany({
    data: appointments.flatMap((appointment) => [
      {
        appointmentId: appointment.id,
        userId: receptionistUser.id,
        action: AppointmentHistoryAction.CREATED,
        description: 'Agendamento criado via seed de desenvolvimento.',
        metadata: {
          startsAt: appointment.startsAt.toISOString(),
          endsAt: appointment.endsAt.toISOString(),
          status: appointment.status,
        },
      },
      {
        appointmentId: appointment.id,
        userId: adminUser.id,
        action: AppointmentHistoryAction.STATUS_CHANGED,
        description: 'Historico inicial para auditoria de teste.',
        metadata: {
          currentStatus: appointment.status,
        },
      },
    ]),
  });

  await prisma.waitlist.createMany({
    data: [
      {
        clientId: clientByName.get('Clara Dias')!.id,
        professionalId: professional1.id,
        serviceId: service1.id,
        unitId: unitMain.id,
        preferredDate: atDayTime(baseDay, 5, 0, 0),
        preferredPeriod: 'MANHA',
        notes: 'Aceita encaixe antecipado.',
      },
      {
        clientId: clientByName.get('Rafael Nunes')!.id,
        professionalId: professional2.id,
        serviceId: service3.id,
        unitId: unitMain.id,
        preferredDate: atDayTime(baseDay, 6, 0, 0),
        preferredPeriod: 'TARDE',
        notes: 'Aguardando retorno da recepcao.',
      },
    ],
  });

  console.log('Seed concluido com sucesso.');
  console.log('Credenciais principais:');
  console.log(`- ADMIN: ${adminEmail} / ${adminPassword}`);
  console.log(`- RECEPTIONIST: recepcao@timeslot.local / ${receptionPassword}`);
  console.log(`- PROFESSIONAL 1: ana@timeslot.local / ${professionalPassword}`);
  console.log(`- PROFESSIONAL 2: bruno@timeslot.local / ${professionalPassword}`);
  console.log('Resumo da base:');
  console.log({
    users: 4,
    units: 2,
    professionals: 3,
    services: 4,
    clients: clients.length,
    appointments: appointments.length,
  });
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
