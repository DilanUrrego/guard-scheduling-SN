import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSecurityGuardDto } from './dto/create-security-guard.dto';
import { UpdateSecurityGuardDto } from './dto/update-security-guard.dto';
import { FilterSecurityGuardDto } from './dto/filter-security-guard.dto';

@Injectable()
export class SecurityGuardsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSecurityGuardDto) {
    const exists = await this.prisma.guard.findUnique({
      where: { id_number: dto.id_number },
    });
    if (exists) throw new ConflictException(`Ya existe un vigilante con la cédula ${dto.id_number}`);

    return this.prisma.guard.create({ data: dto });
  }

  findAll(filters: FilterSecurityGuardDto) {
    return this.prisma.guard.findMany({
      where: {
        is_active: filters.is_active ?? true,
        ...(filters.is_supervisor !== undefined && { is_supervisor: filters.is_supervisor }),
        ...(filters.search && {
          OR: [
            { full_name: { contains: filters.search, mode: 'insensitive' } },
            { id_number: { contains: filters.search } },
          ],
        }),
      },
      orderBy: { full_name: 'asc' },
    });
  }

  async findOne(id: string) {
    const guard = await this.prisma.guard.findUnique({
      where: { id },
      include: {
        // Últimas 5 novedades
        novelties: {
          orderBy: { date_start: 'desc' },
          take: 5,
          include: { novelty_type: { select: { code: true, name: true, color_hex: true } } },
        },
        // Descansos futuros
        rests: {
          where: { date_end: { gte: new Date() } },
          orderBy: { date_start: 'asc' },
          take: 5,
        },
      },
    });
    if (!guard) throw new NotFoundException('Vigilante no encontrado');
    return guard;
  }

  async findByIdNumber(id_number: string) {
    const guard = await this.prisma.guard.findUnique({ where: { id_number } });
    if (!guard) throw new NotFoundException(`No se encontró vigilante con cédula ${id_number}`);
    return guard;
  }

  async update(id: string, dto: UpdateSecurityGuardDto) {
    await this.findOne(id);
    return this.prisma.guard.update({ where: { id }, data: dto });
  }

  // Retiro: marca inactivo y registra fecha de retiro
  async terminate(id: string, terminationDate?: Date) {
    await this.findOne(id);
    return this.prisma.guard.update({
      where: { id },
      data: {
        is_active: false,
        termination_date: terminationDate ?? new Date(),
      },
    });
  }

  // Reactivar vigilante (ej: fue retirado por error)
  async reactivate(id: string) {
    const guard = await this.prisma.guard.findUnique({ where: { id } });
    if (!guard) throw new NotFoundException('Vigilante no encontrado');
    return this.prisma.guard.update({
      where: { id },
      data: { is_active: true, termination_date: null },
    });
  }

  // Para el informe "personal con turnos pendiente":
  // vigilantes activos sin ninguna asignación en un rango de fechas
  async findWithoutSchedule(dateStart: Date, dateEnd: Date) {
    const guardsWithSchedule = await this.prisma.schedule.findMany({
      where: { date: { gte: dateStart, lte: dateEnd } },
      select: { guard_id: true },
      distinct: ['guard_id'],
    });

    const assignedIds = guardsWithSchedule.map(s => s.guard_id);

    return this.prisma.guard.findMany({
      where: {
        is_active: true,
        id: { notIn: assignedIds },
      },
      orderBy: { full_name: 'asc' },
    });
  }
}

