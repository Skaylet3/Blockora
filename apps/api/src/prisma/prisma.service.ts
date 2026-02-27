import { Injectable, OnModuleDestroy } from '@nestjs/common';
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
      connectionTimeoutMillis: 5000,
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
export class PrismaService implements OnModuleDestroy {
  readonly db: PrismaClient;

  constructor() {
    this.db = getPrismaClient();
  }

  async onModuleDestroy() {
    await this.db.$disconnect();
  }
}
