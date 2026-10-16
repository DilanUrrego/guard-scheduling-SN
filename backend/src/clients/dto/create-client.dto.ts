import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ example: 'CLI001' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Unidad Residencial El Prado' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '900123456-7' })
  @IsString()
  @Matches(/^\d{6,10}-\d$/, { message: 'El NIT debe tener formato 000000000-0' })
  nit!: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Calle 50 #30-20, Medellín' })
  @IsOptional()
  @IsString()
  address?: string;
}


