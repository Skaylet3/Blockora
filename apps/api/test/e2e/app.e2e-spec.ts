import { expect, test } from '@playwright/test';
import {
  bootstrapE2eClient,
  closeE2eClient,
  E2eContext,
} from './helpers/e2e-app';

test.describe('App (e2e)', () => {
  let ctx: E2eContext;

  test.beforeAll(async () => {
    ctx = await bootstrapE2eClient();
  });

  test.afterAll(async () => {
    await closeE2eClient(ctx);
  });

  test('GET / returns Hello World! from localhost app', async () => {
    const res = await ctx.api.get('/');

    expect(res.status()).toBe(200);
    expect(await res.text()).toBe('Hello World!');
  });
});
