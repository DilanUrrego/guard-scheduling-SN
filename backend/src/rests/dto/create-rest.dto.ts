import { IsUUID, IsDateString, IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRestDto {
  @ApiProperty()
  @IsUUID()
  guard_id!: string;

  @ApiProperty({ example: '2026-01-06' })
  @IsDateString()
  date_start!: string;

  @ApiProperty({ example: '2026-01-06' })
  @IsDateString()
  date_end!: string;

  @ApiPropertyOptional({ description: 'true si el descanso cae en domingo (recargo legal)' })
  @IsOptional()
  @IsBoolean()
  is_sunday?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

