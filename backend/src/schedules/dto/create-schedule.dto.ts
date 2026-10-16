import { IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty()
  @IsUUID()
  guard_id!: string;

  @ApiProperty()
  @IsUUID()
  shift_config_id!: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ enum: ['scheduled', 'executed', 'novedad', 'rest'] })
  @IsOptional()
  @IsEnum(['scheduled', 'executed', 'novedad', 'rest'])
  status?: 'scheduled' | 'executed' | 'novedad' | 'rest';
}


