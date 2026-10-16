import { Module } from '@nestjs/common';
import { SecurityGuardsController } from './security-guards.controller';
import { SecurityGuardsService } from './security-guards.service';

@Module({
  controllers: [SecurityGuardsController],
  providers: [SecurityGuardsService],
  exports: [SecurityGuardsService],
})
export class SecurityGuardsModule {}

