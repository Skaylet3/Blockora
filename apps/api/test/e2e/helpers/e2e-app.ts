import { APIRequestContext, request } from '@playwright/test';
import { PrismaService } from '../../../src/prisma/prisma.service';

export interface E2eContext {
  api: APIRequestContext;
  prisma: PrismaService;
}

function resolveBaseUrl() {
  if (process.env.E2E_BASE_URL) return process.env.E2E_BASE_URL;
  const port = process.env.PORT ?? '3000';
  return `http://localhost:${port}`;
}

export async function bootstrapE2eClient(): Promise<E2eContext> {
  const api = await request.newContext({ baseURL: resolveBaseUrl() });
  const prisma = new PrismaService();
  await prisma.db.$connect();

  return { api, prisma };
}

export async function closeE2eClient(ctx: E2eContext) {
  await ctx.api.dispose();
  await ctx.prisma.db.$disconnect();
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
