import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RestsService } from './rests.service';
import { CreateRestDto } from './dto/create-rest.dto';
import { UpdateRestDto } from './dto/update-rest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Descansos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rests')
export class RestsController {
  constructor(private restsService: RestsService) {}

  @Post()
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Programar descanso para un vigilante' })
  create(@Body() dto: CreateRestDto, @CurrentUser() user: any) {
    return this.restsService.create(dto, user.id);
  }

  @Get()
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Listar descansos (opcionalmente filtrar por vigilante)' })
  @ApiQuery({ name: 'guardId', required: false })
  findAll(@Query('guardId') guardId?: string) {
    return this.restsService.findAll(guardId);
  }

  @Get(':id')
  @Roles('admin', 'coordinator')
  findOne(@Param('id') id: string) {
    return this.restsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'coordinator')
  update(@Param('id') id: string, @Body() dto: UpdateRestDto) {
    return this.restsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar descanso programado' })
  remove(@Param('id') id: string) {
    return this.restsService.remove(id);
  }
}


