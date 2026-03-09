import { expect, test } from '@playwright/test';
import {
  bootstrapE2eClient,
  cleanDatabase,
  closeE2eClient,
  E2eContext,
  uniqueEmail,
} from './helpers/e2e-app';

test.describe('Users (e2e)', () => {
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

  test('PATCH /users/me updates displayName and GET /auth/me reflects the change', async () => {
    const email = uniqueEmail('e2e-users');

    const registerRes = await ctx.api.post('/auth/register', {
      data: { email, password: 'password123', captchaToken: 'test' },
    });
    expect(registerRes.status()).toBe(201);
    const { accessToken } = await registerRes.json();

    const patchRes = await ctx.api.patch('/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { displayName: 'Alice' },
    });
    expect(patchRes.status()).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody).toMatchObject({ email, displayName: 'Alice' });
    expect(patchBody.userId).toBeDefined();

    const meRes = await ctx.api.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(meRes.status()).toBe(200);
    expect(await meRes.json()).toMatchObject({ email, displayName: 'Alice' });
  });

  test('PATCH /users/me without token returns 401', async () => {
    const res = await ctx.api.patch('/users/me', {
      data: { displayName: 'Alice' },
    });
    expect(res.status()).toBe(401);
  });

  test('PATCH /users/me with displayName exceeding 100 chars returns 422', async () => {
    const email = uniqueEmail('e2e-users-validation');
    const registerRes = await ctx.api.post('/auth/register', {
      data: { email, password: 'password123', captchaToken: 'test' },
    });
    const { accessToken } = await registerRes.json();

    const res = await ctx.api.patch('/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { displayName: 'a'.repeat(101) },
    });
    expect(res.status()).toBe(422);
  });
});
