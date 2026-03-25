import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateAgendaBlockDto } from './dto/create-agenda-block.dto';
import { ListAgendaBlocksDto } from './dto/list-agenda-blocks.dto';

@Injectable()
export class AgendaBlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAgendaBlockDto) {
    const professionalId = this.validateId(input.professionalId, 'Professional');

    await this.ensureProfessionalExists(professionalId);

    const unitId = input.unitId?.trim() || null;

    if (unitId) {
      await this.ensureUnitExists(unitId);
    }

    const startsAt = this.parseDateTime(input.startsAt, 'startsAt');
    const endsAt = this.parseDateTime(input.endsAt, 'endsAt');

    this.ensureValidRange(startsAt, endsAt);

    const agendaBlock = await this.prisma.agendaBlock.create({
      data: {
        professionalId,
        unitId,
        startsAt,
        endsAt,
        reason: input.reason?.trim() || null,
        allDay: input.allDay ?? false,
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

    return this.toResponse(agendaBlock);
  }

  async findAll(query: ListAgendaBlocksDto) {
    const professionalId = this.validateId(query.professionalId, 'Professional');

    await this.ensureProfessionalExists(professionalId);

    const where: Prisma.AgendaBlockWhereInput = {
      professionalId,
      ...(query.unitId ? { unitId: query.unitId.trim() } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
    };

    const dateFrom = query.dateFrom ? this.parseDateTime(query.dateFrom, 'dateFrom') : null;
    const dateTo = query.dateTo ? this.parseDateTime(query.dateTo, 'dateTo') : null;

    if (dateFrom && dateTo && dateTo.getTime() < dateFrom.getTime()) {
      throw new BadRequestException('dateTo must be greater than or equal to dateFrom.');
    }

    if (dateFrom || dateTo) {
      where.AND = [
        ...(dateFrom ? [{ endsAt: { gte: dateFrom } }] : []),
        ...(dateTo ? [{ startsAt: { lte: dateTo } }] : []),
      ];
    }

    const items = await this.prisma.agendaBlock.findMany({
      where,
      orderBy: [{ startsAt: 'asc' }, { endsAt: 'asc' }],
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

  async remove(id: string) {
    const agendaBlockId = this.validateId(id, 'Agenda block');

    await this.findAgendaBlockOrThrow(agendaBlockId);

    return this.prisma.agendaBlock.delete({
      where: { id: agendaBlockId },
      select: { id: true },
    });
  }

  private async findAgendaBlockOrThrow(id: string) {
    const agendaBlock = await this.prisma.agendaBlock.findUnique({
      where: { id },
    });

    if (!agendaBlock) {
      throw new NotFoundException('Agenda block not found.');
    }

    return agendaBlock;
  }

  private async ensureProfessionalExists(id: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found.');
    }
  }

  private async ensureUnitExists(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found.');
    }
  }

  private ensureValidRange(startsAt: Date, endsAt: Date) {
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException('endsAt must be greater than startsAt.');
    }
  }

  private parseDateTime(value: string, fieldName: string): Date {
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO datetime.`);
    }

    return parsedDate;
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

  private toResponse(agendaBlock: {
    id: string;
    professionalId: string;
    unitId: string | null;
    startsAt: Date;
    endsAt: Date;
    reason: string | null;
    allDay: boolean;
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
      id: agendaBlock.id,
      professionalId: agendaBlock.professionalId,
      unitId: agendaBlock.unitId,
      startsAt: agendaBlock.startsAt,
      endsAt: agendaBlock.endsAt,
      reason: agendaBlock.reason,
      allDay: agendaBlock.allDay,
      active: agendaBlock.active,
      professional: agendaBlock.professional ?? null,
      unit: agendaBlock.unit ?? null,
      createdAt: agendaBlock.createdAt,
      updatedAt: agendaBlock.updatedAt,
    };
  }
}
