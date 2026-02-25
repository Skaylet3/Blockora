import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BlockStatus } from '@prisma/client';

// Set required env vars before module initialization
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

describe('Blocks (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let accessToken: string;

  const sampleBlock = {
    id: 'block-1',
    userId: 'user-1',
    title: 'Test Block',
    content: 'Block content',
    type: 'NOTE',
    status: BlockStatus.ACTIVE,
    visibility: 'PRIVATE',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archivedAt: null,
  };

  const mockPrisma = {
    db: {
      user: { findFirst: jest.fn(), create: jest.fn() },
      block: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
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
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    accessToken = jwtService.sign(
      { sub: 'user-1', email: 'user@test.com' },
      { secret: process.env.JWT_SECRET, expiresIn: '15m' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /blocks', () => {
    it('200 — returns array of blocks for authenticated user', async () => {
      mockPrisma.db.block.findMany.mockResolvedValue([sampleBlock]);

      const res = await request(app.getHttpServer())
        .get('/blocks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('id', 'block-1');
    });

    it('401 — returns unauthorized without auth token', async () => {
      await request(app.getHttpServer()).get('/blocks').expect(401);
    });
  });

  describe('GET /blocks/:id', () => {
    it('200 — returns a single block', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue(sampleBlock);

      const res = await request(app.getHttpServer())
        .get('/blocks/block-1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', 'block-1');
    });

    it('404 — returns not found for missing block', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/blocks/missing-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('POST /blocks', () => {
    it('201 — creates a new block', async () => {
      mockPrisma.db.block.create.mockResolvedValue(sampleBlock);

      const res = await request(app.getHttpServer())
        .post('/blocks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test Block', content: 'Block content' })
        .expect(201);

      expect(res.body).toHaveProperty('id', 'block-1');
    });

    it('422 — returns validation error for missing title', async () => {
      await request(app.getHttpServer())
        .post('/blocks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'No title' })
        .expect(422);
    });

    it('401 — returns unauthorized without auth token', async () => {
      await request(app.getHttpServer())
        .post('/blocks')
        .send({ title: 'Test', content: 'Test' })
        .expect(401);
    });
  });

  describe('PATCH /blocks/:id', () => {
    it('200 — updates a block', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue(sampleBlock);
      const updated = { ...sampleBlock, title: 'Updated Title' };
      mockPrisma.db.block.update.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch('/blocks/block-1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(res.body).toHaveProperty('title', 'Updated Title');
    });
  });

  describe('DELETE /blocks/:id', () => {
    it('200 — soft-deletes a block', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue(sampleBlock);
      const deleted = { ...sampleBlock, status: BlockStatus.DELETED };
      mockPrisma.db.block.update.mockResolvedValue(deleted);

      const res = await request(app.getHttpServer())
        .delete('/blocks/block-1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.status).toBe(BlockStatus.DELETED);
    });
  });
});
