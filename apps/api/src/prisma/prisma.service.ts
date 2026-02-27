import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type GlobalPrisma = typeof globalThis & {
  __prismaClient?: PrismaClient;
  __prismaPool?: Pool;
};

function getPrismaClient(): PrismaClient {
  const globalPrisma = globalThis as GlobalPrisma;
  if (!globalPrisma.__prismaPool) {
    globalPrisma.__prismaPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  if (!globalPrisma.__prismaClient) {
    const adapter = new PrismaPg(globalPrisma.__prismaPool);
    globalPrisma.__prismaClient = new PrismaClient({
      adapter,
    });
  }
  return globalPrisma.__prismaClient;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly db: PrismaClient;

  constructor() {
    this.db = getPrismaClient();
  }

  async onModuleInit() {
    await this.db.$connect();
  }

  async onModuleDestroy() {
    await this.db.$disconnect();
  }
}
