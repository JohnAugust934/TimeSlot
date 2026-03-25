import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { ListProfessionalsDto } from './dto/list-professionals.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateProfessionalDto) {
    const professional = await this.prisma.professional.create({
      data: {
        fullName: input.fullName.trim(),
        category: input.category?.trim(),
        specialty: input.specialty?.trim(),
        phone: input.phone?.trim(),
        email: input.email?.trim().toLowerCase(),
        active: input.active ?? true,
      },
    });

    return this.toResponse(professional);
  }

  async findAll(query: ListProfessionalsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProfessionalWhereInput = {
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.category ? { category: { equals: query.category, mode: 'insensitive' } } : {}),
      ...(query.specialty ? { specialty: { equals: query.specialty, mode: 'insensitive' } } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { category: { contains: query.search, mode: 'insensitive' } },
              { specialty: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.professional.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.professional.count({ where }),
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
    const professional = await this.prisma.professional.findUnique({
      where: { id: this.validateId(id) },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found.');
    }

    return this.toResponse(professional);
  }

  async update(id: string, input: UpdateProfessionalDto) {
    const professionalId = this.validateId(id);

    await this.ensureExists(professionalId);

    const professional = await this.prisma.professional.update({
      where: { id: professionalId },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
        ...(input.category !== undefined ? { category: input.category?.trim() || null } : {}),
        ...(input.specialty !== undefined ? { specialty: input.specialty?.trim() || null } : {}),
        ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
        ...(input.email !== undefined ? { email: input.email?.trim().toLowerCase() || null } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });

    return this.toResponse(professional);
  }

  async deactivate(id: string) {
    const professionalId = this.validateId(id);

    await this.ensureExists(professionalId);

    const professional = await this.prisma.professional.update({
      where: { id: professionalId },
      data: {
        active: false,
      },
    });

    return this.toResponse(professional);
  }

  private async ensureExists(id: string) {
    const existing = await this.prisma.professional.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Professional not found.');
    }
  }

  private validateId(id: string): string {
    try {
      if (!id.trim()) {
        throw new Error();
      }
      return id.trim();
    } catch {
      throw new BadRequestException('Professional id must be a valid string identifier.');
    }
  }

  private toResponse(professional: {
    id: string;
    fullName: string;
    category: string | null;
    specialty: string | null;
    phone: string | null;
    email: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: professional.id,
      fullName: professional.fullName,
      category: professional.category,
      specialty: professional.specialty,
      phone: professional.phone,
      email: professional.email,
      active: professional.active,
      createdAt: professional.createdAt,
      updatedAt: professional.updatedAt,
    };
  }
}
