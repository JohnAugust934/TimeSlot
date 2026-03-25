import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsDto } from './dto/list-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateClientDto) {
    const client = await this.prisma.client.create({
      data: {
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        document: input.document?.trim() || null,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
        notes: input.notes?.trim() || null,
        active: true,
      },
    });

    return this.toResponse(client);
  }

  async findAll(query: ListClientsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const normalizedSearch = query.search?.trim();

    const where: Prisma.ClientWhereInput = {
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.fullName
        ? { fullName: { contains: query.fullName.trim(), mode: 'insensitive' } }
        : {}),
      ...(query.phone ? { phone: { contains: query.phone.trim(), mode: 'insensitive' } } : {}),
      ...(query.email
        ? {
            email: {
              contains: query.email.trim().toLowerCase(),
              mode: 'insensitive',
            },
          }
        : {}),
      ...(normalizedSearch
        ? {
            OR: [
              { fullName: { contains: normalizedSearch, mode: 'insensitive' } },
              { phone: { contains: normalizedSearch, mode: 'insensitive' } },
              {
                email: {
                  contains: normalizedSearch.toLowerCase(),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.client.count({ where }),
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
    const client = await this.prisma.client.findUnique({
      where: { id: this.validateId(id) },
    });

    if (!client) {
      throw new NotFoundException('Client not found.');
    }

    return this.toResponse(client);
  }

  async update(id: string, input: UpdateClientDto) {
    const clientId = this.validateId(id);

    await this.ensureExists(clientId);

    const client = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName.trim() } : {}),
        ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
        ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
        ...(input.document !== undefined ? { document: input.document.trim() || null } : {}),
        ...(input.birthDate !== undefined
          ? { birthDate: input.birthDate ? new Date(input.birthDate) : null }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });

    return this.toResponse(client);
  }

  async deactivate(id: string) {
    const clientId = this.validateId(id);

    await this.ensureExists(clientId);

    const client = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        active: false,
      },
    });

    return this.toResponse(client);
  }

  private async ensureExists(id: string) {
    const existing = await this.prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Client not found.');
    }
  }

  private validateId(id: string): string {
    try {
      if (!id.trim()) {
        throw new Error();
      }

      return id.trim();
    } catch {
      throw new BadRequestException('Client id must be a valid string identifier.');
    }
  }

  private toResponse(client: {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    document: string | null;
    birthDate: Date | null;
    notes: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: client.id,
      fullName: client.fullName,
      phone: client.phone,
      email: client.email,
      document: client.document,
      birthDate: client.birthDate,
      notes: client.notes,
      active: client.active,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }
}
