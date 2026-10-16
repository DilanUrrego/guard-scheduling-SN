import { Module } from '@nestjs/common';
import { NoveltiesController } from './novelties.controller';
import { NoveltiesService } from './novelties.service';

@Module({
  controllers: [NoveltiesController],
  providers: [NoveltiesService],
  exports: [NoveltiesService],
})
export class NoveltiesModule {}

