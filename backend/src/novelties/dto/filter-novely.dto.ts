import { IsOptional, IsUUID, IsBoolean, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterNoveltyDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID()
  guard_id?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  post_id?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  novelty_type_id?: string;

  @ApiPropertyOptional({
    enum: ['absence', 'permit', 'suspension', 'vacation', 'license', 'accident', 'termination'],
  })
  @IsOptional()
  @IsEnum(['absence', 'permit', 'suspension', 'vacation', 'license', 'accident', 'termination'])
  category?: string;

  @ApiPropertyOptional({ description: 'true = solo novedades con soporte pendiente' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  support_pending?: boolean;

  @ApiPropertyOptional({ example: '2026-01-01' }) @IsOptional() @IsString()
  date_start?: string;

  @ApiPropertyOptional({ example: '2026-01-31' }) @IsOptional() @IsString()
  date_end?: string;
}