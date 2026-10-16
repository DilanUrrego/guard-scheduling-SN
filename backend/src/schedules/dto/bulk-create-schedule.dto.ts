import { IsUUID, IsArray, IsDateString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkCreateScheduleDto {
  @ApiProperty()
  @IsUUID()
  guard_id!: string;

  @ApiProperty()
  @IsUUID()
  shift_config_id!: string;

  @ApiProperty({
    type: [String],
    example: ['2026-01-01', '2026-01-02', '2026-01-03'],
    description: 'Lista de fechas a asignar en formato YYYY-MM-DD',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsDateString({}, { each: true })
  dates!: string[];
}


