import { expect, test } from '@playwright/test';
import {
  bootstrapE2eClient,
  cleanDatabase,
  closeE2eClient,
  E2eContext,
  uniqueEmail,
} from './helpers/e2e-app';

test.describe('Auth (e2e)', () => {
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

  test('full auth flow hits real localhost endpoints and persists to test DB', async () => {
    const email = uniqueEmail('e2e-auth');

    const registerRes = await ctx.api.post('/auth/register', {
      data: { email, password: 'password123', captchaToken: 'test' },
    });
    expect(registerRes.status()).toBe(201);
    const registerBody = await registerRes.json();

    const loginRes = await ctx.api.post('/auth/login', {
      data: { email, password: 'password123', captchaToken: 'test' },
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();

    const meRes = await ctx.api.get('/auth/me', {
      headers: { Authorization: `Bearer ${loginBody.accessToken}` },
    });
    expect(meRes.status()).toBe(200);
    expect(await meRes.json()).toMatchObject({ email });

    const logoutRes = await ctx.api.post('/auth/logout', {
      headers: { Authorization: `Bearer ${loginBody.accessToken}` },
    });
    expect(logoutRes.status()).toBe(204);

    const refreshAfterLogoutRes = await ctx.api.post('/auth/refresh', {
      data: { refreshToken: registerBody.refreshToken, captchaToken: 'test' },
    });
    expect(refreshAfterLogoutRes.status()).toBe(401);
  });
});
