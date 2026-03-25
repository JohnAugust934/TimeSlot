import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ListServicesDto } from './dto/list-services.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateServiceDto) {
    const service = await this.prisma.service.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        durationMinutes: input.durationMinutes,
        active: input.active ?? true,
      },
      include: {
        _count: {
          select: {
            professionals: true,
          },
        },
      },
    });

    return this.toResponse(service);
  }

  async findAll(query: ListServicesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const normalizedSearch = query.search?.trim();

    const where: Prisma.ServiceWhereInput = {
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              { name: { contains: normalizedSearch, mode: 'insensitive' } },
              {
                description: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              professionals: true,
            },
          },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: this.validateId(id) },
      include: {
        _count: {
          select: {
            professionals: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    return this.toResponse(service);
  }

  async update(id: string, input: UpdateServiceDto) {
    const serviceId = this.validateId(id);

    await this.ensureExists(serviceId);

    const service = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() || null }
          : {}),
        ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
      include: {
        _count: {
          select: {
            professionals: true,
          },
        },
      },
    });

    return this.toResponse(service);
  }

  async deactivate(id: string) {
    const serviceId = this.validateId(id);

    await this.ensureExists(serviceId);

    const service = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        active: false,
      },
      include: {
        _count: {
          select: {
            professionals: true,
          },
        },
      },
    });

    return this.toResponse(service);
  }

  private async ensureExists(id: string) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Service not found.');
    }
  }

  private validateId(id: string): string {
    try {
      if (!id.trim()) {
        throw new Error();
      }

      return id.trim();
    } catch {
      throw new BadRequestException('Service id must be a valid string identifier.');
    }
  }

  private toResponse(service: {
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      professionals: number;
    };
  }) {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      active: service.active,
      professionalLinksCount: service._count.professionals,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
