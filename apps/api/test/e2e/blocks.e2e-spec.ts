import { expect, test } from '@playwright/test';
import {
  bootstrapE2eClient,
  cleanDatabase,
  closeE2eClient,
  E2eContext,
  uniqueEmail,
} from './helpers/e2e-app';

test.describe('Blocks (e2e)', () => {
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

  test('create, update, delete block via real localhost HTTP API', async () => {
    const email = uniqueEmail('e2e-block');
    const registerRes = await ctx.api.post('/auth/register', {
      data: { email, password: 'password123', captchaToken: 'test' },
    });
    const { accessToken } = await registerRes.json();

    const createRes = await ctx.api.post('/blocks', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: 'E2E Block', content: 'Initial content' },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    const updateRes = await ctx.api.patch(`/blocks/${created.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: 'Updated E2E Block' },
    });
    expect(updateRes.status()).toBe(200);

    const deleteRes = await ctx.api.delete(`/blocks/${created.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(deleteRes.status()).toBe(200);
    expect(await deleteRes.json()).toMatchObject({ status: 'DELETED' });
  });
});
