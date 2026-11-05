import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export const ALLOWED_SUPPORT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_SUPPORT_BYTES = 5 * 1024 * 1024; // 5 MB

export class UploadUrlDto {
  @ApiProperty({ example: 'incapacidad.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fileName!: string;

  @ApiProperty({ example: 'application/pdf', enum: ALLOWED_SUPPORT_TYPES })
  @IsIn(ALLOWED_SUPPORT_TYPES, { message: 'Solo se permiten archivos PDF, JPG o PNG' })
  contentType!: string;

  @ApiProperty({ example: 182340, description: 'Tamaño en bytes (máx. 5 MB)' })
  @IsInt()
  @Min(1)
  @Max(MAX_SUPPORT_BYTES, { message: 'El archivo no puede superar 5 MB' })
  size!: number;
}
