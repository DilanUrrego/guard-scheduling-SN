
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Puestos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear puesto de vigilancia' })
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @Get()
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Listar puestos (opcionalmente filtrar por cliente)' })
  @ApiQuery({ name: 'clientId', required: false })
  findAll(@Query('clientId') clientId?: string) {
    return this.postsService.findAll(clientId);
  }

  @Get(':id')
  @Roles('admin', 'coordinator')
  @ApiOperation({ summary: 'Obtener puesto con sus turnos configurados' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Desactivar puesto (soft delete)' })
  deactivate(@Param('id') id: string) {
    return this.postsService.deactivate(id);
  }
}
