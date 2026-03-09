# turbo-app Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-25

## Active Technologies
- TypeScript 5 (target ES2023, `nodenext` modules, `strictNullChecks: true`) + NestJS 11, `@nestjs/jwt ^10.2`, `argon2 ^0.43`, `@nestjs/swagger`, `zod ^3.x`, `class-validator`, `class-transformer`, Prisma 7 (001-api-auth-swagger)
- PostgreSQL via Prisma 7 (existing schema + one migration: `token` → `tokenHash` on `RefreshToken`) (001-api-auth-swagger)
- TypeScript 5 (strict mode) — `apps/web` (Next.js 16, React 19) + Next.js 16.1.6, React 19, Tailwind CSS v4, Sonner (toasts), Lucide React, Radix UI primitives — no external HTTP library (uses native `fetch`) (001-frontend-api-integration)
- `localStorage` for access + refresh tokens; session cookie (`blockora-session=1`) retained for SSR route-guard only (001-frontend-api-integration)
- TypeScript 5 (strict mode) — both apps (003-profile-update)
- PostgreSQL via Prisma — no migration needed (`displayName String?` already exists) (003-profile-update)
- TypeScript 5.9 (strict mode, ES2023 target, nodenext modules) + NestJS 11, Prisma 7 + pg adapter, class-validator, class-transformer, @nestjs/swagger, Vitest 3, Playwright 1.50 (004-notes-storage-api)
- PostgreSQL via Prisma 7 — two new tables: `storages` (self-referential), `notes` (004-notes-storage-api)
- TypeScript 5 (strict mode) + Next.js 16.1.6, React 19, Sonner (toasts), Vitest 3, @testing-library/react 16 (005-notes-frontend-integration)
- No frontend storage; backend PostgreSQL accessed via REST API (005-notes-frontend-integration)
- TypeScript 5.9 (strict mode, ES2023 target, nodenext modules) + NestJS 11, Prisma 7 + @prisma/adapter-pg, class-validator, class-transformer, @nestjs/swagger, Vitest 3 (006-todo-api)
- PostgreSQL via Prisma 7 — one new model (`Todo`) and two new enums (`TodoPriority`, `TodoStatus`) (006-todo-api)
- TypeScript 5 (strict mode) + Next.js 16.1.6, React 19, Tailwind CSS v4, Sonner (toasts), Lucide React, Radix UI primitives (Dialog, Select), native `fetch` via shared `request()` client (001-todo-frontend-integration)
- No frontend storage; all data lives in PostgreSQL via backend REST API (001-todo-frontend-integration)
- PostgreSQL via Prisma 7 (tested via mocked PrismaService) (007-complete-test-coverage)
- TypeScript 5.9 (strict mode, ES2023 target, nodenext modules) + NestJS 11, Next.js 16, React 19, @marsidev/react-turnstile, class-validator (008-captcha-integration)
- N/A (CAPTCHA is stateless — no DB changes) (008-captcha-integration)

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
- 008-captcha-integration: Added TypeScript 5.9 (strict mode, ES2023 target, nodenext modules) + NestJS 11, Next.js 16, React 19, @marsidev/react-turnstile, class-validator
- 007-complete-test-coverage: Added TypeScript 5.9 (strict mode)
- 001-todo-frontend-integration: Added TypeScript 5 (strict mode) + Next.js 16.1.6, React 19, Tailwind CSS v4, Sonner (toasts), Lucide React, Radix UI primitives (Dialog, Select), native `fetch` via shared `request()` client


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
