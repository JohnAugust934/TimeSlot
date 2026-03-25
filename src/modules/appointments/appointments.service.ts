import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentHistoryAction,
  AppointmentStatus,
  ConfirmationStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AppointmentHistoryService } from '../appointment-history/appointment-history.service';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

interface AvailableSlotsInput {
  professionalId: string;
  serviceId: string;
  date: string;
}

interface TimeWindow {
  startsAt: Date;
  endsAt: Date;
}

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: {
    professional: { select: { id: true; fullName: true } };
    client: { select: { id: true; fullName: true } };
    service: { select: { id: true; name: true; durationMinutes: true } };
    unit: { select: { id: true; name: true } };
    createdByUser: { select: { id: true; name: true; email: true } };
  };
}>;

type AppointmentWithHistory = Prisma.AppointmentGetPayload<{
  include: {
    professional: { select: { id: true; fullName: true } };
    client: { select: { id: true; fullName: true } };
    service: { select: { id: true; name: true; durationMinutes: true } };
    unit: { select: { id: true; name: true } };
    createdByUser: { select: { id: true; name: true; email: true } };
    history: {
      include: { user: { select: { id: true; name: true; email: true } } };
      orderBy: { createdAt: 'desc' };
    };
    rescheduledFrom: { select: { id: true; startsAt: true; endsAt: true; status: true } };
    rescheduledTo: { select: { id: true; startsAt: true; endsAt: true; status: true } };
  };
}>;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appointmentHistoryService: AppointmentHistoryService,
  ) {}

  async create(input: CreateAppointmentDto, actorUserId: string) {
    const professionalId = this.validateId(input.professionalId, 'Professional');
    const clientId = this.validateId(input.clientId, 'Client');
    const serviceId = this.validateId(input.serviceId, 'Service');
    const unitId = input.unitId?.trim() || null;
    const createdByUserId = input.createdByUserId?.trim() || actorUserId;
    const startsAt = this.parseDateTime(input.startsAt, 'startsAt');

    const appointment = await this.prisma.$transaction(async (tx) => {
      const [professional, client, service, createdByUser] = await Promise.all([
        tx.professional.findUnique({
          where: { id: professionalId },
          select: { id: true, active: true },
        }),
        tx.client.findUnique({ where: { id: clientId }, select: { id: true, active: true } }),
        tx.service.findUnique({
          where: { id: serviceId },
          select: { id: true, durationMinutes: true, active: true },
        }),
        tx.user.findUnique({ where: { id: createdByUserId }, select: { id: true, active: true } }),
      ]);

      if (!professional || !professional.active) {
        throw new NotFoundException('Professional not found or inactive.');
      }

      if (!client || !client.active) {
        throw new NotFoundException('Client not found or inactive.');
      }

      if (!service || !service.active) {
        throw new NotFoundException('Service not found or inactive.');
      }

      if (!createdByUser || !createdByUser.active) {
        throw new NotFoundException('Created by user not found or inactive.');
      }

      if (unitId) {
        await this.ensureUnitExists(tx, unitId);
      }

      const endsAt = this.addMinutes(startsAt, service.durationMinutes);

      await this.assertSchedulable(tx, { professionalId, startsAt, endsAt });

      const createdAppointment = await tx.appointment.create({
        data: {
          professionalId,
          clientId,
          serviceId,
          unitId,
          startsAt,
          endsAt,
          status: AppointmentStatus.SCHEDULED,
          confirmationStatus: ConfirmationStatus.PENDING,
          notes: input.notes?.trim() || null,
          internalNotes: input.internalNotes?.trim() || null,
          createdByUserId,
        },
        include: this.getAppointmentInclude(),
      });

      await this.appointmentHistoryService.recordCreated(tx, {
        appointmentId: createdAppointment.id,
        userId: actorUserId,
        metadata: {
          startsAt: createdAppointment.startsAt.toISOString(),
          endsAt: createdAppointment.endsAt.toISOString(),
          serviceId: createdAppointment.serviceId,
          status: createdAppointment.status,
          confirmationStatus: createdAppointment.confirmationStatus,
        },
      });

      return createdAppointment;
    });

    return this.toAppointmentResponse(appointment);
  }

  async findAll(query: ListAppointmentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      ...(query.professionalId ? { professionalId: query.professionalId.trim() } : {}),
      ...(query.clientId ? { clientId: query.clientId.trim() } : {}),
      ...(query.serviceId ? { serviceId: query.serviceId.trim() } : {}),
      ...(query.unitId ? { unitId: query.unitId.trim() } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.confirmationStatus ? { confirmationStatus: query.confirmationStatus } : {}),
      ...(query.createdByUserId ? { createdByUserId: query.createdByUserId.trim() } : {}),
      ...this.buildDateRangeFilter(query.dateFrom, query.dateTo),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        skip,
        take: limit,
        include: this.getAppointmentInclude(),
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toAppointmentResponse(item)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const appointmentId = this.validateId(id, 'Appointment');
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: this.getAppointmentDetailsInclude(),
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }

    return this.toAppointmentDetailsResponse(appointment);
  }

  async cancel(id: string, input: CancelAppointmentDto, actorUserId: string) {
    const appointmentId = this.validateId(id, 'Appointment');

    const appointment = await this.prisma.$transaction(async (tx) => {
      const current = await tx.appointment.findUnique({ where: { id: appointmentId } });

      if (!current) {
        throw new NotFoundException('Appointment not found.');
      }

      this.assertCanCancel(current.status);

      const cancelledAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancellationReason: input.reason?.trim() || null,
          cancelledAt: new Date(),
        },
        include: this.getAppointmentInclude(),
      });

      await this.appointmentHistoryService.recordCancelled(tx, {
        appointmentId,
        userId: actorUserId,
        metadata: {
          previousStatus: current.status,
          newStatus: AppointmentStatus.CANCELLED,
          reason: input.reason?.trim() || null,
        },
      });

      return cancelledAppointment;
    });

    return this.toAppointmentResponse(appointment);
  }

  async reschedule(id: string, input: RescheduleAppointmentDto, actorUserId: string) {
    const appointmentId = this.validateId(id, 'Appointment');
    const newStartsAt = this.parseDateTime(input.startsAt, 'startsAt');

    const appointment = await this.prisma.$transaction(async (tx) => {
      const current = await tx.appointment.findUnique({ where: { id: appointmentId } });

      if (!current) {
        throw new NotFoundException('Appointment not found.');
      }

      this.assertCanReschedule(current.status);

      const service = await tx.service.findUnique({
        where: { id: current.serviceId },
        select: { id: true, durationMinutes: true, active: true },
      });

      if (!service || !service.active) {
        throw new NotFoundException('Service not found or inactive.');
      }

      const newEndsAt = this.addMinutes(newStartsAt, service.durationMinutes);

      await this.assertSchedulable(tx, {
        professionalId: current.professionalId,
        startsAt: newStartsAt,
        endsAt: newEndsAt,
        ignoreAppointmentId: current.id,
      });

      const newAppointment = await tx.appointment.create({
        data: {
          professionalId: current.professionalId,
          clientId: current.clientId,
          serviceId: current.serviceId,
          unitId: current.unitId,
          createdByUserId: actorUserId,
          rescheduledFromId: current.id,
          startsAt: newStartsAt,
          endsAt: newEndsAt,
          status: AppointmentStatus.SCHEDULED,
          confirmationStatus: ConfirmationStatus.PENDING,
          notes: current.notes,
          internalNotes: current.internalNotes,
        },
        include: this.getAppointmentInclude(),
      });

      await tx.appointment.update({
        where: { id: current.id },
        data: {
          status: AppointmentStatus.RESCHEDULED,
        },
      });

      await this.appointmentHistoryService.recordRescheduled(tx, {
        appointmentId: current.id,
        userId: actorUserId,
        metadata: {
          previousStartsAt: current.startsAt.toISOString(),
          previousEndsAt: current.endsAt.toISOString(),
          newAppointmentId: newAppointment.id,
          newStartsAt: newAppointment.startsAt.toISOString(),
          newEndsAt: newAppointment.endsAt.toISOString(),
          reason: input.reason?.trim() || null,
        },
      });

      await this.appointmentHistoryService.recordCreated(tx, {
        appointmentId: newAppointment.id,
        userId: actorUserId,
        metadata: {
          rescheduledFromId: current.id,
          startsAt: newAppointment.startsAt.toISOString(),
          endsAt: newAppointment.endsAt.toISOString(),
          reason: input.reason?.trim() || null,
        },
      });

      return newAppointment;
    });

    return this.toAppointmentResponse(appointment);
  }

  async updateStatus(id: string, input: UpdateAppointmentStatusDto, actorUserId: string) {
    const appointmentId = this.validateId(id, 'Appointment');

    if (
      input.status === AppointmentStatus.CANCELLED ||
      input.status === AppointmentStatus.RESCHEDULED
    ) {
      throw new BadRequestException(
        'Use the dedicated cancel or reschedule endpoints for these status changes.',
      );
    }

    const appointment = await this.prisma.$transaction(async (tx) => {
      const current = await tx.appointment.findUnique({ where: { id: appointmentId } });

      if (!current) {
        throw new NotFoundException('Appointment not found.');
      }

      if (
        current.status === AppointmentStatus.CANCELLED ||
        current.status === AppointmentStatus.RESCHEDULED
      ) {
        throw new BadRequestException(
          'Cannot update status of a cancelled or rescheduled appointment.',
        );
      }

      const nextConfirmationStatus = input.confirmationStatus ?? current.confirmationStatus;
      const statusChanged = current.status !== input.status;
      const confirmationChanged = current.confirmationStatus !== nextConfirmationStatus;

      if (!statusChanged && !confirmationChanged) {
        throw new BadRequestException('No status change was provided.');
      }

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: input.status,
          confirmationStatus: nextConfirmationStatus,
        },
        include: this.getAppointmentInclude(),
      });

      if (statusChanged) {
        await this.appointmentHistoryService.recordStatusChanged(tx, {
          appointmentId,
          userId: actorUserId,
          metadata: {
            previousStatus: current.status,
            newStatus: input.status,
          },
        });
      }

      if (confirmationChanged) {
        if (nextConfirmationStatus === ConfirmationStatus.CONFIRMED) {
          await this.appointmentHistoryService.recordConfirmed(tx, {
            appointmentId,
            userId: actorUserId,
            metadata: {
              previousConfirmationStatus: current.confirmationStatus,
              newConfirmationStatus: nextConfirmationStatus,
            },
          });
        } else {
          await this.appointmentHistoryService.record(tx, {
            appointmentId,
            userId: actorUserId,
            action: AppointmentHistoryAction.CONFIRMATION_CHANGED,
            description: 'Appointment confirmation status updated.',
            metadata: {
              previousConfirmationStatus: current.confirmationStatus,
              newConfirmationStatus: nextConfirmationStatus,
            },
          });
        }
      }

      return updatedAppointment;
    });

    return this.toAppointmentResponse(appointment);
  }

  async getAvailableSlots(input: AvailableSlotsInput | GetAvailableSlotsDto) {
    const professionalId = this.validateId(input.professionalId, 'Professional');
    const serviceId = this.validateId(input.serviceId, 'Service');
    const dayStart = this.parseDateOnly(input.date);
    const dayEnd = this.endOfUtcDay(dayStart);
    const weekday = this.getUtcWeekday(dayStart);

    const [professional, service] = await Promise.all([
      this.prisma.professional.findUnique({
        where: { id: professionalId },
        select: { id: true, fullName: true, active: true },
      }),
      this.prisma.service.findUnique({
        where: { id: serviceId },
        select: { id: true, name: true, durationMinutes: true, active: true },
      }),
    ]);

    if (!professional || !professional.active) {
      throw new NotFoundException('Professional not found or inactive.');
    }

    if (!service || !service.active) {
      throw new NotFoundException('Service not found or inactive.');
    }

    const [availabilities, agendaBlocks, appointments] = await Promise.all([
      this.prisma.availability.findMany({
        where: {
          professionalId,
          weekday,
          active: true,
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.agendaBlock.findMany({
        where: {
          professionalId,
          active: true,
          startsAt: { lte: dayEnd },
          endsAt: { gte: dayStart },
        },
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.appointment.findMany({
        where: {
          professionalId,
          status: {
            notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED],
          },
          startsAt: { lte: dayEnd },
          endsAt: { gte: dayStart },
        },
        orderBy: { startsAt: 'asc' },
      }),
    ]);

    const busyWindows: TimeWindow[] = [
      ...agendaBlocks.map((block) => ({
        startsAt: block.startsAt,
        endsAt: block.endsAt,
      })),
      ...appointments.map((appointment) => ({
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
      })),
    ];

    const slots = availabilities.flatMap((availability) => {
      const availabilityStart = this.combineDateWithTime(dayStart, availability.startTime);
      const availabilityEnd = this.combineDateWithTime(dayStart, availability.endTime);
      const slotStepMinutes = availability.intervalMinutes ?? service.durationMinutes;

      return this.buildAvailableSlotsInWindow({
        windowStart: availabilityStart,
        windowEnd: availabilityEnd,
        durationMinutes: service.durationMinutes,
        slotStepMinutes,
        busyWindows,
      });
    });

    const uniqueSlots = [...new Set(slots)].sort();

    return {
      date: this.formatDate(dayStart),
      professionalId: professional.id,
      professionalName: professional.fullName,
      serviceId: service.id,
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
      slots: uniqueSlots,
    };
  }

  private buildAvailableSlotsInWindow(input: {
    windowStart: Date;
    windowEnd: Date;
    durationMinutes: number;
    slotStepMinutes: number;
    busyWindows: TimeWindow[];
  }) {
    const { windowStart, windowEnd, durationMinutes, slotStepMinutes, busyWindows } = input;

    if (slotStepMinutes <= 0) {
      throw new BadRequestException('slot step must be greater than zero.');
    }

    const slots: string[] = [];
    let cursor = new Date(windowStart);

    while (this.addMinutes(cursor, durationMinutes).getTime() <= windowEnd.getTime()) {
      const slotEnd = this.addMinutes(cursor, durationMinutes);
      const candidateWindow = {
        startsAt: cursor,
        endsAt: slotEnd,
      };

      const conflicts = busyWindows.some((busyWindow) =>
        this.rangesOverlap(candidateWindow, busyWindow),
      );

      if (!conflicts) {
        slots.push(this.formatTime(cursor));
      }

      cursor = this.addMinutes(cursor, slotStepMinutes);
    }

    return slots;
  }

  private async assertSchedulable(
    tx: Prisma.TransactionClient,
    input: {
      professionalId: string;
      startsAt: Date;
      endsAt: Date;
      ignoreAppointmentId?: string;
    },
  ) {
    await Promise.all([
      this.ensureNoBlockConflict(tx, input.professionalId, input.startsAt, input.endsAt),
      this.ensureNoAppointmentConflict(
        tx,
        input.professionalId,
        input.startsAt,
        input.endsAt,
        input.ignoreAppointmentId,
      ),
    ]);
  }

  private async ensureNoBlockConflict(
    tx: Prisma.TransactionClient,
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    const conflictingBlock = await tx.agendaBlock.findFirst({
      where: {
        professionalId,
        active: true,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true },
    });

    if (conflictingBlock) {
      throw new ConflictException('Appointment conflicts with an agenda block.');
    }
  }

  private async ensureNoAppointmentConflict(
    tx: Prisma.TransactionClient,
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
    ignoreAppointmentId?: string,
  ) {
    const conflictingAppointment = await tx.appointment.findFirst({
      where: {
        professionalId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED],
        },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        ...(ignoreAppointmentId ? { id: { not: ignoreAppointmentId } } : {}),
      },
      select: { id: true },
    });

    if (conflictingAppointment) {
      throw new ConflictException('Appointment conflicts with another appointment.');
    }
  }

  private async ensureUnitExists(tx: Prisma.TransactionClient, unitId: string) {
    const unit = await tx.unit.findUnique({
      where: { id: unitId },
      select: { id: true },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found.');
    }
  }

  private assertCanCancel(status: AppointmentStatus) {
    if (
      status === AppointmentStatus.CANCELLED ||
      status === AppointmentStatus.RESCHEDULED ||
      status === AppointmentStatus.COMPLETED ||
      status === AppointmentStatus.NO_SHOW
    ) {
      throw new BadRequestException('Appointment cannot be cancelled in its current status.');
    }
  }

  private assertCanReschedule(status: AppointmentStatus) {
    if (
      status === AppointmentStatus.CANCELLED ||
      status === AppointmentStatus.RESCHEDULED ||
      status === AppointmentStatus.COMPLETED ||
      status === AppointmentStatus.NO_SHOW ||
      status === AppointmentStatus.IN_PROGRESS
    ) {
      throw new BadRequestException('Appointment cannot be rescheduled in its current status.');
    }
  }

  private buildDateRangeFilter(dateFrom?: string, dateTo?: string): Prisma.AppointmentWhereInput {
    const startsAtFilter: Prisma.DateTimeFilter = {};

    if (dateFrom) {
      startsAtFilter.gte = this.parseDateTime(dateFrom, 'dateFrom');
    }

    if (dateTo) {
      startsAtFilter.lte = this.parseDateTime(dateTo, 'dateTo');
    }

    if (startsAtFilter.gte && startsAtFilter.lte && startsAtFilter.lte < startsAtFilter.gte) {
      throw new BadRequestException('dateTo must be greater than or equal to dateFrom.');
    }

    return Object.keys(startsAtFilter).length > 0 ? { startsAt: startsAtFilter } : {};
  }

  private getAppointmentInclude() {
    return {
      professional: { select: { id: true, fullName: true } },
      client: { select: { id: true, fullName: true } },
      service: { select: { id: true, name: true, durationMinutes: true } },
      unit: { select: { id: true, name: true } },
      createdByUser: { select: { id: true, name: true, email: true } },
    } satisfies Prisma.AppointmentInclude;
  }

  private getAppointmentDetailsInclude() {
    return {
      ...this.getAppointmentInclude(),
      history: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
      rescheduledFrom: { select: { id: true, startsAt: true, endsAt: true, status: true } },
      rescheduledTo: { select: { id: true, startsAt: true, endsAt: true, status: true } },
    } satisfies Prisma.AppointmentInclude;
  }

  private toAppointmentResponse(appointment: AppointmentWithRelations) {
    return {
      id: appointment.id,
      professionalId: appointment.professionalId,
      clientId: appointment.clientId,
      serviceId: appointment.serviceId,
      unitId: appointment.unitId,
      createdByUserId: appointment.createdByUserId,
      rescheduledFromId: appointment.rescheduledFromId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
      confirmationStatus: appointment.confirmationStatus,
      notes: appointment.notes,
      internalNotes: appointment.internalNotes,
      cancellationReason: appointment.cancellationReason,
      cancelledAt: appointment.cancelledAt,
      professional: appointment.professional,
      client: appointment.client,
      service: appointment.service,
      unit: appointment.unit,
      createdByUser: appointment.createdByUser,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  private toAppointmentDetailsResponse(appointment: AppointmentWithHistory) {
    return {
      ...this.toAppointmentResponse(appointment),
      rescheduledFrom: appointment.rescheduledFrom,
      rescheduledTo: appointment.rescheduledTo,
      history: appointment.history.map((item) => ({
        id: item.id,
        action: item.action,
        description: item.description,
        metadata: item.metadata,
        createdAt: item.createdAt,
        user: item.user,
      })),
    };
  }

  private combineDateWithTime(date: Date, time: Date) {
    const combined = new Date(date);
    combined.setUTCHours(time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds(), 0);

    return combined;
  }

  private rangesOverlap(a: TimeWindow, b: TimeWindow) {
    return a.startsAt.getTime() < b.endsAt.getTime() && a.endsAt.getTime() > b.startsAt.getTime();
  }

  private addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60_000);
  }

  private parseDateOnly(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      throw new BadRequestException('date must be in YYYY-MM-DD format.');
    }

    const parsedDate = new Date(`${value.trim()}T00:00:00.000Z`);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('date must be a valid calendar date.');
    }

    return parsedDate;
  }

  private parseDateTime(value: string, fieldName: string) {
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO datetime.`);
    }

    return parsedDate;
  }

  private endOfUtcDay(date: Date) {
    return new Date(`${this.formatDate(date)}T23:59:59.999Z`);
  }

  private getUtcWeekday(date: Date) {
    return date.getUTCDay();
  }

  private formatTime(date: Date) {
    return date.toISOString().slice(11, 16);
  }

  private formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private validateId(id: string, entityLabel: string) {
    try {
      if (!id.trim()) {
        throw new Error();
      }

      return id.trim();
    } catch {
      throw new BadRequestException(`${entityLabel} id must be a valid string identifier.`);
    }
  }

  getModuleInfo() {
    return {
      module: 'appointments',
      status: 'ready',
      description: 'Domain module prepared for appointment orchestration.',
    };
  }
}
