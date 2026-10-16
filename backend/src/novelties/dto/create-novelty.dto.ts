import {
  IsUUID, IsDateString, IsBoolean, IsOptional, IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoveltyDto {
  @ApiProperty()
  @IsUUID()
  guard_id!: string;

  @ApiProperty()
  @IsUUID()
  novelty_type_id!: string;

  @ApiProperty()
  @IsUUID()
  post_id!: string;

  @ApiPropertyOptional({ description: 'ID de la programación afectada (celda del calendario)' })
  @IsOptional()
  @IsUUID()
  schedule_id?: string;

  @ApiProperty({ example: '2026-01-10' })
  @IsDateString()
  date_start!: string;

  @ApiPropertyOptional({ example: '2026-01-15', description: 'null si es un solo día' })
  @IsOptional()
  @IsDateString()
  date_end?: string;

  @ApiPropertyOptional({ description: '¿El vigilante ya presentó el soporte documental?' })
  @IsOptional()
  @IsBoolean()
  support_submitted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}


