import { NotFoundException } from '@nestjs/common';
import { BlockStatus } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  bootstrapIntegrationServices,
  cleanDatabase,
  closeIntegrationServices,
  IntegrationServicesContext,
  uniqueEmail,
} from './helpers/integration-services';

describe('BlockService (integration)', () => {
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

  async function createUserId() {
    const user = await ctx.prisma.db.user.create({
      data: {
        email: uniqueEmail('block-int-user'),
        passwordHash: 'hash',
      },
    });
    return user.id;
  }

  it('create + findAll returns user-owned blocks and excludes DELETED', async () => {
    const userId = await createUserId();

    const first = await ctx.blockService.create(userId, {
      title: 'First',
      content: 'First content',
    });
    const second = await ctx.blockService.create(userId, {
      title: 'Second',
      content: 'Second content',
    });

    await ctx.blockService.remove(first.id, userId);

    const blocks = await ctx.blockService.findAll(userId);
    expect(blocks.length).toBe(1);
    expect(blocks[0].id).toBe(second.id);
    expect(blocks[0].status).toBe(BlockStatus.ACTIVE);
  });

  it('update changes persisted block fields', async () => {
    const userId = await createUserId();
    const created = await ctx.blockService.create(userId, {
      title: 'Original',
      content: 'Original content',
    });

    const updated = await ctx.blockService.update(created.id, userId, {
      title: 'Updated',
    });

    expect(updated.title).toBe('Updated');

    const fromDb = await ctx.prisma.db.block.findUnique({
      where: { id: created.id },
    });
    expect(fromDb?.title).toBe('Updated');
  });

  it('findOne enforces ownership boundary', async () => {
    const ownerId = await createUserId();
    const otherId = await createUserId();

    const block = await ctx.blockService.create(ownerId, {
      title: 'Private',
      content: 'Private content',
    });

    await expect(
      ctx.blockService.findOne(block.id, otherId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
