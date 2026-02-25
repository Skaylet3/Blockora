import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { validateEnv } from './config/env';

function initializeEnv() {
  const candidates = [
    resolve(process.cwd(), 'apps/api/.env'),
    resolve(process.cwd(), '.env'),
  ];

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      loadDotenv({ path: envPath });
      break;
    }
  }
}

initializeEnv();
const config = validateEnv();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );

  app.enableCors({
    origin: config.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  });

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

  await app.listen(config.PORT);
}
void bootstrap();
