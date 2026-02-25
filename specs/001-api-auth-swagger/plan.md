# Implementation Plan: Backend API — Auth, Blocks, CORS, Swagger & Env Config

**Branch**: `001-api-auth-swagger` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-api-auth-swagger/spec.md`

## Summary

Replace the stub-user-id authentication in the existing block API with real JWT-based auth (access + refresh tokens). Add auth endpoints (register, login, refresh, logout, me). Wire CORS for frontend communication. Document every endpoint with Swagger/OpenAPI. Add unit and integration tests that run without a live database. Validate all environment variables at startup with Zod and fail fast on misconfiguration.

**Technical approach**: `@nestjs/jwt` (no Passport) for JWT, Argon2id for password hashing, custom `CanActivate` guard with global `APP_GUARD` registration, `@Public()` opt-out for public routes, `@nestjs/swagger` with CLI plugin, Zod `safeParse` before `NestFactory.create`, NestJS `TestingModule` with mocked PrismaService.

## Technical Context

**Language/Version**: TypeScript 5 (target ES2023, `nodenext` modules, `strictNullChecks: true`)
**Primary Dependencies**: NestJS 11, `@nestjs/jwt ^10.2`, `argon2 ^0.43`, `@nestjs/swagger`, `zod ^3.x`, `class-validator`, `class-transformer`, Prisma 7
**Storage**: PostgreSQL via Prisma 7 (existing schema + one migration: `token` → `tokenHash` on `RefreshToken`)
**Testing**: Jest 30 + ts-jest 29 + supertest 7 (unit + integration, no live DB required)
**Target Platform**: Linux server / Docker container (Node >=18)
**Project Type**: Web service (NestJS REST API)
**Performance Goals**: Block CRUD <200ms per Constitution Principle IV; auth endpoints <1s
**Constraints**: No live DB in tests; JWT expiry: access 15min, refresh 7 days (configurable via env)
**Scale/Scope**: MVP — single-tenant auth, user-scoped blocks, ~10 endpoints total

## Constitution Check

*GATE: Must pass before implementation begins.*

| Principle | Status | Notes |
|---|---|---|
| I. Blocks Are Atomic | PASS | Block model unchanged; no new fields merged in; userId from JWT enforces ownership |
| II. Privacy by Default | PASS | All block queries scoped to userId from JWT; visibility=PRIVATE default preserved |
| III. Simplicity Over Features | PASS | No team workspaces, real-time, file uploads, or notifications; auth is required MVP |
| IV. Performance is a Feature | PASS | All block queries use existing (userId, createdAt) index; no N+1 queries introduced |
| V. Type-Safe and Test-Driven | PASS | TypeScript strict; DTOs with class-validator; tests for every endpoint required |
| VI. Monorepo Discipline | PASS | All new code in apps/api/src/; no cross-app imports; no new packages/ needed |

All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-api-auth-swagger/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   └── api-endpoints.md # Phase 1 output (/speckit.plan command)
├── checklists/
│   └── requirements.md  # Spec quality checklist (/speckit.specify output)
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (apps/api)

```text
apps/api/
├── .env                           # local secrets (gitignored)
├── .env.example                   # NEW: template with all required vars
├── prisma/
│   ├── schema.prisma              # RefreshToken.token renamed to tokenHash
│   └── migrations/
│       └── [timestamp]_rename_token_to_token_hash/
│           └── migration.sql
├── nest-cli.json                  # MODIFIED: add @nestjs/swagger plugin
├── src/
│   ├── main.ts                    # MODIFIED: validateEnv(), CORS, Swagger, ValidationPipe
│   ├── app.module.ts              # MODIFIED: AuthModule, ConfigModule, APP_GUARD
│   ├── config/
│   │   ├── env.ts                 # NEW: Zod schema + validateEnv() + AppConfig type
│   │   └── config.module.ts       # NEW: @Global() DI provider for APP_CONFIG token
│   ├── auth/
│   │   ├── auth.module.ts         # NEW
│   │   ├── auth.controller.ts     # NEW: register, login, refresh, logout, me
│   │   ├── auth.service.ts        # NEW: Argon2id, token issuance, rotation
│   │   ├── auth.controller.spec.ts  # NEW: unit tests
│   │   ├── auth.service.spec.ts     # NEW: unit tests
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts  # NEW: global CanActivate guard
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts       # NEW: @Public() opt-out
│   │   │   └── current-user.decorator.ts  # NEW: @CurrentUser() param decorator
│   │   ├── dto/
│   │   │   ├── register.dto.ts    # NEW
│   │   │   ├── login.dto.ts       # NEW
│   │   │   └── refresh.dto.ts     # NEW
│   │   └── types/
│   │       └── jwt-payload.type.ts # NEW
│   ├── block/
│   │   ├── block.module.ts        # unchanged
│   │   ├── block.service.ts       # unchanged
│   │   ├── block.controller.ts    # MODIFIED: remove STUB_USER_ID, @CurrentUser(), Swagger
│   │   ├── block.controller.spec.ts # NEW: unit tests
│   │   ├── block.service.spec.ts    # NEW: unit tests
│   │   └── dto/
│   │       ├── create-block.dto.ts  # NEW: class-validator DTO
│   │       └── update-block.dto.ts  # NEW: PartialType of CreateBlockDto
│   └── prisma/
│       ├── prisma.module.ts   # unchanged
│       └── prisma.service.ts  # unchanged
└── test/
    ├── jest-e2e.json          # MODIFIED: add clearMocks: true
    ├── app.e2e-spec.ts        # existing (mark AppController route as @Public())
    ├── auth.e2e-spec.ts       # NEW: HTTP integration tests for auth endpoints
    └── blocks.e2e-spec.ts     # NEW: HTTP integration tests for block endpoints
```

**Structure Decision**: Single `apps/api` NestJS backend. All new source files live inside `apps/api/src/` organized by module (auth, block, config). No new Turborepo apps or packages needed — auth types used only within the API.

## Complexity Tracking

No constitution violations — this section does not apply.

## Phase 0 Research Summary

All decisions resolved. See [research.md](./research.md) for full details.

| Decision | Resolution |
|---|---|
| JWT package | @nestjs/jwt only (no Passport) |
| Password hashing | argon2 (Argon2id, OWASP #1) |
| Guard strategy | Global APP_GUARD + @Public() opt-out |
| Refresh token storage | Random UUID, Argon2id hash in RefreshToken.tokenHash |
| Swagger setup | @nestjs/swagger + plugin in nest-cli.json, UI at /api/docs |
| Env validation | Zod safeParse before NestFactory.create, typed AppConfig via DI |
| CORS | app.enableCors() with origins from AppConfig.CORS_ORIGINS |
| Testing | TestingModule + mock PrismaService + overrideProvider for e2e |

## Phase 1 Design Summary

All Phase 1 artifacts complete.

- [data-model.md](./data-model.md) — entity fields, DTOs, validation rules, RefreshToken lifecycle
- [contracts/api-endpoints.md](./contracts/api-endpoints.md) — all 10 endpoints with request/response shapes
- [quickstart.md](./quickstart.md) — install, env setup, migrate, run, test

### Key Design Decisions

**1. Prisma Schema Migration**
RefreshToken.token renamed to tokenHash via a Prisma migration. The existing column comment said "stored as bcrypt hash" — we switch to Argon2id and rename for clarity.

**2. Block Controller Refactoring**
STUB_USER_ID is removed. @CurrentUser() injects the authenticated user's ID (from the JWT sub claim) into every block endpoint handler.

**3. Global ValidationPipe**
Registered in main.ts with { whitelist: true, transform: true }. E2e tests mirror this config to match production behavior.

**4. Swagger Plugin**
nest-cli.json plugin with classValidatorShim: true auto-reflects class-validator decorators into Swagger schemas. Prisma enums need one manual @ApiProperty({ enum: BlockType }) call.

**5. AppModule Wiring**
AppModule imports AuthModule (provides AuthService for the guard) and ConfigModule.forRoot(config) (provides APP_CONFIG globally). Registers { provide: APP_GUARD, useClass: JwtAuthGuard }.

**6. App Health Check Route**
AppController.getHello() must be decorated with @Public() to remain accessible without a token after the global guard is added.

## Implementation Order (reference for /speckit.tasks)

1. Prisma schema migration — rename token to tokenHash; run prisma migrate dev
2. Install new dependencies — @nestjs/jwt, argon2, @nestjs/swagger, swagger-ui-express, zod, class-validator, class-transformer
3. Environment config — src/config/env.ts (Zod schema + AppConfig), src/config/config.module.ts, .env.example
4. Auth types and decorators — jwt-payload.type.ts, public.decorator.ts, current-user.decorator.ts
5. JWT Auth Guard — src/auth/guards/jwt-auth.guard.ts
6. Auth DTOs — register.dto.ts, login.dto.ts, refresh.dto.ts
7. Auth Service — src/auth/auth.service.ts (register, login, refresh, logout, token issuance)
8. Auth Module — src/auth/auth.module.ts
9. Auth Controller — src/auth/auth.controller.ts (endpoints + Swagger decorators)
10. Block DTOs — create-block.dto.ts, update-block.dto.ts
11. Block Controller refactoring — remove STUB_USER_ID, use @CurrentUser(), add Swagger decorators
12. AppModule update — import AuthModule + ConfigModule, register APP_GUARD
13. main.ts update — validateEnv(), CORS, Swagger setup, ValidationPipe
14. nest-cli.json update — add @nestjs/swagger plugin
15. Unit tests — auth.service.spec.ts, auth.controller.spec.ts, block.service.spec.ts, block.controller.spec.ts
16. E2E tests — auth.e2e-spec.ts, blocks.e2e-spec.ts
17. Jest config update — add clearMocks: true to both configs
18. Build and lint verification — yarn build && yarn lint must pass
