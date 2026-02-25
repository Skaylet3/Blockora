# Research: Backend API Auth, Blocks, CORS, Swagger & Env Config

**Feature**: `001-api-auth-swagger`
**Date**: 2026-02-25
**Sources**: NestJS 11 docs, Zod 3 docs, OWASP Password Storage Cheat Sheet (2023+), @nestjs/swagger 7.x

---

## R-001: JWT Authentication Package Strategy

**Decision**: `@nestjs/jwt` only — no Passport

**Rationale**: Passport (`passport`, `passport-jwt`, `@nestjs/passport`, `@types/passport-jwt`) adds 4 dependencies for a pattern that duplicates what `@nestjs/jwt` + a custom `CanActivate` guard already provides in fewer lines with better TypeScript ergonomics. The NestJS docs updated in 2023/2024 to show the passport-free path as the primary example. Passport only adds value when integrating multiple third-party OAuth strategies (GitHub, Google, etc.) — which is not in this feature's scope.

**Alternatives considered**: `passport-jwt` — rejected due to unnecessary complexity, opaque `Strategy` lifecycle, and poor compatibility with TypeScript strict mode.

**Packages**:
```
@nestjs/jwt   ^10.2.0   — JWT issuance and verification (NestJS 11 compatible)
```

---

## R-002: Password Hashing Algorithm

**Decision**: `argon2` (node-argon2, Argon2id variant)

**Rationale**:
- OWASP Password Storage Cheat Sheet (2023+) ranks Argon2id as the #1 recommended algorithm
- bcrypt has a 72-byte password limit (silent truncation footgun)
- Argon2id is memory-hard, resisting GPU-based brute-force attacks
- The `argon2` npm package ships built-in TypeScript types
- Node-gyp native binding is a non-issue for Docker/Node 18+ deployments

**Alternatives considered**:
- `bcrypt` — native binding, maintained, but bcrypt algorithm is aging; 72-byte limit
- `bcryptjs` — pure JS (slower, no native binding), same algorithm limitations
- `argon2` — chosen ✅

**Package**:
```
argon2   ^0.43.0
```

**Usage pattern**:
```typescript
import * as argon2 from 'argon2';
const hash = await argon2.hash(plainPassword);      // default: Argon2id
const valid = await argon2.verify(storedHash, plainPassword);
```

---

## R-003: JWT Guard Strategy — Global Guard with @Public() opt-out

**Decision**: Single global `JwtAuthGuard` (custom `CanActivate`), opt-out via `@Public()` decorator

**Rationale**: Registering the guard as `APP_GUARD` in `AppModule` means every route is protected by default. Public routes (login, register, refresh, docs) are opted out with a `@Public()` metadata decorator. This is cleaner than per-route `@UseGuards()` noise and prevents accidentally shipping an unguarded endpoint.

**Pattern**:
```typescript
// Every route protected by default
{ provide: APP_GUARD, useClass: JwtAuthGuard }

// Opt out with decorator
@Public()   // SetMetadata(IS_PUBLIC_KEY, true)
@Post('login')
login(...) {}
```

**Alternatives considered**: Per-route `@UseGuards(JwtAuthGuard)` — rejected because it requires every new route to explicitly guard itself (high risk of accidental exposure).

---

## R-004: Refresh Token Storage

**Decision**: Random UUID refresh tokens, stored as Argon2id hash in the database `RefreshToken` table

**Rationale**:
- Refresh tokens do not need to carry claims — the database row is the source of truth
- Storing a random opaque token (not a JWT) avoids double-JWT confusion
- Hashing with Argon2id means a database breach does not expose usable tokens
- `crypto.randomUUID()` is built into Node 18+ — no extra package needed
- The existing schema has `token String @unique` on `RefreshToken`; this field should be renamed to `tokenHash` for clarity (requires a migration)

**Rotation**: When a refresh token is used, it is immediately `revokedAt`-timestamped and a new token record is created. Replay of a revoked token returns 401.

---

## R-005: Access Token Payload and @CurrentUser Decorator

**Decision**: Minimal JWT payload — `{ sub: userId, email }`. Extracted via a custom `@CurrentUser` param decorator.

**Rationale**: Minimal payload reduces token size and avoids stale data (e.g., display name changes would not be reflected until re-login if embedded in the token). `@CurrentUser()` is a typed `createParamDecorator` that reads from `request.user` (set by the guard) — clean, testable, no magic.

**JwtPayload type**:
```typescript
interface JwtPayload {
  sub: string;    // userId (UUID)
  email: string;
  iat?: number;
  exp?: number;
}
```

---

## R-006: Auth Module Structure

**Decision**: Self-contained `AuthModule` with the following file layout:

```
src/auth/
  auth.module.ts
  auth.controller.ts
  auth.service.ts
  guards/
    jwt-auth.guard.ts
  decorators/
    current-user.decorator.ts
    public.decorator.ts
  dto/
    register.dto.ts
    login.dto.ts
    refresh.dto.ts
  types/
    jwt-payload.type.ts
```

`AuthModule` exports `AuthService` so the globally-registered `JwtAuthGuard` (which injects `AuthService`) can resolve its dependency correctly.

---

## R-007: Swagger Setup

**Decision**: `@nestjs/swagger` with the NestJS CLI plugin enabled, Swagger UI at `/api/docs`

**Packages**:
```
@nestjs/swagger     ^8.x    — OpenAPI document generation + decorator set
swagger-ui-express  ^5.x    — UI adapter for Express platform
```

**Key decisions**:
- Plugin enabled in `nest-cli.json` with `classValidatorShim: true` so class-validator decorators are automatically reflected into Swagger schema (no manual `@ApiProperty` on most DTO fields)
- `DocumentBuilder.addBearerAuth('access-token')` wired to `@ApiBearerAuth('access-token')` on controller classes — enables the Swagger UI "Authorize" button
- `persistAuthorization: true` in `SwaggerModule.setup` keeps the token across page refreshes
- Prisma enums need one manual `@ApiProperty({ enum: BlockType, enumName: 'BlockType' })` because the plugin cannot infer external enum values

---

## R-008: Zod Environment Validation

**Decision**: `zod` `safeParse` in `main.ts` before `NestFactory.create`, typed `AppConfig` object injected via DI token

**Package**:
```
zod   ^3.x   (in dependencies, not devDependencies — runs at startup)
```

**Validation schema variables**:
| Variable | Type | Constraint | Default |
|---|---|---|---|
| `DATABASE_URL` | string | `.url()` — valid URL format | required |
| `JWT_SECRET` | string | `.min(32)` — entropy floor | required |
| `JWT_ACCESS_EXPIRES_IN` | string | any | `'15m'` |
| `JWT_REFRESH_EXPIRES_IN` | string | any | `'7d'` |
| `PORT` | string→number | `.transform(Number)` | `'3000'` |
| `CORS_ORIGINS` | string→string[] | `.transform(csv split)` | required |
| `NODE_ENV` | enum | `development\|test\|production` | `'development'` |

**Error format** (on startup failure):
```
[Config] Environment validation failed. Fix the following before starting:
  - DATABASE_URL: DATABASE_URL must be a valid URL (e.g. postgresql://...)
  - JWT_SECRET: JWT_SECRET must be at least 32 characters for security
```

**Why not `@nestjs/config`**: NestJS ConfigModule's `validate` option surfaces errors deeper in the bootstrap process, making them harder to isolate. `validateEnv()` as the first line of `bootstrap()` is deterministic and produces clean output.

---

## R-009: CORS Configuration

**Decision**: NestJS built-in `app.enableCors()` with origins from the validated `AppConfig`

**Pattern**:
```typescript
app.enableCors({
  origin: config.CORS_ORIGINS,          // string[] from Zod transform
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
});
```

No additional package needed — NestJS delegates to the underlying Express `cors` middleware.

---

## R-010: Testing Strategy (No Live DB)

**Decision**: NestJS `TestingModule` with manual `PrismaService` mock objects + `overrideProvider` for e2e tests

**Mock shape** (mirrors `prisma.db.*` composition pattern):
```typescript
const mockPrismaService = {
  db: {
    block: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: { findUnique: jest.fn(), create: jest.fn(), findUniqueOrThrow: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findFirstOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
};
```

**Test types and locations**:
| Type | Convention | Location | Runner |
|---|---|---|---|
| Service unit | `*.service.spec.ts` | `src/[module]/` | `jest` (package.json config) |
| Controller unit | `*.controller.spec.ts` | `src/[module]/` | `jest` (package.json config) |
| HTTP integration | `*.e2e-spec.ts` | `test/` | `jest --config test/jest-e2e.json` |

**Guard override for e2e tests**:
```typescript
.overrideGuard(JwtAuthGuard)
.useValue({
  canActivate: (ctx) => {
    ctx.switchToHttp().getRequest().user = { sub: 'test-user-id', email: 'test@example.com' };
    return true;
  },
})
```

**Jest config additions needed**:
- `"clearMocks": true` in both `package.json` jest config and `test/jest-e2e.json`

---

## R-011: Prisma Schema Migration Required

**Decision**: Rename `RefreshToken.token` → `RefreshToken.tokenHash`, add migration file

**Rationale**: The current schema has the field named `token` with a comment `// stored as bcrypt hash`. Renaming to `tokenHash` makes the semantics self-evident and removes the misleading bcrypt reference (we are using Argon2id). Requires a new Prisma migration (SQL `ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash`).

---

## R-012: DTO Validation Pipe

**Decision**: Register `ValidationPipe({ whitelist: true, transform: true })` globally in `main.ts`

**Rationale**:
- `whitelist: true` strips any properties not declared in the DTO (protects against mass-assignment vulnerabilities)
- `transform: true` enables automatic type coercion (e.g., string path params to number when typed as `number`)
- Must be registered in `main.ts` to apply to all routes including those from `AppModule`

**Impact on tests**: E2e tests that bootstrap the full NestJS app must also call `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))` after `createNestApplication()` to match production behavior.
