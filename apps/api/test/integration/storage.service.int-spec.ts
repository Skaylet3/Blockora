import { NotFoundException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  bootstrapIntegrationServices,
  cleanDatabase,
  closeIntegrationServices,
  IntegrationServicesContext,
  uniqueEmail,
} from './helpers/integration-services';
import { StorageService } from '../../src/storage/storage.service';

describe('StorageService (integration)', () => {
  let ctx: IntegrationServicesContext;
  let storageService: StorageService;

  beforeAll(async () => {
    ctx = await bootstrapIntegrationServices();
    storageService = new StorageService(ctx.prisma);
  });

  beforeEach(async () => {
    await cleanDatabase(ctx.prisma);
  });

  afterAll(async () => {
    await closeIntegrationServices(ctx);
  });

  async function createUserId() {
    const user = await ctx.prisma.db.user.create({
      data: { email: uniqueEmail('storage-int'), passwordHash: 'hash' },
    });
    return user.id;
  }

  it('create + findAll returns only user-owned storages', async () => {
    const userId = await createUserId();
    const otherId = await createUserId();

    await storageService.create(userId, { name: 'Mine' });
    await storageService.create(otherId, { name: 'Theirs' });

    const storages = await storageService.findAll(userId);
    expect(storages).toHaveLength(1);
    expect(storages[0].name).toBe('Mine');
    expect(storages[0].userId).toBe(userId);
  });

  it('creates nested child storage with correct parentId', async () => {
    const userId = await createUserId();

    const root = await storageService.create(userId, { name: 'Root' });
    const child = await storageService.create(userId, {
      name: 'Child',
      parentId: root.id,
    });

    expect(child.parentId).toBe(root.id);

    const all = await storageService.findAll(userId);
    expect(all).toHaveLength(2);
  });

  it('throws NotFoundException when creating child under foreign storage', async () => {
    const userId = await createUserId();
    const otherId = await createUserId();

    const foreignStorage = await storageService.create(otherId, {
      name: 'Foreign',
    });

    await expect(
      storageService.create(userId, {
        name: 'Bad child',
        parentId: foreignStorage.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delete cascades to all descendant storages and their notes', async () => {
    const userId = await createUserId();

    const root = await storageService.create(userId, { name: 'Root' });
    const child = await storageService.create(userId, {
      name: 'Child',
      parentId: root.id,
    });
    const grandchild = await storageService.create(userId, {
      name: 'Grandchild',
      parentId: child.id,
    });

    // create a note inside grandchild
    await ctx.prisma.db.note.create({
      data: {
        title: 'Deep note',
        userId,
        storageId: grandchild.id,
      },
    });

    await storageService.remove(userId, root.id);

    const remainingStorages = await ctx.prisma.db.storage.findMany({
      where: { userId },
    });
    expect(remainingStorages).toHaveLength(0);

    const remainingNotes = await ctx.prisma.db.note.findMany({
      where: { userId },
    });
    expect(remainingNotes).toHaveLength(0);
  });

  it('delete throws NotFoundException for foreign storage', async () => {
    const userId = await createUserId();
    const otherId = await createUserId();

    const foreign = await storageService.create(otherId, { name: 'Foreign' });

    await expect(
      storageService.remove(userId, foreign.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('multi-level hierarchy returns correct parentId references (US3)', async () => {
    const userId = await createUserId();

    const root = await storageService.create(userId, { name: 'Root' });
    const child = await storageService.create(userId, {
      name: 'Child',
      parentId: root.id,
    });
    const grandchild = await storageService.create(userId, {
      name: 'Grandchild',
      parentId: child.id,
    });

    const all = await storageService.findAll(userId);
    expect(all).toHaveLength(3);

    const rootItem = all.find((s) => s.id === root.id)!;
    const childItem = all.find((s) => s.id === child.id)!;
    const grandchildItem = all.find((s) => s.id === grandchild.id)!;

    expect(rootItem.parentId).toBeNull();
    expect(childItem.parentId).toBe(root.id);
    expect(grandchildItem.parentId).toBe(child.id);
  });
});
