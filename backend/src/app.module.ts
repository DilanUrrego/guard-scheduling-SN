import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './clients/clients.module';
import { PostsModule } from './posts/posts.module';
import { ShiftConfigsModule } from './shift-configs/shift-configs.module';
import { SecurityGuardsModule } from './security-guards/security-guards.module';
import { SchedulesModule } from './schedules/schedules.module';
import { RestsModule } from './rests/rests.module';
import { NoveltiesModule } from './novelties/novelties.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    PostsModule,
    ShiftConfigsModule,
    SecurityGuardsModule,
    RestsModule,
    SchedulesModule,
    NoveltiesModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
