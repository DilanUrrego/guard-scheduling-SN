import {
  Controller, Get, Query, Res, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Informes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('novelties')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Informe de novedades (JSON)' })
  @ApiQuery({ name: 'dateStart', example: '2026-01-01' })
  @ApiQuery({ name: 'dateEnd',   example: '2026-01-31' })
  novelties(
    @Query('dateStart') dateStart: string,
    @Query('dateEnd')   dateEnd: string,
  ) {
    return this.reportsService.noveltiesReport(new Date(dateStart), new Date(dateEnd));
  }

  @Get('novelties/excel')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Informe de novedades (Excel)' })
  async noveltiesExcel(
    @Query('dateStart') dateStart: string,
    @Query('dateEnd')   dateEnd: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportNoveltieToExcel(
      new Date(dateStart), new Date(dateEnd),
    );
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="novedades_${dateStart}_${dateEnd}.xlsx"`);
    res.send(buffer);
  }

  @Get('monthly')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Programación mensual consolidada (JSON)' })
  monthly(
    @Query('year',  ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.reportsService.monthlyScheduleReport(year, month);
  }

  @Get('monthly/excel')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Programación mensual consolidada (Excel)' })
  async monthlyExcel(
    @Query('year',  ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportMonthlyToExcel(year, month);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="programacion_${year}_${month}.xlsx"`);
    res.send(buffer);
  }

  @Get('by-client')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Programación mensual por cliente (JSON)' })
  byClient(
    @Query('clientId')          clientId: string,
    @Query('year',  ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.reportsService.clientScheduleReport(clientId, year, month);
  }

  @Get('pending-guards')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Vigilantes sin turno asignado en un rango de fechas' })
  @ApiQuery({ name: 'dateStart', example: '2026-01-01' })
  @ApiQuery({ name: 'dateEnd',   example: '2026-01-31' })
  pendingGuards(
    @Query('dateStart') dateStart: string,
    @Query('dateEnd')   dateEnd: string,
  ) {
    return this.reportsService.pendingGuardsReport(new Date(dateStart), new Date(dateEnd));
  }

  @Get('shift-crosses')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Informe de cruce de turnos del mes' })
  shiftCrosses(
    @Query('year',  ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.reportsService.shiftCrossReport(year, month);
  }
}