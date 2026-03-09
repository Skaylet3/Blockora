import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../../src/auth/auth.service';
import { BlockService } from '../../../src/block/block.service';
import type { AppConfig } from '../../../src/config/env';
import { PrismaService } from '../../../src/prisma/prisma.service';

export interface IntegrationServicesContext {
  prisma: PrismaService;
  authService: AuthService;
  blockService: BlockService;
}

const config: AppConfig = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET:
    process.env.JWT_SECRET ?? 'test-secret-that-is-at-least-32-chars-long!',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  PORT: Number(process.env.PORT ?? 3000),
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
  TURNSTILE_SECRET_KEY: 'test-secret',
  NODE_ENV: 'test',
};

export async function bootstrapIntegrationServices(): Promise<IntegrationServicesContext> {
  const prisma = new PrismaService();
  await prisma.db.$connect();

  const jwtService = new JwtService();
  const turnstileService = {
    verify: async () => {},
  } as unknown as import('../../../src/captcha/turnstile.service').TurnstileService;
  const authService = new AuthService(
    jwtService,
    prisma,
    turnstileService,
    config,
  );
  const blockService = new BlockService(prisma);

  return { prisma, authService, blockService };
}

export async function closeIntegrationServices(
  ctx: IntegrationServicesContext,
) {
  await ctx?.prisma?.db?.$disconnect();
}

export async function cleanDatabase(prisma: PrismaService) {
  await prisma.db.refreshToken.deleteMany();
  await prisma.db.todo.deleteMany();
  await prisma.db.note.deleteMany();
  await prisma.db.block.deleteMany();
  await prisma.db.storage.deleteMany();
  await prisma.db.user.deleteMany();
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@test.com`;
}
