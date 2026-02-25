import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Set required env vars before module initialization
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

describe('Swagger (e2e)', () => {
  let app: INestApplication<App>;

  const mockPrisma = {
    db: {},
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

    // Set up Swagger (mirrors main.ts setup)
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Blockora API')
      .setDescription(
        'REST API for Blockora — authentication and block management',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          in: 'header',
        },
        'access-token',
      )
      .addTag('auth', 'Registration, login, token refresh, and logout')
      .addTag('blocks', 'CRUD operations for user-owned content blocks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/docs returns 200 HTML with Swagger UI', async () => {
    const res = await request(app.getHttpServer()).get('/api/docs').expect(200);

    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('GET /api/docs-json returns valid OpenAPI document', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    expect(res.body).toHaveProperty('openapi');
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body).toHaveProperty('paths');
  });

  it('OpenAPI document includes auth endpoints', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    const paths = Object.keys(res.body.paths);
    expect(paths).toContain('/auth/register');
    expect(paths).toContain('/auth/login');
    expect(paths).toContain('/auth/refresh');
    expect(paths).toContain('/auth/logout');
    expect(paths).toContain('/auth/me');
  });

  it('OpenAPI document includes block endpoints', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    const paths = Object.keys(res.body.paths);
    expect(paths).toContain('/blocks');
    expect(paths).toContain('/blocks/{id}');
  });

  it('OpenAPI document includes access-token security scheme', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    expect(
      res.body.components?.securitySchemes?.['access-token'],
    ).toBeDefined();
  });
});
