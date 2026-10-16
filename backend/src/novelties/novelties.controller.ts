import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NoveltiesService } from './novelties.service';
import { CreateNoveltyDto } from './dto/create-novelty.dto';
import { UpdateNoveltyDto } from './dto/update-novelty.dto';
import { FilterNoveltyDto } from './dto/filter-novely.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Novedades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('novelties')
export class NoveltiesController {
  constructor(private noveltiesService: NoveltiesService) {}

  @Get('types')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Catálogo de tipos de novedad (para dropdowns)' })
  findAllTypes() {
    return this.noveltiesService.findAllTypes();
  }

  @Post()
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Registrar novedad para un vigilante' })
  create(@Body() dto: CreateNoveltyDto, @CurrentUser() user: any) {
    return this.noveltiesService.create(dto, user.id);
  }

  @Get()
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Listar novedades con filtros' })
  findAll(@Query() filters: FilterNoveltyDto) {
    return this.noveltiesService.findAll(filters);
  }

  @Get(':id')
  @Roles('admin', 'coordinator')
  findOne(@Param('id') id: string) {
    return this.noveltiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Actualizar novedad (ej: marcar soporte como presentado)' })
  update(@Param('id') id: string, @Body() dto: UpdateNoveltyDto) {
    return this.noveltiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar novedad (restaura estado de programación)' })
  remove(@Param('id') id: string) {
    return this.noveltiesService.remove(id);
  }
}


