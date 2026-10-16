import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SecurityGuardsModule } from '../security-guards/security-guards.module';

@Module({
  imports: [SecurityGuardsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}


