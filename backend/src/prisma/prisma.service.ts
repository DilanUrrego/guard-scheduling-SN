import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

    constructor() {
    // 1. Configura el pool de conexiones de pg
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // 2. Inicializa el adaptador de Prisma para PostgreSQL
    const adapter = new PrismaPg(pool);

    // 3. Pasa el adaptador al constructor de PrismaClient
    super({ adapter });
  }


  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}