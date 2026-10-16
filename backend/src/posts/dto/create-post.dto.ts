import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  @IsUUID()
  client_id!: string;

  @ApiProperty({ example: '0235001' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Urbanización Casa de Patio P.H' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Cra 45 #20-30, Medellín' })
  @IsOptional()
  @IsString()
  address?: string;
}


