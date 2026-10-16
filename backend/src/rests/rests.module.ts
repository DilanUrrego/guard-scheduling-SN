import { Module } from '@nestjs/common';
import { RestsController } from './rests.controller';
import { RestsService } from './rests.service';

@Module({
  controllers: [RestsController],
  providers: [RestsService],
  exports: [RestsService],
})
export class RestsModule {}

