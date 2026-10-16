import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SecurityGuardsService } from './security-guards.service';
import { CreateSecurityGuardDto } from './dto/create-security-guard.dto';
import { UpdateSecurityGuardDto } from './dto/update-security-guard.dto';
import { FilterSecurityGuardDto } from './dto/filter-security-guard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Vigilantes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('security-guards')
export class SecurityGuardsController {
  constructor(private securityGuardsService: SecurityGuardsService) {}

  @Post()
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Registrar vigilante' })
  create(@Body() dto: CreateSecurityGuardDto) {
    return this.securityGuardsService.create(dto);
  }

  @Get()
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Listar vigilantes con filtros opcionales' })
  findAll(@Query() filters: FilterSecurityGuardDto) {
    return this.securityGuardsService.findAll(filters);
  }

  @Get('without-schedule')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Vigilantes activos sin turno asignado en un rango de fechas' })
  @ApiQuery({ name: 'dateStart', example: '2026-01-01' })
  @ApiQuery({ name: 'dateEnd', example: '2026-01-31' })
  findWithoutSchedule(
    @Query('dateStart') dateStart: string,
    @Query('dateEnd') dateEnd: string,
  ) {
    return this.securityGuardsService.findWithoutSchedule(
      new Date(dateStart),
      new Date(dateEnd),
    );
  }

  @Get(':id')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Obtener vigilante con novedades recientes y descansos futuros' })
  findOne(@Param('id') id: string) {
    return this.securityGuardsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'coordinator')
  update(@Param('id') id: string, @Body() dto: UpdateSecurityGuardDto) {
    return this.securityGuardsService.update(id, dto);
  }

  @Patch(':id/terminate')
  @Roles('admin')
  @ApiOperation({ summary: 'Retirar vigilante (soft delete con fecha de retiro)' })
  terminate(
    @Param('id') id: string,
    @Body('termination_date') terminationDate?: string,
  ) {
    return this.securityGuardsService.terminate(
      id,
      terminationDate ? new Date(terminationDate) : undefined,
    );
  }

  @Patch(':id/reactivate')
  @Roles('admin')
  @ApiOperation({ summary: 'Reactivar vigilante retirado' })
  reactivate(@Param('id') id: string) {
    return this.securityGuardsService.reactivate(id);
  }
}


