
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterSecurityGuardDto {
  @ApiPropertyOptional({ description: 'Buscar por nombre o cédula' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado activo/inactivo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar solo supervisores' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_supervisor?: boolean;
}