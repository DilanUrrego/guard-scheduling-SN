import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestsService } from '../rests/rests.service';
import { ShiftConfigsService } from '../shift-configs/shift-configs.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BulkCreateScheduleDto } from './dto/bulk-create-schedule.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';

@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
    private restsService: RestsService,
    private shiftConfigsService: ShiftConfigsService,
  ) {}

  // ── Creación individual ───────────────────────────────────────
  async create(dto: CreateScheduleDto, createdById: string) {
    const date = new Date(dto.date);
    await this.validateAssignment(dto.guard_id, dto.shift_config_id, date, null);

    return this.prisma.schedule.create({
      data: {
        guard_id:        dto.guard_id,
        shift_config_id: dto.shift_config_id,
        date,
        status:          dto.status ?? 'scheduled',
        created_by_id:   createdById,
      },
      include: this.defaultInclude(),
    });
  }

  // ── Creación masiva (asignar un turno a varios días de golpe) ─
  async bulkCreate(dto: BulkCreateScheduleDto, createdById: string) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const dateStr of dto.dates) {
      const date = new Date(dateStr);
      try {
        await this.validateAssignment(dto.guard_id, dto.shift_config_id, date, null);
        await this.prisma.schedule.create({
          data: {
            guard_id:        dto.guard_id,
            shift_config_id: dto.shift_config_id,
            date,
            status:          'scheduled',
            created_by_id:   createdById,
          },
        });
        results.created++;
      } catch (e: any) {
        results.skipped++;
        results.errors.push(`${dateStr}: ${e.message}`);
      }
    }
    return results;
  }

  // ── Vista calendario ──────────────────────────────────────────
  // Devuelve todas las asignaciones del mes, agrupadas para renderizar
  // el calendario. Filtros opcionales: por puesto o por vigilante.
  async getCalendar(query: CalendarQueryDto) {
    const { year, month, post_id, guard_id } = query;

    const dateStart = new Date(year, month - 1, 1);
    const dateEnd   = new Date(year, month, 0);   // último día del mes

    const schedules = await this.prisma.schedule.findMany({
      where: {
        date:    { gte: dateStart, lte: dateEnd },
        ...(guard_id && { guard_id }),
        ...(post_id  && { shift_config: { post_id } }),
      },
      include: {
        guard: { select: { id: true, full_name: true, id_number: true } },
        shift_config: {
          select: {
            id: true, code: true, name: true,
            start_time: true, end_time: true,
            color_hex: true, is_worked_rest: true,
            post: { select: { id: true, name: true, code: true } },
          },
        },
        novelty: {
          select: {
            id: true,
            novelty_type: { select: { code: true, name: true, color_hex: true } },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { guard: { full_name: 'asc' } }],
    });

    return schedules;
  }

  // ── Vista mensual por vigilante (equivale a "programación por empleado") ──
  async getMonthlyByGuard(guardId: string, year: number, month: number) {
    const guard = await this.prisma.guard.findUnique({ where: { id: guardId } });
    if (!guard) throw new NotFoundException('Vigilante no encontrado');

    const dateStart = new Date(year, month - 1, 1);
    const dateEnd   = new Date(year, month, 0);

    const [schedules, rests] = await Promise.all([
      this.prisma.schedule.findMany({
        where: { guard_id: guardId, date: { gte: dateStart, lte: dateEnd } },
        include: {
          shift_config: {
            select: {
              code: true, name: true, start_time: true,
              end_time: true, color_hex: true,
              post: { select: { id: true, name: true, code: true } },
            },
          },
          novelty: {
            select: {
              novelty_type: { select: { code: true, name: true, color_hex: true } },
            },
          },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.rest.findMany({
        where: {
          guard_id:   guardId,
          date_start: { lte: dateEnd },
          date_end:   { gte: dateStart },
        },
      }),
    ]);

    return { guard, schedules, rests };
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: this.defaultInclude(),
    });
    if (!schedule) throw new NotFoundException('Programación no encontrada');
    return schedule;
  }

  async update(id: string, dto: UpdateScheduleDto, modifiedById: string) {
    const existing = await this.findOne(id);
    const date = dto.date ? new Date(dto.date) : existing.date;
    const shiftId = dto.shift_config_id ?? existing.shift_config_id;

    if (dto.shift_config_id || dto.date) {
      await this.validateAssignment(existing.guard_id, shiftId, date, id);
    }

    return this.prisma.schedule.update({
      where: { id },
      data: {
        ...(dto.shift_config_id && { shift_config_id: dto.shift_config_id }),
        ...(dto.date            && { date }),
        ...(dto.status          && { status: dto.status }),
        modified_by_id: modifiedById,
      },
      include: this.defaultInclude(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.schedule.delete({ where: { id } });
    return { message: 'Programación eliminada correctamente' };
  }

  // ── Validaciones de negocio ───────────────────────────────────
  private async validateAssignment(
    guardId: string,
    shiftConfigId: string,
    date: Date,
    excludeScheduleId: string | null,
  ) {
    // 1. Vigilante activo
    const guard = await this.prisma.guard.findFirst({
      where: { id: guardId, is_active: true },
    });
    if (!guard) throw new NotFoundException('Vigilante no encontrado o inactivo');

    // 2. Turno válido y activo
    const shift = await this.prisma.shiftConfig.findFirst({
      where: { id: shiftConfigId, is_active: true },
    });
    if (!shift) throw new NotFoundException('Turno no encontrado o inactivo');

    // 3. El vigilante no está en descanso ese día
    const onRest = await this.restsService.isOnRest(guardId, date);
    if (onRest)
      throw new ConflictException(
        `${guard.full_name} tiene un descanso programado para el ${date.toLocaleDateString('es-CO')}`,
      );

    // 4. Cruce de turnos: busca asignaciones del mismo vigilante en la misma fecha
    const sameDay = await this.prisma.schedule.findMany({
      where: {
        guard_id: guardId,
        date,
        ...(excludeScheduleId && { id: { not: excludeScheduleId } }),
      },
      include: { shift_config: true },
    });

    // Compara rangos en minutos para detectar solapamiento
    const { start: newStart, end: newEnd } = ShiftConfigsService.shiftRangeMinutes(
      shift.start_time, shift.end_time, shift.crosses_midnight,
    );

    for (const existing of sameDay) {
      const { start: exStart, end: exEnd } = ShiftConfigsService.shiftRangeMinutes(
        existing.shift_config.start_time,
        existing.shift_config.end_time,
        existing.shift_config.crosses_midnight,
      );
      const overlaps = newStart < exEnd && newEnd > exStart;
      if (overlaps)
        throw new ConflictException(
          `Cruce de turnos: ${guard.full_name} ya tiene el turno ${existing.shift_config.code} ` +
          `(${existing.shift_config.start_time}–${existing.shift_config.end_time}) ese día`,
        );
    }
  }

  private defaultInclude() {
    return {
      guard: { select: { id: true, full_name: true, id_number: true } },
      shift_config: {
        select: {
          id: true, code: true, name: true,
          start_time: true, end_time: true, color_hex: true,
          post: { select: { id: true, name: true, code: true } },
        },
      },
      novelty: {
        select: {
          id: true,
          novelty_type: { select: { code: true, name: true, color_hex: true } },
        },
      },
      created_by:  { select: { id: true, name: true } },
      modified_by: { select: { id: true, name: true } },
    };
  }
}

