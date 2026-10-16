import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { RestsModule } from '../rests/rests.module';
import { ShiftConfigsModule } from '../shift-configs/shift-configs.module';

@Module({
  imports: [RestsModule, ShiftConfigsModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}

