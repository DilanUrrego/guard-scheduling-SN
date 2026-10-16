import { IsString, IsOptional, IsBoolean, IsDateString, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSecurityGuardDto {
  @ApiProperty({ example: '1035232961' })
  @IsString()
  id_number!: string;

  @ApiProperty({ example: 'Yepes Arango Hernán Darío' })
  @IsString()
  full_name!: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'vigilante@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  hire_date?: string;

  @ApiPropertyOptional({ example: false, description: 'true si es supervisor' })
  @IsOptional()
  @IsBoolean()
  is_supervisor?: boolean;
}

