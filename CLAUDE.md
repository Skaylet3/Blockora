# turbo-app Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-25

## Active Technologies
- TypeScript 5 (target ES2023, `nodenext` modules, `strictNullChecks: true`) + NestJS 11, `@nestjs/jwt ^10.2`, `argon2 ^0.43`, `@nestjs/swagger`, `zod ^3.x`, `class-validator`, `class-transformer`, Prisma 7 (001-api-auth-swagger)
- PostgreSQL via Prisma 7 (existing schema + one migration: `token` → `tokenHash` on `RefreshToken`) (001-api-auth-swagger)

- TypeScript 5.9 (strict mode) + Playwright 1.50 (E2E), Vitest 3 + @testing-library/react 16 (component tests) (001-ui-test-coverage)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.9 (strict mode): Follow standard conventions

## Recent Changes
- 001-api-auth-swagger: Added TypeScript 5 (target ES2023, `nodenext` modules, `strictNullChecks: true`) + NestJS 11, `@nestjs/jwt ^10.2`, `argon2 ^0.43`, `@nestjs/swagger`, `zod ^3.x`, `class-validator`, `class-transformer`, Prisma 7

- 001-ui-test-coverage: Added TypeScript 5.9 (strict mode) + Playwright 1.50 (E2E), Vitest 3 + @testing-library/react 16 (component tests)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
