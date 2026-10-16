import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { id_number: dto.id_number }] },
    });
    if (exists) throw new ConflictException('Ya existe un usuario con ese email o cédula');

    const password_hash = await bcrypt.hash(dto.password, 12);
    const { password, ...data } = dto;

    return this.prisma.user.create({
      data: { ...data, password_hash },
      select: this.safeFields(),
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      where: { is_active: true },
      select: this.safeFields(),
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.safeFields(),
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string) {
    // Incluye password_hash — solo para uso interno de AuthService
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // Verifica existencia
    const data: any = { ...dto };
    if (dto.password) {
      data.password_hash = await bcrypt.hash(dto.password, 12);
      delete data.password;
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: this.safeFields(),
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { is_active: false },
      select: this.safeFields(),
    });
  }

  // Nunca exponer password_hash en respuestas HTTP
  private safeFields() {
    return {
      id: true, id_number: true, name: true,
      email: true, role: true, is_active: true, created_at: true,
    };
  }
}
