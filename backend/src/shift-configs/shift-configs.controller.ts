import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ShiftConfigsService } from './shift-configs.service';
import { CreateShiftConfigDto } from './dto/create-shift-config.dto';
import { UpdateShiftConfigDto } from './dto/update-shift-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Turnos (Configuración)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shift-configs')
export class ShiftConfigsController {
  constructor(private shiftConfigsService: ShiftConfigsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear configuración de turno' })
  create(@Body() dto: CreateShiftConfigDto) {
    return this.shiftConfigsService.create(dto);
  }

  @Get()
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Listar turnos (opcionalmente filtrar por puesto)' })
  @ApiQuery({ name: 'postId', required: false })
  findAll(@Query('postId') postId?: string) {
    return this.shiftConfigsService.findAll(postId);
  }

  @Get(':id')
  @Roles('admin', 'coordinator')
  findOne(@Param('id') id: string) {
    return this.shiftConfigsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar turno (recalcula crosses_midnight automáticamente)' })
  update(@Param('id') id: string, @Body() dto: UpdateShiftConfigDto) {
    return this.shiftConfigsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  deactivate(@Param('id') id: string) {
    return this.shiftConfigsService.deactivate(id);
  }
}
