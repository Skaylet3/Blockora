import { expect, test } from '@playwright/test';
import {
  bootstrapE2eClient,
  cleanDatabase,
  closeE2eClient,
  E2eContext,
  uniqueEmail,
} from './helpers/e2e-app';

test.describe('Storages (e2e)', () => {
  let ctx: E2eContext;

  test.beforeAll(async () => {
    ctx = await bootstrapE2eClient();
  });

  test.beforeEach(async () => {
    await cleanDatabase(ctx.prisma);
  });

  test.afterAll(async () => {
    await closeE2eClient(ctx);
  });

  async function registerAndGetToken(email: string) {
    const res = await ctx.api.post('/auth/register', {
      data: { email, password: 'password123', captchaToken: 'test' },
    });
    const { accessToken } = await res.json();
    return accessToken as string;
  }

  test('POST /storages creates a root-level storage (201)', async () => {
    const token = await registerAndGetToken(uniqueEmail('storage-e2e'));

    const res = await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Work' },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Work');
    expect(body.parentId).toBeNull();
    expect(body.id).toBeDefined();
  });

  test('POST /storages creates a nested child storage', async () => {
    const token = await registerAndGetToken(uniqueEmail('storage-e2e'));

    const rootRes = await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Root' },
    });
    const root = await rootRes.json();

    const childRes = await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Child', parentId: root.id },
    });

    expect(childRes.status()).toBe(201);
    const child = await childRes.json();
    expect(child.parentId).toBe(root.id);
  });

  test('GET /storages returns flat list with parentId refs', async () => {
    const token = await registerAndGetToken(uniqueEmail('storage-e2e'));

    const rootRes = await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Root' },
    });
    const root = await rootRes.json();

    await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Child', parentId: root.id },
    });

    const listRes = await ctx.api.get('/storages', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(list).toHaveLength(2);
    const rootItem = list.find((s: { id: string }) => s.id === root.id);
    expect(rootItem.parentId).toBeNull();
    const childItem = list.find(
      (s: { parentId: string | null }) => s.parentId === root.id,
    );
    expect(childItem).toBeDefined();
  });

  test('GET /storages returns empty array when user has no storages', async () => {
    const token = await registerAndGetToken(uniqueEmail('storage-e2e'));

    const res = await ctx.api.get('/storages', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test('DELETE /storages/:id removes storage and returns 204', async () => {
    const token = await registerAndGetToken(uniqueEmail('storage-e2e'));

    const createRes = await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'ToDelete' },
    });
    const { id } = await createRes.json();

    const deleteRes = await ctx.api.delete(`/storages/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(deleteRes.status()).toBe(204);

    const listRes = await ctx.api.get('/storages', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(await listRes.json()).toEqual([]);
  });

  test('DELETE /storages/:id returns 404 for another user storage', async () => {
    const tokenA = await registerAndGetToken(uniqueEmail('storage-e2e-a'));
    const tokenB = await registerAndGetToken(uniqueEmail('storage-e2e-b'));

    const createRes = await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { name: 'User A Storage' },
    });
    const { id } = await createRes.json();

    const deleteRes = await ctx.api.delete(`/storages/${id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    expect(deleteRes.status()).toBe(404);
  });

  test('POST /storages returns 401 without token', async () => {
    const res = await ctx.api.post('/storages', {
      data: { name: 'NoAuth' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /storages returns 422 with empty name', async () => {
    const token = await registerAndGetToken(uniqueEmail('storage-e2e'));

    const res = await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: '' },
    });

    expect(res.status()).toBe(422);
  });

  test('GET /storages returns only current user storages (no cross-user leak)', async () => {
    const tokenA = await registerAndGetToken(uniqueEmail('storage-e2e-a'));
    const tokenB = await registerAndGetToken(uniqueEmail('storage-e2e-b'));

    await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { name: 'User A Storage' },
    });

    const listRes = await ctx.api.get('/storages', {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    expect(await listRes.json()).toEqual([]);
  });

  test('full tree retrieval - 3-level hierarchy flat list (US3)', async () => {
    const token = await registerAndGetToken(uniqueEmail('storage-e2e'));

    const rootRes = await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Root' },
    });
    const root = await rootRes.json();

    const childRes = await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Child', parentId: root.id },
    });
    const child = await childRes.json();

    await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Grandchild', parentId: child.id },
    });

    const listRes = await ctx.api.get('/storages', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = await listRes.json();

    expect(list).toHaveLength(3);
    const ids = list.map((s: { id: string }) => s.id);
    expect(ids).toContain(root.id);
    expect(ids).toContain(child.id);
  });
});
