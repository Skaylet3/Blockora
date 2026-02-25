import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';

// Set required env vars before module initialization
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.PORT = '3000';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const mockPrisma = {
    db: {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        errorHttpStatusCode: 422,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('201 — registers a new user and returns tokens', async () => {
      mockPrisma.db.user.findFirst.mockResolvedValue(null);
      mockPrisma.db.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'new@test.com',
      });
      mockPrisma.db.refreshToken.create.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'new@test.com', password: 'password123' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('409 — returns conflict when email already registered', async () => {
      mockPrisma.db.user.findFirst.mockResolvedValue({ id: 'existing' });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'existing@test.com', password: 'password123' })
        .expect(409);
    });

    it('422 — returns validation error for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(422);
    });

    it('422 — returns validation error for short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@test.com', password: 'short' })
        .expect(422);
    });
  });

  describe('POST /auth/login', () => {
    it('200 — returns tokens for valid credentials', async () => {
      const hash = await argon2.hash('password123');
      mockPrisma.db.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        passwordHash: hash,
      });
      mockPrisma.db.refreshToken.create.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'password123' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('401 — returns unauthorized for wrong password', async () => {
      const hash = await argon2.hash('correctpassword');
      mockPrisma.db.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        passwordHash: hash,
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('200 — exchanges a valid refresh token for a new token pair', async () => {
      const rawToken = 'valid-refresh-token';
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
        email: 'user@test.com',
      });
      mockPrisma.db.refreshToken.create.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: rawToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('401 — rejects an invalid refresh token', async () => {
      mockPrisma.db.refreshToken.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('204 — logs out an authenticated user', async () => {
      const accessToken = jwtService.sign(
        { sub: 'user-1', email: 'user@test.com' },
        { secret: process.env.JWT_SECRET, expiresIn: '15m' },
      );
      mockPrisma.db.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('401 — rejects request without token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('200 — returns user identity for authenticated request', async () => {
      const accessToken = jwtService.sign(
        { sub: 'user-1', email: 'user@test.com' },
        { secret: process.env.JWT_SECRET, expiresIn: '15m' },
      );

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toEqual({ userId: 'user-1', email: 'user@test.com' });
    });

    it('401 — rejects request without token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });
});
