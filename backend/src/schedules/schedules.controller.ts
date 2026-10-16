
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BulkCreateScheduleDto } from './dto/bulk-create-schedule.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Programación')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private schedulesService: SchedulesService) {}

  @Post()
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Asignar un turno a un vigilante en una fecha' })
  create(@Body() dto: CreateScheduleDto, @CurrentUser() user: any) {
    return this.schedulesService.create(dto, user.id);
  }

  @Post('bulk')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Asignar el mismo turno en múltiples fechas (carga masiva)' })
  bulkCreate(@Body() dto: BulkCreateScheduleDto, @CurrentUser() user: any) {
    return this.schedulesService.bulkCreate(dto, user.id);
  }

  @Get('calendar')
  @Roles('admin', 'coordinator', 'viewer')
  @ApiOperation({ summary: 'Vista calendario mensual (filtros: mes, año, puesto, vigilante)' })
  getCalendar(@Query() query: CalendarQueryDto) {
    return this.schedulesService.getCalendar(query);
  }

  @Get('guard/:guardId/monthly')
  @Roles('admin', 'coordinator', 'viewer')
  @ApiOperation({ summary: 'Programación mensual de un vigilante (con descansos)' })
  getMonthlyByGuard(
    @Param('guardId') guardId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.schedulesService.getMonthlyByGuard(guardId, +year, +month);
  }

  @Get(':id')
  @Roles('admin', 'coordinator')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Editar asignación (revalida cruces y descansos)' })
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto, @CurrentUser() user: any) {
    return this.schedulesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('admin', 'coordinator')
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}


