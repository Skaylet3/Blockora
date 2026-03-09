import { expect, test } from '@playwright/test';
import {
  bootstrapE2eClient,
  cleanDatabase,
  closeE2eClient,
  E2eContext,
  uniqueEmail,
} from './helpers/e2e-app';

test.describe('Notes (e2e)', () => {
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
      data: { email, password: 'Password123', captchaToken: 'test' },
    });
    const { accessToken } = await res.json();
    return accessToken as string;
  }

  async function createStorage(token: string, name = 'Default') {
    const res = await ctx.api.post('/storages', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name },
    });
    return res.json() as Promise<{ id: string }>;
  }

  test('POST /notes creates a note (201)', async () => {
    const token = await registerAndGetToken(uniqueEmail('notes-e2e'));
    const storage = await createStorage(token);

    const res = await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'My Note', content: 'Some content', storageId: storage.id },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.title).toBe('My Note');
    expect(body.content).toBe('Some content');
    expect(body.storageId).toBe(storage.id);
    expect(body.id).toBeDefined();
  });

  test('POST /notes defaults content to empty string', async () => {
    const token = await registerAndGetToken(uniqueEmail('notes-e2e'));
    const storage = await createStorage(token);

    const res = await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'No Content Note', storageId: storage.id },
    });

    expect(res.status()).toBe(201);
    expect((await res.json()).content).toBe('');
  });

  test('GET /notes?storageId= returns notes filtered by storage', async () => {
    const token = await registerAndGetToken(uniqueEmail('notes-e2e'));
    const storage1 = await createStorage(token, 'Storage 1');
    const storage2 = await createStorage(token, 'Storage 2');

    await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Note in S1', storageId: storage1.id },
    });
    await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Note in S2', storageId: storage2.id },
    });

    const res = await ctx.api.get(`/notes?storageId=${storage1.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);
    const notes = await res.json();
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe('Note in S1');
  });

  test('GET /notes returns all user notes when no storageId filter', async () => {
    const token = await registerAndGetToken(uniqueEmail('notes-e2e'));
    const storage = await createStorage(token);

    await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Note 1', storageId: storage.id },
    });
    await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Note 2', storageId: storage.id },
    });

    const res = await ctx.api.get('/notes', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);
    expect(await res.json()).toHaveLength(2);
  });

  test('GET /notes/:id returns single note', async () => {
    const token = await registerAndGetToken(uniqueEmail('notes-e2e'));
    const storage = await createStorage(token);

    const createRes = await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Single Note', storageId: storage.id },
    });
    const { id } = await createRes.json();

    const res = await ctx.api.get(`/notes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);
    expect((await res.json()).id).toBe(id);
  });

  test('PATCH /notes/:id updates note fields (200)', async () => {
    const token = await registerAndGetToken(uniqueEmail('notes-e2e'));
    const storage = await createStorage(token);

    const createRes = await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Original', content: 'Old content', storageId: storage.id },
    });
    const { id } = await createRes.json();

    const patchRes = await ctx.api.patch(`/notes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Updated', content: 'New content' },
    });

    expect(patchRes.status()).toBe(200);
    const updated = await patchRes.json();
    expect(updated.title).toBe('Updated');
    expect(updated.content).toBe('New content');
  });

  test('DELETE /notes/:id removes note (204)', async () => {
    const token = await registerAndGetToken(uniqueEmail('notes-e2e'));
    const storage = await createStorage(token);

    const createRes = await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'ToDelete', storageId: storage.id },
    });
    const { id } = await createRes.json();

    const deleteRes = await ctx.api.delete(`/notes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteRes.status()).toBe(204);

    const getRes = await ctx.api.get(`/notes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getRes.status()).toBe(404);
  });

  test('GET /notes/:id returns 401 without token', async () => {
    const res = await ctx.api.get('/notes/some-id');
    expect(res.status()).toBe(401);
  });

  test('GET /notes/:id returns 404 for another user note', async () => {
    const tokenA = await registerAndGetToken(uniqueEmail('notes-e2e-a'));
    const tokenB = await registerAndGetToken(uniqueEmail('notes-e2e-b'));

    const storageA = await createStorage(tokenA);
    const createRes = await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { title: 'User A Note', storageId: storageA.id },
    });
    const { id } = await createRes.json();

    const res = await ctx.api.get(`/notes/${id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(res.status()).toBe(404);
  });

  test('PATCH /notes/:id returns 404 for another user note', async () => {
    const tokenA = await registerAndGetToken(uniqueEmail('notes-e2e-a'));
    const tokenB = await registerAndGetToken(uniqueEmail('notes-e2e-b'));

    const storageA = await createStorage(tokenA);
    const createRes = await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { title: 'Private Note', storageId: storageA.id },
    });
    const { id } = await createRes.json();

    const res = await ctx.api.patch(`/notes/${id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
      data: { title: 'Hacked' },
    });
    expect(res.status()).toBe(404);
  });

  test('POST /notes returns 422 with empty title', async () => {
    const token = await registerAndGetToken(uniqueEmail('notes-e2e'));
    const storage = await createStorage(token);

    const res = await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: '', storageId: storage.id },
    });
    expect(res.status()).toBe(422);
  });

  test('POST /notes returns 404 for foreign storageId', async () => {
    const tokenA = await registerAndGetToken(uniqueEmail('notes-e2e-a'));
    const tokenB = await registerAndGetToken(uniqueEmail('notes-e2e-b'));

    const storageA = await createStorage(tokenA);

    const res = await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${tokenB}` },
      data: { title: 'Note', storageId: storageA.id },
    });
    expect(res.status()).toBe(404);
  });

  test('GET /notes returns only current user notes (no cross-user leak)', async () => {
    const tokenA = await registerAndGetToken(uniqueEmail('notes-e2e-a'));
    const tokenB = await registerAndGetToken(uniqueEmail('notes-e2e-b'));

    const storageA = await createStorage(tokenA);
    await ctx.api.post('/notes', {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { title: 'User A Note', storageId: storageA.id },
    });

    const res = await ctx.api.get('/notes', {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(await res.json()).toEqual([]);
  });
});
