import { Prisma } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  bootstrapIntegrationServices,
  cleanDatabase,
  closeIntegrationServices,
  IntegrationServicesContext,
  uniqueEmail,
} from './helpers/integration-services';

describe('Database (integration)', () => {
  let ctx: IntegrationServicesContext;

  beforeAll(async () => {
    ctx = await bootstrapIntegrationServices();
  });

  beforeEach(async () => {
    await cleanDatabase(ctx.prisma);
  });

  afterAll(async () => {
    await closeIntegrationServices(ctx);
  });

  it('enforces unique email constraint at DB level', async () => {
    const email = uniqueEmail('db-unique');
    await ctx.prisma.db.user.create({
      data: { email, passwordHash: 'hash' },
    });

    await expect(
      ctx.prisma.db.user.create({ data: { email, passwordHash: 'hash-2' } }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rolls back a failed transaction (atomicity)', async () => {
    const email = uniqueEmail('db-tx');

    await expect(
      ctx.prisma.db.$transaction(async (tx) => {
        await tx.user.create({ data: { email, passwordHash: 'hash' } });
        await tx.user.create({
          data: { email, passwordHash: 'hash-duplicate' },
        });
      }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);

    const users = await ctx.prisma.db.user.findMany({ where: { email } });
    expect(users.length).toBe(0);
  });

  it('enforces foreign key constraint on blocks.userId', async () => {
    await expect(
      ctx.prisma.db.block.create({
        data: {
          userId: '11111111-1111-1111-1111-111111111111',
          title: 'Orphan',
          content: 'Should fail',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2003' });
  });
});
