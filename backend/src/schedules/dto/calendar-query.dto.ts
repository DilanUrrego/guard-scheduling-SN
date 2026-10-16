import { IsInt, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalendarQueryDto {
  @ApiProperty({ example: 2026 })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  year!: number;

  @ApiProperty({ example: 1, description: '1 = enero, 12 = diciembre' })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1) @Max(12)
  month!: number;

  @ApiPropertyOptional({ description: 'Filtrar por puesto' })
  @IsOptional()
  @IsUUID()
  post_id?: string;

  @ApiPropertyOptional({ description: 'Filtrar por vigilante' })
  @IsOptional()
  @IsUUID()
  guard_id?: string;
}