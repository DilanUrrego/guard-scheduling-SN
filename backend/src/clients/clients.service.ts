import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update.client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    const exists = await this.prisma.client.findFirst({
      where: { OR: [{ code: dto.code }, { nit: dto.nit }] },
    });
    if (exists) throw new ConflictException('Ya existe un cliente con ese código o NIT');

    return this.prisma.client.create({ data: dto, include: { posts: false } });
  }

  findAll() {
    return this.prisma.client.findMany({
      where: { is_active: true },
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { posts: { where: { is_active: true }, orderBy: { name: 'asc' } } },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.client.update({
      where: { id },
      data: { is_active: false },
    });
  }
}

