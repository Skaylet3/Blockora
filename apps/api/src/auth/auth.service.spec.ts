import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { TurnstileService } from '../captcha/turnstile.service';
import { APP_CONFIG } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

const mockConfig = {
  JWT_SECRET: 'test-secret-that-is-at-least-32-chars-long!',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  PORT: 3000,
  CORS_ORIGINS: ['http://localhost:5173'],
  NODE_ENV: 'test' as const,
};

const mockPrisma = {
  db: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
};

const mockJwtService = {
  sign: vi.fn(() => 'test-access-token'),
  verify: vi.fn(),
};

const mockTurnstile = { verify: vi.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: APP_CONFIG, useValue: mockConfig },
        { provide: TurnstileService, useValue: mockTurnstile },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockTurnstile.verify.mockReset();
    mockJwtService.sign.mockReturnValue('test-access-token');
  });

  describe('register', () => {
    it('should create a user and return tokens', async () => {
      mockPrisma.db.user.findFirst.mockResolvedValue(null);
      mockPrisma.db.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });
      mockPrisma.db.refreshToken.create.mockResolvedValue({});

      const result = await service.register({
        email: 'test@test.com',
        password: 'password123',
        captchaToken: 'test-token',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma.db.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'test@test.com' }),
        }),
      );
    });

    it('should pass displayName to user.create when provided', async () => {
      mockPrisma.db.user.findFirst.mockResolvedValue(null);
      mockPrisma.db.user.create.mockResolvedValue({
        id: 'user-2',
        email: 'alice@test.com',
      });
      mockPrisma.db.refreshToken.create.mockResolvedValue({});

      await service.register({
        email: 'alice@test.com',
        password: 'password123',
        displayName: 'Alice',
        captchaToken: 'test-token',
      });

      expect(mockPrisma.db.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'alice@test.com',
            displayName: 'Alice',
          }),
        }),
      );
    });

    it('should throw ConflictException if email already registered', async () => {
      mockPrisma.db.user.findFirst.mockResolvedValue({
        id: 'existing',
        email: 'test@test.com',
      });

      await expect(
        service.register({ email: 'test@test.com', password: 'password123', captchaToken: 'test-token' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when CAPTCHA fails', async () => {
      mockTurnstile.verify.mockRejectedValue(new ForbiddenException('CAPTCHA verification failed'));

      await expect(
        service.register({ email: 'test@test.com', password: 'password123', captchaToken: 'bad-token' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const hash = await argon2.hash('password123');
      mockPrisma.db.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hash,
      });
      mockPrisma.db.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
        captchaToken: 'test-token',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await argon2.hash('correctpassword');
      mockPrisma.db.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hash,
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrongpassword', captchaToken: 'test-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.db.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@test.com', password: 'password123', captchaToken: 'test-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when CAPTCHA fails', async () => {
      mockTurnstile.verify.mockRejectedValue(new ForbiddenException('CAPTCHA verification failed'));

      await expect(
        service.login({ email: 'test@test.com', password: 'password123', captchaToken: 'bad-token' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('refresh', () => {
    it('should issue new tokens and revoke old refresh token', async () => {
      const rawToken = 'raw-token-value';
      const hash = await argon2.hash(rawToken);
      mockPrisma.db.refreshToken.findMany.mockResolvedValue([
        {
          id: 'rt-1',
          userId: 'user-1',
          tokenHash: hash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revokedAt: null,
        },
      ]);
      mockPrisma.db.refreshToken.update.mockResolvedValue({});
      mockPrisma.db.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });
      mockPrisma.db.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh({ refreshToken: rawToken, captchaToken: 'test-token' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma.db.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-1' },
          data: { revokedAt: expect.any(Date) },
        }),
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockPrisma.db.refreshToken.findMany.mockResolvedValue([]);

      await expect(
        service.refresh({ refreshToken: 'invalid-token', captchaToken: 'test-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user no longer exists after token match', async () => {
      const rawToken = 'raw-token-value';
      const hash = await argon2.hash(rawToken);
      mockPrisma.db.refreshToken.findMany.mockResolvedValue([
        {
          id: 'rt-1',
          userId: 'deleted-user',
          tokenHash: hash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revokedAt: null,
        },
      ]);
      mockPrisma.db.refreshToken.update.mockResolvedValue({});
      mockPrisma.db.user.findFirst.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: rawToken, captchaToken: 'test-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not match when no active token hashes match the provided token', async () => {
      const otherHash = await argon2.hash('different-token');
      mockPrisma.db.refreshToken.findMany.mockResolvedValue([
        {
          id: 'rt-1',
          userId: 'user-1',
          tokenHash: otherHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revokedAt: null,
        },
      ]);

      await expect(
        service.refresh({ refreshToken: 'non-matching-token', captchaToken: 'test-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when CAPTCHA fails', async () => {
      mockTurnstile.verify.mockRejectedValue(new ForbiddenException('CAPTCHA verification failed'));

      await expect(
        service.refresh({ refreshToken: 'some-token', captchaToken: 'bad-token' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('should revoke all active refresh tokens for the user', async () => {
      mockPrisma.db.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await service.logout('user-1');

      expect(mockPrisma.db.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should return payload for valid token', () => {
      const payload = { sub: 'user-1', email: 'test@test.com' };
      mockJwtService.verify.mockReturnValue(payload);

      const result = service.verifyAccessToken('valid-token');
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException for invalid token', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      expect(() => service.verifyAccessToken('bad-token')).toThrow(
        UnauthorizedException,
      );
    });
  });
});
