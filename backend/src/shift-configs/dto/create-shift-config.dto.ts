import { IsString, IsUUID, IsBoolean, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShiftConfigDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  @IsUUID()
  post_id!: string;

  @ApiProperty({ example: '214', description: 'Código único del turno' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Descanso Laborado 05 a 17' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '05:00' })
  @IsString()
  start_time!: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  end_time!: string;

  @ApiPropertyOptional({
    example: '1111110',
    description: '7 caracteres, cada uno es un día L-M-W-J-V-S-D. 1=activo, 0=inactivo',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[01]{7}$/, { message: 'active_days debe ser 7 caracteres de 0 o 1 (ej: 1111110)' })
  active_days?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_worked_rest?: boolean;

  @ApiPropertyOptional({ example: '#4A90D9' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color_hex debe ser un color hexadecimal válido' })
  color_hex?: string;
}

