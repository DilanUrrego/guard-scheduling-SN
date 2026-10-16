import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestDto } from './dto/create-rest.dto';
import { UpdateRestDto } from './dto/update-rest.dto';

@Injectable()
export class RestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRestDto, approvedById: string) {
    // Verifica que el vigilante exista y esté activo
    const guard = await this.prisma.guard.findFirst({
      where: { id: dto.guard_id, is_active: true },
    });
    if (!guard) throw new NotFoundException('Vigilante no encontrado o inactivo');

    const dateStart = new Date(dto.date_start);
    const dateEnd   = new Date(dto.date_end);

    if (dateEnd < dateStart)
      throw new BadRequestException('La fecha de fin no puede ser anterior a la fecha de inicio');

    // Verifica que no haya un descanso solapado para el mismo vigilante
    const overlap = await this.prisma.rest.findFirst({
      where: {
        guard_id:   dto.guard_id,
        date_start: { lte: dateEnd },
        date_end:   { gte: dateStart },
      },
    });
    if (overlap)
      throw new ConflictException('El vigilante ya tiene un descanso programado en ese rango de fechas');

    return this.prisma.rest.create({
      data: {
        ...dto,
        date_start:      dateStart,
        date_end:        dateEnd,
        approved_by_id:  approvedById,
      },
      include: { guard: { select: { id: true, full_name: true, id_number: true } } },
    });
  }

  findAll(guardId?: string) {
    return this.prisma.rest.findMany({
      where: { ...(guardId && { guard_id: guardId }) },
      include: { guard: { select: { id: true, full_name: true, id_number: true } } },
      orderBy: { date_start: 'asc' },
    });
  }

  // Descansos vigentes o futuros de un vigilante — usado por SchedulesService
  async findActiveByGuard(guardId: string, fromDate: Date): Promise<{ date_start: Date; date_end: Date }[]> {
    return this.prisma.rest.findMany({
      where: { guard_id: guardId, date_end: { gte: fromDate } },
      select: { date_start: true, date_end: true },
    });
  }

  async findOne(id: string) {
    const rest = await this.prisma.rest.findUnique({
      where: { id },
      include: { guard: { select: { id: true, full_name: true, id_number: true } } },
    });
    if (!rest) throw new NotFoundException('Descanso no encontrado');
    return rest;
  }

  async update(id: string, dto: UpdateRestDto) {
    const rest = await this.findOne(id);

    const dateStart = dto.date_start ? new Date(dto.date_start) : rest.date_start;
    const dateEnd   = dto.date_end   ? new Date(dto.date_end)   : rest.date_end;

    if (dateEnd < dateStart)
      throw new BadRequestException('La fecha de fin no puede ser anterior a la fecha de inicio');

    return this.prisma.rest.update({
      where: { id },
      data: { ...dto, date_start: dateStart, date_end: dateEnd },
      include: { guard: { select: { id: true, full_name: true, id_number: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.rest.delete({ where: { id } });
    return { message: 'Descanso eliminado correctamente' };
  }

  // Utilidad: dado un vigilante y una fecha, ¿está en descanso?
  async isOnRest(guardId: string, date: Date): Promise<boolean> {
    const rest = await this.prisma.rest.findFirst({
      where: {
        guard_id:   guardId,
        date_start: { lte: date },
        date_end:   { gte: date },
      },
    });
    return !!rest;
  }
}


