
import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NoveltyCategory } from '@prisma/client';
import { CreateNoveltyDto } from './dto/create-novelty.dto';
import { UpdateNoveltyDto } from './dto/update-novelty.dto';
import { FilterNoveltyDto } from './dto/filter-novely.dto';

@Injectable()
export class NoveltiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNoveltyDto, registeredById: string) {
    // Verifica vigilante activo
    const guard = await this.prisma.guard.findFirst({
      where: { id: dto.guard_id, is_active: true },
    });
    if (!guard) throw new NotFoundException('Vigilante no encontrado o inactivo');

    // Verifica puesto activo
    const post = await this.prisma.post.findFirst({
      where: { id: dto.post_id, is_active: true },
    });
    if (!post) throw new NotFoundException('Puesto no encontrado o inactivo');

    // Verifica tipo de novedad
    const noveltyType = await this.prisma.noveltyType.findUnique({
      where: { id: dto.novelty_type_id },
    });
    if (!noveltyType) throw new NotFoundException('Tipo de novedad no encontrado');

    // Si se asocia a una programación, verifica que exista y pertenezca al vigilante
    if (dto.schedule_id) {
      const schedule = await this.prisma.schedule.findFirst({
        where: { id: dto.schedule_id, guard_id: dto.guard_id },
      });
      if (!schedule)
        throw new NotFoundException('Programación no encontrada o no pertenece al vigilante');

      // Una programación solo puede tener una novedad
      const existingNovelty = await this.prisma.novelty.findUnique({
        where: { schedule_id: dto.schedule_id },
      });
      if (existingNovelty)
        throw new ConflictException('Esta programación ya tiene una novedad registrada');

      // Actualiza el estado de la programación a 'novedad'
      await this.prisma.schedule.update({
        where: { id: dto.schedule_id },
        data: { status: 'novedad' },
      });
    }

    const dateStart = new Date(dto.date_start);
    const dateEnd = dto.date_end ? new Date(dto.date_end) : null;

    if (dateEnd && dateEnd < dateStart)
      throw new BadRequestException('La fecha de fin no puede ser anterior a la fecha de inicio');

    // Si es un retiro, desactiva al vigilante
    if (noveltyType.is_termination) {
      await this.prisma.guard.update({
        where: { id: dto.guard_id },
        data: { is_active: false, termination_date: dateStart },
      });
    }

    return this.prisma.novelty.create({
      data: {
        guard_id:         dto.guard_id,
        novelty_type_id:  dto.novelty_type_id,
        post_id:          dto.post_id,
        schedule_id:      dto.schedule_id,
        date_start:       dateStart,
        date_end:         dateEnd,
        support_submitted: dto.support_submitted ?? false,
        observations:     dto.observations,
        registered_by_id: registeredById,
      },
      include: this.defaultInclude(),
    });
  }

  findAll(filters: FilterNoveltyDto) {
    const { guard_id, post_id, novelty_type_id, category,
            support_pending, date_start, date_end } = filters;

    // Construimos las condiciones para la relación anidada de forma unificada
    const noveltyTypeFilter: any = {};
    
    if (category) {
        noveltyTypeFilter.category = category as NoveltyCategory; // 👈 Casteo al Enum
    }
    
    if (support_pending === true) {
        noveltyTypeFilter.support_required = true;
    }

    return this.prisma.novelty.findMany({
      where: {
        ...(guard_id        && { guard_id }),
        ...(post_id         && { post_id }),
        ...(novelty_type_id && { novelty_type_id }),

        ...(Object.keys(noveltyTypeFilter).length > 0 && {
            novelty_type: { is: noveltyTypeFilter }
        }),
       
        // Soporte pendiente: requiere soporte pero no se ha presentado
        ...(support_pending === true && {
          novelty_type: { support_required: true },
          support_submitted: false,
        }),
        ...(date_start && { date_start: { gte: new Date(date_start) } }),
        ...(date_end   && { date_end:   { lte: new Date(date_end) } }),
      },
      include: this.defaultInclude(),
      orderBy: { date_start: 'desc' },
    });
  }

  async findOne(id: string) {
    const novelty = await this.prisma.novelty.findUnique({
      where: { id },
      include: this.defaultInclude(),
    });
    if (!novelty) throw new NotFoundException('Novedad no encontrada');
    return novelty;
  }

  async update(id: string, dto: UpdateNoveltyDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.date_start) data.date_start = new Date(dto.date_start);
    if (dto.date_end)   data.date_end   = new Date(dto.date_end);

    return this.prisma.novelty.update({
      where: { id },
      data,
      include: this.defaultInclude(),
    });
  }

  async remove(id: string) {
    const novelty = await this.findOne(id);

    // Restaura el estado de la programación si estaba vinculada
    if (novelty.schedule_id) {
      await this.prisma.schedule.update({
        where: { id: novelty.schedule_id },
        data: { status: 'scheduled' },
      });
    }

    await this.prisma.novelty.delete({ where: { id } });
    return { message: 'Novedad eliminada correctamente' };
  }

  // Catálogo de tipos de novedad (para poblar dropdowns en el frontend)
  findAllTypes() {
    return this.prisma.noveltyType.findMany({
      where: { is_active: true },
      orderBy: { category: 'asc' },
    });
  }

  private defaultInclude() {
    return {
      guard:        { select: { id: true, full_name: true, id_number: true } },
      post:         { select: { id: true, name: true, code: true } },
      novelty_type: true,
      schedule: {
        select: {
          id: true, date: true,
          shift_config: { select: { code: true, name: true } },
        },
      },
      registered_by: { select: { id: true, name: true } },
    };
  }
}

