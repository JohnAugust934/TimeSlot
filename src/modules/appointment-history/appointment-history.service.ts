import { Injectable } from '@nestjs/common';
import { AppointmentHistoryAction, Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

type HistoryExecutor = Prisma.TransactionClient | PrismaService;

interface RecordHistoryInput {
  appointmentId: string;
  userId?: string | null;
  action: AppointmentHistoryAction;
  description: string;
  metadata?: Prisma.JsonObject;
}

@Injectable()
export class AppointmentHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async record(executor: HistoryExecutor, input: RecordHistoryInput) {
    return executor.appointmentHistory.create({
      data: {
        appointmentId: input.appointmentId,
        userId: input.userId ?? null,
        action: input.action,
        description: input.description,
        metadata: input.metadata,
      },
    });
  }

  async recordCreated(
    executor: HistoryExecutor,
    input: Omit<RecordHistoryInput, 'action' | 'description'>,
  ) {
    return this.record(executor, {
      ...input,
      action: AppointmentHistoryAction.CREATED,
      description: 'Appointment created.',
    });
  }

  async recordRescheduled(
    executor: HistoryExecutor,
    input: Omit<RecordHistoryInput, 'action' | 'description'>,
  ) {
    return this.record(executor, {
      ...input,
      action: AppointmentHistoryAction.RESCHEDULED,
      description: 'Appointment rescheduled.',
    });
  }

  async recordCancelled(
    executor: HistoryExecutor,
    input: Omit<RecordHistoryInput, 'action' | 'description'>,
  ) {
    return this.record(executor, {
      ...input,
      action: AppointmentHistoryAction.CANCELLED,
      description: 'Appointment cancelled.',
    });
  }

  async recordStatusChanged(
    executor: HistoryExecutor,
    input: Omit<RecordHistoryInput, 'action' | 'description'>,
  ) {
    return this.record(executor, {
      ...input,
      action: AppointmentHistoryAction.STATUS_CHANGED,
      description: 'Appointment status updated.',
    });
  }

  async recordConfirmed(
    executor: HistoryExecutor,
    input: Omit<RecordHistoryInput, 'action' | 'description'>,
  ) {
    return this.record(executor, {
      ...input,
      action: AppointmentHistoryAction.CONFIRMED,
      description: 'Appointment confirmed.',
    });
  }

  listByAppointment(appointmentId: string) {
    return this.prisma.appointmentHistory.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
