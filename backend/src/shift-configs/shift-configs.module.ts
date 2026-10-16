import { Module } from '@nestjs/common';
import { ShiftConfigsController } from './shift-configs.controller';
import { ShiftConfigsService } from './shift-configs.service';

@Module({
  controllers: [ShiftConfigsController],
  providers: [ShiftConfigsService],
  exports: [ShiftConfigsService],
})
export class ShiftConfigsModule {}


