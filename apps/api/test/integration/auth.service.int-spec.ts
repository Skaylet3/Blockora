import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  bootstrapIntegrationServices,
  cleanDatabase,
  closeIntegrationServices,
  IntegrationServicesContext,
  uniqueEmail,
} from './helpers/integration-services';

describe('AuthService (integration)', () => {
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

  it('register writes user + refresh token records in Postgres', async () => {
    const email = uniqueEmail('auth-int-register');

    const tokens = await ctx.authService.register({
      email,
      password: 'password123',
    });

    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    const user = await ctx.prisma.db.user.findFirst({ where: { email } });
    expect(user).toBeTruthy();

    const refreshTokens = await ctx.prisma.db.refreshToken.findMany({
      where: { userId: user!.id },
    });
    expect(refreshTokens.length).toBe(1);
    expect(refreshTokens[0].revokedAt).toBeNull();
  });

  it('register enforces business rule for duplicate email', async () => {
    const email = uniqueEmail('auth-int-duplicate');
    await ctx.authService.register({ email, password: 'password123' });

    await expect(
      ctx.authService.register({ email, password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login validates credentials and rejects wrong password', async () => {
    const email = uniqueEmail('auth-int-login');
    await ctx.authService.register({ email, password: 'password123' });

    await expect(
      ctx.authService.login({ email, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh rotates token and revokes old record', async () => {
    const email = uniqueEmail('auth-int-refresh');
    const initial = await ctx.authService.register({
      email,
      password: 'password123',
    });

    const next = await ctx.authService.refresh({
      refreshToken: initial.refreshToken,
    });

    expect(next.accessToken).toBeTruthy();
    expect(next.refreshToken).toBeTruthy();

    const user = await ctx.prisma.db.user.findFirst({ where: { email } });
    const tokens = await ctx.prisma.db.refreshToken.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: 'asc' },
    });

    expect(tokens.length).toBe(2);
    expect(tokens[0].revokedAt).not.toBeNull();
    expect(tokens[1].revokedAt).toBeNull();
  });

  it('logout revokes all active refresh tokens for the user', async () => {
    const email = uniqueEmail('auth-int-logout');
    const { refreshToken } = await ctx.authService.register({
      email,
      password: 'password123',
    });

    await ctx.authService.refresh({ refreshToken });

    const user = await ctx.prisma.db.user.findFirst({ where: { email } });
    await ctx.authService.logout(user!.id);

    const activeTokens = await ctx.prisma.db.refreshToken.findMany({
      where: { userId: user!.id, revokedAt: null },
    });
    expect(activeTokens.length).toBe(0);
  });
});
