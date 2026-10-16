import { IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  shift_config_id?: string;

  @ApiPropertyOptional({ example: '2026-01-20' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: ['scheduled', 'executed', 'novedad', 'rest'] })
  @IsOptional()
  @IsEnum(['scheduled', 'executed', 'novedad', 'rest'])
  status?: 'scheduled' | 'executed' | 'novedad' | 'rest';
}


