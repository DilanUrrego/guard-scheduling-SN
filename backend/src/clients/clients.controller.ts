import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update.client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear cliente' })
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get()
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Listar clientes activos con conteo de puestos' })
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Obtener cliente con sus puestos activos' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Desactivar cliente (soft delete)' })
  deactivate(@Param('id') id: string) {
    return this.clientsService.deactivate(id);
  }
}

