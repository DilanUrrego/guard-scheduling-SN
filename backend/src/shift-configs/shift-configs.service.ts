import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftConfigDto } from './dto/create-shift-config.dto';
import { UpdateShiftConfigDto } from './dto/update-shift-config.dto';

@Injectable()
export class ShiftConfigsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateShiftConfigDto) {
    // Código de turno único globalmente
    const exists = await this.prisma.shiftConfig.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`Ya existe un turno con el código ${dto.code}`);

    // Valida que el puesto exista
    const post = await this.prisma.post.findFirst({
      where: { id: dto.post_id, is_active: true },
    });
    if (!post) throw new NotFoundException('Puesto no encontrado o inactivo');

    // Valida formato HH:mm
    this.validateTimeFormat(dto.start_time, 'start_time');
    this.validateTimeFormat(dto.end_time, 'end_time');

    // Detecta automáticamente si el turno cruza medianoche
    const crosses_midnight = dto.end_time <= dto.start_time;

    return this.prisma.shiftConfig.create({
      data: { ...dto, crosses_midnight },
      include: { post: { select: { id: true, name: true, code: true } } },
    });
  }

  findAll(postId?: string) {
    return this.prisma.shiftConfig.findMany({
      where: {
        is_active: true,
        ...(postId && { post_id: postId }),
      },
      include: { post: { select: { id: true, name: true, code: true } } },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const shift = await this.prisma.shiftConfig.findUnique({
      where: { id },
      include: { post: { select: { id: true, name: true, code: true } } },
    });
    if (!shift) throw new NotFoundException('Configuración de turno no encontrada');
    return shift;
  }

  async update(id: string, dto: UpdateShiftConfigDto) {
    await this.findOne(id);

    if (dto.start_time) this.validateTimeFormat(dto.start_time, 'start_time');
    if (dto.end_time) this.validateTimeFormat(dto.end_time, 'end_time');

    // Recalcula crosses_midnight si se actualizan los horarios
    const current = await this.findOne(id);
    const start = dto.start_time ?? current.start_time;
    const end   = dto.end_time   ?? current.end_time;
    const crosses_midnight = end <= start;

    return this.prisma.shiftConfig.update({
      where: { id },
      data: { ...dto, crosses_midnight },
      include: { post: { select: { id: true, name: true, code: true } } },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.shiftConfig.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // ── Helpers ──────────────────────────────────
  private validateTimeFormat(time: string, field: string) {
    const re = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!re.test(time))
      throw new BadRequestException(`${field} debe tener formato HH:mm (ej: 05:00)`);
  }

  // Utilitario para usar desde SchedulesService:
  // Dado un turno, devuelve los minutos absolutos de inicio y fin
  // (fin puede superar 1440 si cruza medianoche)
  static toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  static shiftRangeMinutes(start: string, end: string, crosses: boolean) {
    const s = ShiftConfigsService.toMinutes(start);
    const e = ShiftConfigsService.toMinutes(end);
    return { start: s, end: crosses ? e + 1440 : e };
  }
}
