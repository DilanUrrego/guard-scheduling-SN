import { Module } from '@nestjs/common';
import { NoveltiesController } from './novelties.controller';
import { NoveltiesService } from './novelties.service';
import { SupportsService } from './supports.service';

@Module({
  controllers: [NoveltiesController],
  providers: [NoveltiesService, SupportsService],
  exports: [NoveltiesService],
})
export class NoveltiesModule {}

