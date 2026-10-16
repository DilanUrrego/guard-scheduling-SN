import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityGuardsService } from '../security-guards/security-guards.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private guardsService: SecurityGuardsService,
  ) {}

  // ── 1. INFORME DE NOVEDADES ────────────────────────────────────
  async noveltiesReport(dateStart: Date, dateEnd: Date) {
    const novelties = await this.prisma.novelty.findMany({
      where: { date_start: { gte: dateStart }, date_end: { lte: dateEnd } },
      include: {
        guard:        { select: { id_number: true, full_name: true } },
        post:         { select: { code: true, name: true } },
        novelty_type: { select: { code: true, name: true, category: true, support_required: true } },
        registered_by: { select: { name: true } },
      },
      orderBy: [{ novelty_type: { category: 'asc' } }, { date_start: 'asc' }],
    });

    // Marca cuáles tienen soporte pendiente
    return novelties.map(n => ({
      ...n,
      support_pending: n.novelty_type.support_required && !n.support_submitted,
    }));
  }

  // ── 2. INFORME DE PROGRAMACIÓN MENSUAL (todos los vigilantes) ─
  async monthlyScheduleReport(year: number, month: number) {
    const dateStart = new Date(year, month - 1, 1);
    const dateEnd   = new Date(year, month, 0);

    const schedules = await this.prisma.schedule.findMany({
      where: { date: { gte: dateStart, lte: dateEnd } },
      include: {
        guard: { select: { id_number: true, full_name: true } },
        shift_config: {
          select: {
            code: true, name: true,
            start_time: true, end_time: true, color_hex: true,
            post: { select: { code: true, name: true } },
          },
        },
        novelty: {
          select: { novelty_type: { select: { code: true, color_hex: true } } },
        },
      },
      orderBy: [{ guard: { full_name: 'asc' } }, { date: 'asc' }],
    });

    // Agrupa por vigilante para facilitar el renderizado del calendario
    const byGuard = new Map<string, typeof schedules>();
    for (const s of schedules) {
      const key = s.guard_id;
      if (!byGuard.has(key)) byGuard.set(key, []);
      byGuard.get(key)!.push(s);
    }

    return Array.from(byGuard.values()).map(entries => ({
      guard:     entries[0].guard,
      schedules: entries,
    }));
  }

  // ── 3. INFORME DE PROGRAMACIÓN POR CLIENTE ────────────────────
  async clientScheduleReport(clientId: string, year: number, month: number) {
    const dateStart = new Date(year, month - 1, 1);
    const dateEnd   = new Date(year, month, 0);

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        posts: {
          where: { is_active: true },
          include: {
            shift_configs: {
              where: { is_active: true },
              include: {
                schedules: {
                  where: { date: { gte: dateStart, lte: dateEnd } },
                  include: {
                    guard: { select: { id_number: true, full_name: true } },
                    novelty: {
                      select: { novelty_type: { select: { code: true, color_hex: true } } },
                    },
                  },
                  orderBy: { date: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!client) throw new Error('Cliente no encontrado');
    return client;
  }

  // ── 4. INFORME PERSONAL CON TURNOS PENDIENTES ─────────────────
  async pendingGuardsReport(dateStart: Date, dateEnd: Date) {
    return this.guardsService.findWithoutSchedule(dateStart, dateEnd);
  }

  // ── 5. INFORME DE CRUCE DE TURNOS ─────────────────────────────
  async shiftCrossReport(year: number, month: number) {
    const dateStart = new Date(year, month - 1, 1);
    const dateEnd   = new Date(year, month, 0);

    const schedules = await this.prisma.schedule.findMany({
      where: { date: { gte: dateStart, lte: dateEnd } },
      include: {
        guard:       { select: { id_number: true, full_name: true } },
        shift_config: { select: { code: true, start_time: true, end_time: true, crosses_midnight: true } },
      },
      orderBy: [{ guard_id: 'asc' }, { date: 'asc' }],
    });

    const crosses: any[] = [];

    // Agrupa por vigilante+fecha y busca solapamientos
    const grouped = new Map<string, typeof schedules>();
    for (const s of schedules) {
      const key = `${s.guard_id}_${s.date.toISOString().slice(0, 10)}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(s);
    }

    for (const entries of grouped.values()) {
      if (entries.length < 2) continue;
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const a = entries[i].shift_config;
          const b = entries[j].shift_config;
          const aStart = this.toMin(a.start_time);
          const aEnd   = this.toMin(a.end_time) + (a.crosses_midnight ? 1440 : 0);
          const bStart = this.toMin(b.start_time);
          const bEnd   = this.toMin(b.end_time) + (b.crosses_midnight ? 1440 : 0);
          if (aStart < bEnd && aEnd > bStart) {
            crosses.push({
              guard:   entries[i].guard,
              date:    entries[i].date,
              shift_a: a,
              shift_b: b,
            });
          }
        }
      }
    }

    return crosses;
  }

  // ── EXPORTACIÓN EXCEL ─────────────────────────────────────────
  async exportMonthlyToExcel(year: number, month: number): Promise<Buffer> {
    const data = await this.monthlyScheduleReport(year, month);
    const daysInMonth = new Date(year, month, 0).getDate();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Programación ${month}-${year}`);

    // Encabezado: Vigilante | día 1 | día 2 | ... | día N
    const header = ['Cédula', 'Nombre', ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const headerRow = ws.addRow(header);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const { guard, schedules } of data) {
      // Mapa día → código de turno/novedad
      const dayMap = new Map<number, { code: string; color: string }>();
      for (const s of schedules) {
        const day  = new Date(s.date).getDate();
        const code = s.novelty?.novelty_type?.code ?? s.shift_config.code;
        const color = (s.novelty?.novelty_type?.color_hex ?? s.shift_config.color_hex)
          .replace('#', 'FF');
        dayMap.set(day, { code, color });
      }

      const row = ws.addRow([
        guard.id_number,
        guard.full_name,
        ...Array.from({ length: daysInMonth }, (_, i) => dayMap.get(i + 1)?.code ?? '-'),
      ]);

      // Colorea cada celda de turno según el color configurado
      for (let d = 1; d <= daysInMonth; d++) {
        const cell = row.getCell(d + 2); // +2 por cédula y nombre
        const entry = dayMap.get(d);
        if (entry) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: entry.color } };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        }
        cell.alignment = { horizontal: 'center' };
      }
    }

    // Ajusta ancho de columnas
    ws.getColumn(1).width = 14;
    ws.getColumn(2).width = 30;
    for (let i = 3; i <= daysInMonth + 2; i++) ws.getColumn(i).width = 5;

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async exportNoveltieToExcel(dateStart: Date, dateEnd: Date): Promise<Buffer> {
    const data = await this.noveltiesReport(dateStart, dateEnd);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Novedades');

    const headerRow = ws.addRow([
      'Cédula', 'Nombre', 'Puesto', 'Tipo', 'Categoría',
      'Fecha Inicio', 'Fecha Fin', 'Soporte Requerido', 'Soporte Presentado', 'Observaciones',
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };

    for (const n of data) {
      const row = ws.addRow([
        n.guard.id_number,
        n.guard.full_name,
        `${n.post.code} - ${n.post.name}`,
        `${n.novelty_type.code} - ${n.novelty_type.name}`,
        n.novelty_type.category,
        n.date_start.toLocaleDateString('es-CO'),
        n.date_end?.toLocaleDateString('es-CO') ?? '-',
        n.novelty_type.support_required ? 'Sí' : 'No',
        n.support_submitted ? 'Sí' : 'No',
        n.observations ?? '',
      ]);

      // Resalta en rojo filas con soporte pendiente
      if (n.support_pending) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE8E8' } };
        row.getCell(9).font = { color: { argb: 'FFCC0000' }, bold: true };
      }
    }

    ws.columns.forEach(col => { col.width = 20; });
    ws.getColumn(10).width = 35; // Observaciones

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  private toMin(t: string) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
}

