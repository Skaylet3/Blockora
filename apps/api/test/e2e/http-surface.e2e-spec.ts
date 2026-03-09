import { expect, test } from '@playwright/test';
import {
  bootstrapE2eClient,
  cleanDatabase,
  closeE2eClient,
  E2eContext,
} from './helpers/e2e-app';

test.describe('HTTP Surface (e2e)', () => {
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

  test('pipes: invalid register payload returns 422', async () => {
    const res = await ctx.api.post('/auth/register', {
      data: { email: 'invalid-email', password: 'short', captchaToken: 'test' },
    });

    expect(res.status()).toBe(422);
  });

  test('guards: protected route without token returns 401', async () => {
    const res = await ctx.api.get('/blocks');

    expect(res.status()).toBe(401);
  });

  test('cors: allowed origin returns access-control header', async () => {
    const res = await ctx.api.fetch('/auth/login', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
      },
    });

    expect(res.headers()['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
  });

  test('controller route + docs response: Swagger endpoint is exposed', async () => {
    const res = await ctx.api.get('/api/docs-json');

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.paths['/auth/register']).toBeDefined();
    expect(body.paths['/blocks']).toBeDefined();
  });
});
