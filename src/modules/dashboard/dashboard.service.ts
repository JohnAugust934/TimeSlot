import { BadRequestException, Injectable } from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { DashboardDayFiltersDto } from './dto/dashboard-day-filters.dto';
import { DashboardPeriodFiltersDto } from './dto/dashboard-period-filters.dto';
import { UpcomingAppointmentsFiltersDto } from './dto/upcoming-appointments-filters.dto';

interface PeriodRange {
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayAppointments(filters: DashboardDayFiltersDto) {
    const { dayStart, dayEnd, label } = this.resolveDayRange(filters.date);
    const professionalId = this.normalizeOptionalId(filters.professionalId);

    const where: Prisma.AppointmentWhereInput = {
      startsAt: {
        gte: dayStart,
        lte: dayEnd,
      },
      ...(professionalId ? { professionalId } : {}),
      status: {
        not: AppointmentStatus.RESCHEDULED,
      },
    };

    const [total, grouped] = await this.prisma.$transaction([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        where,
        orderBy: {
          status: 'asc',
        },
        _count: {
          status: true,
        },
      }),
    ]);

    const byStatus = grouped.reduce<Record<string, number>>((acc, item) => {
      const count = typeof item._count === 'object' && item._count ? (item._count.status ?? 0) : 0;

      acc[item.status] = count;
      return acc;
    }, {});

    return {
      date: label,
      professionalId,
      total,
      byStatus,
    };
  }

  async getUpcomingAppointments(filters: UpcomingAppointmentsFiltersDto) {
    const now = new Date();
    const professionalId = this.normalizeOptionalId(filters.professionalId);
    const limit = filters.limit ?? 10;
    const range = this.resolveOptionalFuturePeriod(filters.dateFrom, filters.dateTo, now);

    const items = await this.prisma.appointment.findMany({
      where: {
        startsAt: {
          gte: range.startsAt,
          ...(range.endsAt ? { lte: range.endsAt } : {}),
        },
        ...(professionalId ? { professionalId } : {}),
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS,
          ],
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
      take: limit,
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        confirmationStatus: true,
        professional: { select: { id: true, fullName: true } },
        client: { select: { id: true, fullName: true, phone: true } },
        service: { select: { id: true, name: true, durationMinutes: true } },
        unit: { select: { id: true, name: true } },
      },
    });

    return {
      period: {
        dateFrom: this.toIsoOrNull(range.startsAt),
        dateTo: this.toIsoOrNull(range.endsAt),
      },
      professionalId,
      total: items.length,
      items,
    };
  }

  async getNoShows(filters: DashboardPeriodFiltersDto) {
    const professionalId = this.normalizeOptionalId(filters.professionalId);
    const period = this.resolvePeriodRange(filters.dateFrom, filters.dateTo, 'month');

    const total = await this.prisma.appointment.count({
      where: {
        startsAt: { gte: period.startsAt, lte: period.endsAt },
        ...(professionalId ? { professionalId } : {}),
        status: AppointmentStatus.NO_SHOW,
      },
    });

    return {
      period: this.serializePeriod(period),
      professionalId,
      total,
    };
  }

  async getCancellations(filters: DashboardPeriodFiltersDto) {
    const professionalId = this.normalizeOptionalId(filters.professionalId);
    const period = this.resolvePeriodRange(filters.dateFrom, filters.dateTo, 'month');

    const total = await this.prisma.appointment.count({
      where: {
        startsAt: { gte: period.startsAt, lte: period.endsAt },
        ...(professionalId ? { professionalId } : {}),
        status: AppointmentStatus.CANCELLED,
      },
    });

    return {
      period: this.serializePeriod(period),
      professionalId,
      total,
    };
  }

  async getNewClients(filters: DashboardPeriodFiltersDto) {
    const period = this.resolvePeriodRange(filters.dateFrom, filters.dateTo, 'month');

    const total = await this.prisma.client.count({
      where: {
        createdAt: {
          gte: period.startsAt,
          lte: period.endsAt,
        },
      },
    });

    return {
      period: this.serializePeriod(period),
      total,
    };
  }

  async getProfessionalOccupancy(filters: DashboardPeriodFiltersDto) {
    const professionalId = this.normalizeOptionalId(filters.professionalId);
    const period = this.resolvePeriodRange(filters.dateFrom, filters.dateTo, 'week');

    const professionals = await this.prisma.professional.findMany({
      where: {
        active: true,
        ...(professionalId ? { id: professionalId } : {}),
      },
      select: {
        id: true,
        fullName: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    if (professionals.length === 0) {
      return {
        period: this.serializePeriod(period),
        professionalId,
        items: [],
      };
    }

    const professionalIds = professionals.map((professional) => professional.id);

    const [availabilities, appointments] = await Promise.all([
      this.prisma.availability.findMany({
        where: {
          professionalId: { in: professionalIds },
          active: true,
        },
        select: {
          professionalId: true,
          weekday: true,
          startTime: true,
          endTime: true,
        },
      }),
      this.prisma.appointment.findMany({
        where: {
          professionalId: { in: professionalIds },
          startsAt: { lt: period.endsAt },
          endsAt: { gt: period.startsAt },
          status: {
            notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED],
          },
        },
        select: {
          professionalId: true,
          startsAt: true,
          endsAt: true,
        },
      }),
    ]);

    const availabilityMap = new Map<string, typeof availabilities>();
    for (const availability of availabilities) {
      const current = availabilityMap.get(availability.professionalId) ?? [];
      current.push(availability);
      availabilityMap.set(availability.professionalId, current);
    }

    const appointmentMap = new Map<string, typeof appointments>();
    for (const appointment of appointments) {
      const current = appointmentMap.get(appointment.professionalId) ?? [];
      current.push(appointment);
      appointmentMap.set(appointment.professionalId, current);
    }

    const items = professionals.map((professional) => {
      const professionalAvailabilities = availabilityMap.get(professional.id) ?? [];
      const professionalAppointments = appointmentMap.get(professional.id) ?? [];

      const availableMinutes = this.calculateAvailableMinutes(period, professionalAvailabilities);
      const occupiedMinutes = this.calculateOccupiedMinutes(period, professionalAppointments);
      const occupancyPercent =
        availableMinutes > 0 ? Number(((occupiedMinutes / availableMinutes) * 100).toFixed(2)) : 0;

      return {
        professionalId: professional.id,
        professionalName: professional.fullName,
        availableMinutes,
        occupiedMinutes,
        occupancyPercent,
        appointmentsCount: professionalAppointments.length,
      };
    });

    return {
      period: this.serializePeriod(period),
      professionalId,
      items,
    };
  }

  private calculateAvailableMinutes(
    period: PeriodRange,
    availabilities: Array<{
      weekday: number;
      startTime: Date;
      endTime: Date;
    }>,
  ) {
    let totalMinutes = 0;

    for (
      let cursor = this.startOfUtcDay(period.startsAt);
      cursor.getTime() <= period.endsAt.getTime();
      cursor = this.addDays(cursor, 1)
    ) {
      const weekday = cursor.getUTCDay();
      const dayAvailabilities = availabilities.filter(
        (availability) => availability.weekday === weekday,
      );

      for (const availability of dayAvailabilities) {
        const start = this.combineDateWithTime(cursor, availability.startTime);
        const end = this.combineDateWithTime(cursor, availability.endTime);

        totalMinutes += this.calculateOverlappedMinutes(period, { startsAt: start, endsAt: end });
      }
    }

    return totalMinutes;
  }

  private calculateOccupiedMinutes(
    period: PeriodRange,
    appointments: Array<{
      startsAt: Date;
      endsAt: Date;
    }>,
  ) {
    return appointments.reduce((total, appointment) => {
      return total + this.calculateOverlappedMinutes(period, appointment);
    }, 0);
  }

  private calculateOverlappedMinutes(
    period: PeriodRange,
    window: { startsAt: Date; endsAt: Date },
  ) {
    const overlapStart = Math.max(period.startsAt.getTime(), window.startsAt.getTime());
    const overlapEnd = Math.min(period.endsAt.getTime(), window.endsAt.getTime());

    if (overlapEnd <= overlapStart) {
      return 0;
    }

    return Math.floor((overlapEnd - overlapStart) / 60000);
  }

  private resolveDayRange(date?: string) {
    const baseDate = date ? this.parseDateOnly(date, 'date') : this.startOfUtcDay(new Date());
    const dayStart = this.startOfUtcDay(baseDate);
    const dayEnd = this.endOfUtcDay(baseDate);

    return {
      dayStart,
      dayEnd,
      label: this.formatDate(dayStart),
    };
  }

  private resolvePeriodRange(
    dateFrom: string | undefined,
    dateTo: string | undefined,
    fallback: 'month' | 'week' | 'today',
  ) {
    if (dateFrom && dateTo) {
      const startsAt = this.startOfUtcDay(this.parseDateOnly(dateFrom, 'dateFrom'));
      const endsAt = this.endOfUtcDay(this.parseDateOnly(dateTo, 'dateTo'));
      this.assertRange(startsAt, endsAt, 'dateTo must be greater than or equal to dateFrom.');
      return { startsAt, endsAt };
    }

    if (dateFrom) {
      const sameDay = this.parseDateOnly(dateFrom, 'dateFrom');
      return {
        startsAt: this.startOfUtcDay(sameDay),
        endsAt: this.endOfUtcDay(sameDay),
      };
    }

    if (dateTo) {
      const sameDay = this.parseDateOnly(dateTo, 'dateTo');
      return {
        startsAt: this.startOfUtcDay(sameDay),
        endsAt: this.endOfUtcDay(sameDay),
      };
    }

    const now = new Date();

    if (fallback === 'today') {
      return {
        startsAt: this.startOfUtcDay(now),
        endsAt: this.endOfUtcDay(now),
      };
    }

    if (fallback === 'week') {
      return {
        startsAt: this.startOfUtcDay(now),
        endsAt: this.endOfUtcDay(this.addDays(now, 6)),
      };
    }

    return {
      startsAt: this.startOfUtcMonth(now),
      endsAt: this.endOfUtcMonth(now),
    };
  }

  private resolveOptionalFuturePeriod(
    dateFrom: string | undefined,
    dateTo: string | undefined,
    now: Date,
  ) {
    const startsAt = dateFrom ? this.startOfUtcDay(this.parseDateOnly(dateFrom, 'dateFrom')) : now;
    const endsAt = dateTo ? this.endOfUtcDay(this.parseDateOnly(dateTo, 'dateTo')) : null;

    if (endsAt) {
      this.assertRange(startsAt, endsAt, 'dateTo must be greater than or equal to dateFrom.');
    }

    return {
      startsAt,
      endsAt,
    };
  }

  private serializePeriod(period: PeriodRange) {
    return {
      dateFrom: this.formatDate(period.startsAt),
      dateTo: this.formatDate(period.endsAt),
    };
  }

  private parseDateOnly(value: string, fieldName: string) {
    const normalizedValue = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
      throw new BadRequestException(`${fieldName} must be in YYYY-MM-DD format.`);
    }

    const parsedDate = new Date(`${normalizedValue}T00:00:00.000Z`);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid calendar date.`);
    }

    return parsedDate;
  }

  private normalizeOptionalId(id?: string) {
    if (!id) {
      return undefined;
    }

    const normalizedId = id.trim();

    if (!normalizedId) {
      throw new BadRequestException('professionalId must be a valid string identifier.');
    }

    return normalizedId;
  }

  private assertRange(startsAt: Date, endsAt: Date, message: string) {
    if (endsAt.getTime() < startsAt.getTime()) {
      throw new BadRequestException(message);
    }
  }

  private combineDateWithTime(date: Date, time: Date) {
    const combined = new Date(date);
    combined.setUTCHours(time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds(), 0);

    return combined;
  }

  private startOfUtcDay(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
    );
  }

  private endOfUtcDay(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
    );
  }

  private startOfUtcMonth(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  }

  private endOfUtcMonth(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private toIsoOrNull(date: Date | null) {
    return date ? date.toISOString() : null;
  }
}
