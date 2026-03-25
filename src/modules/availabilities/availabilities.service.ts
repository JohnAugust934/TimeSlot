import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { ListAvailabilitiesDto } from './dto/list-availabilities.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const TIME_BASE_DATE = '1970-01-01';

@Injectable()
export class AvailabilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAvailabilityDto) {
    await this.ensureProfessionalExists(input.professionalId);

    if (input.unitId) {
      await this.ensureUnitExists(input.unitId);
    }

    const startTime = this.parseTime(input.startTime, 'startTime');
    const endTime = this.parseTime(input.endTime, 'endTime');

    this.ensureValidTimeRange(startTime, endTime);

    await this.ensureNoConflict({
      professionalId: input.professionalId,
      weekday: input.weekday,
      startTime,
      endTime,
    });

    const availability = await this.prisma.availability.create({
      data: {
        professionalId: input.professionalId.trim(),
        weekday: input.weekday,
        startTime,
        endTime,
        unitId: input.unitId?.trim() || null,
        intervalMinutes: input.slotMinutes ?? null,
        active: true,
      },
      include: {
        professional: {
          select: {
            id: true,
            fullName: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.toResponse(availability);
  }

  async findAll(query: ListAvailabilitiesDto) {
    await this.ensureProfessionalExists(query.professionalId);

    const where: Prisma.AvailabilityWhereInput = {
      professionalId: query.professionalId.trim(),
      ...(query.weekday !== undefined ? { weekday: query.weekday } : {}),
      ...(query.unitId ? { unitId: query.unitId.trim() } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
    };

    const items = await this.prisma.availability.findMany({
      where,
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
      include: {
        professional: {
          select: {
            id: true,
            fullName: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return items.map((item) => this.toResponse(item));
  }

  async update(id: string, input: UpdateAvailabilityDto) {
    const availabilityId = this.validateId(id, 'Availability');
    const current = await this.findAvailabilityOrThrow(availabilityId);

    const professionalId = current.professionalId;
    const weekday = input.weekday ?? current.weekday;
    const unitId = input.unitId !== undefined ? input.unitId.trim() || null : current.unitId;
    const startTime = input.startTime
      ? this.parseTime(input.startTime, 'startTime')
      : current.startTime;
    const endTime = input.endTime ? this.parseTime(input.endTime, 'endTime') : current.endTime;

    this.ensureValidTimeRange(startTime, endTime);

    if (unitId) {
      await this.ensureUnitExists(unitId);
    }

    await this.ensureNoConflict({
      professionalId,
      weekday,
      startTime,
      endTime,
      ignoreId: availabilityId,
    });

    const availability = await this.prisma.availability.update({
      where: { id: availabilityId },
      data: {
        ...(input.weekday !== undefined ? { weekday: input.weekday } : {}),
        ...(input.startTime !== undefined ? { startTime } : {}),
        ...(input.endTime !== undefined ? { endTime } : {}),
        ...(input.unitId !== undefined ? { unitId } : {}),
        ...(input.slotMinutes !== undefined ? { intervalMinutes: input.slotMinutes } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
      include: {
        professional: {
          select: {
            id: true,
            fullName: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.toResponse(availability);
  }

  async remove(id: string) {
    const availabilityId = this.validateId(id, 'Availability');

    await this.findAvailabilityOrThrow(availabilityId);

    return this.prisma.availability.delete({
      where: { id: availabilityId },
      select: { id: true },
    });
  }

  private async findAvailabilityOrThrow(id: string) {
    const availability = await this.prisma.availability.findUnique({
      where: { id },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found.');
    }

    return availability;
  }

  private async ensureProfessionalExists(id: string) {
    const professionalId = this.validateId(id, 'Professional');
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      select: { id: true },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found.');
    }
  }

  private async ensureUnitExists(id: string) {
    const unitId = this.validateId(id, 'Unit');
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      select: { id: true },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found.');
    }
  }

  private async ensureNoConflict(input: {
    professionalId: string;
    weekday: number;
    startTime: Date;
    endTime: Date;
    ignoreId?: string;
  }) {
    const existingItems = await this.prisma.availability.findMany({
      where: {
        professionalId: input.professionalId.trim(),
        weekday: input.weekday,
        ...(input.ignoreId ? { id: { not: input.ignoreId } } : {}),
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    const hasOverlap = existingItems.some((item) =>
      this.rangesOverlap(input.startTime, input.endTime, item.startTime, item.endTime),
    );

    if (hasOverlap) {
      throw new ConflictException(
        'Availability overlaps with another availability for this professional on the same weekday.',
      );
    }
  }

  private ensureValidTimeRange(startTime: Date, endTime: Date) {
    if (endTime.getTime() <= startTime.getTime()) {
      throw new BadRequestException('endTime must be greater than startTime.');
    }
  }

  private parseTime(value: string, fieldName: string): Date {
    const normalizedValue = value.trim();
    const match = normalizedValue.match(TIME_REGEX);

    if (!match) {
      throw new BadRequestException(`${fieldName} must be in HH:mm or HH:mm:ss format.`);
    }

    const [, hours, minutes, seconds = '00'] = match;
    return new Date(`${TIME_BASE_DATE}T${hours}:${minutes}:${seconds}.000Z`);
  }

  private rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
    return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
  }

  private validateId(id: string, entityLabel: string): string {
    try {
      if (!id.trim()) {
        throw new Error();
      }

      return id.trim();
    } catch {
      throw new BadRequestException(`${entityLabel} id must be a valid string identifier.`);
    }
  }

  private toResponse(availability: {
    id: string;
    professionalId: string;
    unitId: string | null;
    weekday: number;
    startTime: Date;
    endTime: Date;
    intervalMinutes: number | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    professional?: {
      id: string;
      fullName: string;
    };
    unit?: {
      id: string;
      name: string;
    } | null;
  }) {
    return {
      id: availability.id,
      professionalId: availability.professionalId,
      weekday: availability.weekday,
      startTime: availability.startTime.toISOString().slice(11, 19),
      endTime: availability.endTime.toISOString().slice(11, 19),
      unitId: availability.unitId,
      slotMinutes: availability.intervalMinutes,
      active: availability.active,
      professional: availability.professional ?? null,
      unit: availability.unit ?? null,
      createdAt: availability.createdAt,
      updatedAt: availability.updatedAt,
    };
  }
}
