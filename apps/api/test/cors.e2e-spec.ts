import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Set required env vars before module initialization
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

describe('CORS (e2e)', () => {
  let app: INestApplication<App>;

  const mockPrisma = {
    db: {
      user: { findFirst: jest.fn(), create: jest.fn() },
      refreshToken: {
        findMany: jest.fn(),
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
    // CORS is configured in main.ts bootstrap; replicate it here for tests
    app.enableCors({
      origin: ['http://localhost:5173'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
      credentials: true,
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('OPTIONS from allowed origin returns CORS headers', async () => {
    const res = await request(app.getHttpServer())
      .options('/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
  });

  it('GET from allowed origin returns CORS header', async () => {
    const res = await request(app.getHttpServer())
      .get('/')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
  });

  it('GET from disallowed origin does not return permissive CORS header', async () => {
    const res = await request(app.getHttpServer())
      .get('/')
      .set('Origin', 'http://evil.com');

    expect(res.headers['access-control-allow-origin']).not.toBe(
      'http://evil.com',
    );
  });
});
