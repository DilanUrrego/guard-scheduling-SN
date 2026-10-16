import { IsEmail, IsEnum, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  id_number!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'juan@claveseguridad.com' })
  @IsEmail({}, { message: 'El email no es válido' })
  email!: string;

  @ApiProperty({ example: 'Seguro123!' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'La contraseña debe tener al menos una mayúscula y un número',
  })
  password!: string;

  @ApiProperty({ enum: ['admin', 'coordinator', 'viewer'] })
  @IsEnum(['admin', 'coordinator', 'viewer'], { message: 'Rol inválido' })
  role!: 'admin' | 'coordinator' | 'viewer';
}

