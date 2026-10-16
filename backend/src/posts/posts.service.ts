import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePostDto) {
    const exists = await this.prisma.post.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`Ya existe un puesto con el código ${dto.code}`);

    // Verifica que el cliente exista y esté activo
    const client = await this.prisma.client.findFirst({
      where: { id: dto.client_id, is_active: true },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado o inactivo');

    return this.prisma.post.create({
      data: dto,
      include: { client: { select: { id: true, name: true, code: true } } },
    });
  }

  findAll(clientId?: string) {
    return this.prisma.post.findMany({
      where: {
        is_active: true,
        ...(clientId && { client_id: clientId }),
      },
      include: {
        client: { select: { id: true, name: true, code: true } },
        _count: { select: { shift_configs: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, code: true } },
        shift_configs: { where: { is_active: true }, orderBy: { code: 'asc' } },
      },
    });
    if (!post) throw new NotFoundException('Puesto no encontrado');
    return post;
  }

  async update(id: string, dto: UpdatePostDto) {
    await this.findOne(id);
    return this.prisma.post.update({
      where: { id },
      data: dto,
      include: { client: { select: { id: true, name: true } } },
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.post.update({
      where: { id },
      data: { is_active: false },
    });
  }
}

