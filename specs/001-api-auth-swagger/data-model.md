# Data Model: Backend API Auth, Blocks, CORS, Swagger & Env Config

**Feature**: `001-api-auth-swagger`
**Date**: 2026-02-25

---

## Existing Models (unchanged)

### User

Maps to `users` table. No changes to this model in this feature.

| Field | Type | Constraint | Notes |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | |
| `email` | String | Unique | Login identifier |
| `passwordHash` | String | Required | Argon2id hash of the plain-text password |
| `displayName` | String? | Optional | Human-readable name shown in UI |
| `createdAt` | DateTime | auto-set | |
| `updatedAt` | DateTime | auto-updated | |
| `blocks` | Block[] | relation | All blocks owned by this user |
| `refreshTokens` | RefreshToken[] | relation | All session tokens for this user |

---

### Block

Maps to `blocks` table. No changes to this model in this feature (CRUD endpoints replace stub with real `userId` from JWT).

| Field | Type | Constraint | Notes |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | |
| `userId` | UUID | FK → User, Cascade delete | Owner of the block |
| `title` | String | Required | |
| `content` | String | Required | |
| `type` | BlockType | Default: NOTE | Enum: NOTE, TASK, SNIPPET, IDEA, LINK |
| `status` | BlockStatus | Default: ACTIVE | Enum: ACTIVE, ARCHIVED, DELETED |
| `visibility` | BlockVisibility | Default: PRIVATE | Enum: PRIVATE, PUBLIC |
| `tags` | String[] | Default: [] | Array of text labels |
| `createdAt` | DateTime | auto-set | |
| `updatedAt` | DateTime | auto-updated | |
| `archivedAt` | DateTime? | Nullable | Set when status → ARCHIVED (audit only) |

**Indexes**: `(userId, createdAt)`, `(userId, status)`, `(userId, type)` — already exist.

---

## Modified Model

### RefreshToken

Maps to `refresh_tokens` table. **One field renamed**: `token` → `tokenHash` (requires migration).

| Field | Type | Constraint | Notes |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | |
| `userId` | UUID | FK → User, Cascade delete | |
| `tokenHash` | String | Unique | Argon2id hash of the raw opaque token |
| `expiresAt` | DateTime | Required | After this date the token is expired |
| `createdAt` | DateTime | auto-set | |
| `revokedAt` | DateTime? | Nullable | Null = active; set = revoked |

**Migration required**: `ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash`

**Token lifecycle state machine**:
```
[issued]
  tokenHash set, revokedAt = null, expiresAt = future
  → ACTIVE

[used for refresh]
  revokedAt set to NOW
  new RefreshToken created
  → REVOKED (old) + new ACTIVE

[logout]
  revokedAt set to NOW on all active tokens for userId
  → REVOKED

[expired, not revoked]
  expiresAt < NOW, revokedAt = null
  → EXPIRED (treated as invalid by query filter)
```

---

## New Runtime Entities (not persisted)

### AppConfig (runtime validated config object)

Produced by `validateEnv()` in `src/config/env.ts`. Injected as a global DI token.

| Field | Type | Constraint | Source |
|---|---|---|---|
| `DATABASE_URL` | string | valid URL format | `process.env.DATABASE_URL` |
| `JWT_SECRET` | string | min 32 chars | `process.env.JWT_SECRET` |
| `JWT_ACCESS_EXPIRES_IN` | string | any | `process.env.JWT_ACCESS_EXPIRES_IN` (default: `'15m'`) |
| `JWT_REFRESH_EXPIRES_IN` | string | any | `process.env.JWT_REFRESH_EXPIRES_IN` (default: `'7d'`) |
| `PORT` | number | numeric | `process.env.PORT` (default: `3000`) |
| `CORS_ORIGINS` | string[] | non-empty | `process.env.CORS_ORIGINS` (comma-split) |
| `NODE_ENV` | 'development' \| 'test' \| 'production' | enum | `process.env.NODE_ENV` (default: `'development'`) |

---

### JwtPayload (access token claims)

Embedded in the signed JWT. Not persisted.

| Field | Type | Notes |
|---|---|---|
| `sub` | string (UUID) | userId — subject claim |
| `email` | string | user's email at time of login |
| `iat` | number | issued-at (set by jsonwebtoken) |
| `exp` | number | expiry (set by jsonwebtoken per `JWT_ACCESS_EXPIRES_IN`) |

---

## DTO Classes (request validation)

### RegisterDto

| Field | Validation | Required |
|---|---|---|
| `email` | IsEmail | yes |
| `password` | IsString, MinLength(8) | yes |
| `displayName` | IsString, IsOptional | no |

### LoginDto

| Field | Validation | Required |
|---|---|---|
| `email` | IsEmail | yes |
| `password` | IsString | yes |

### RefreshDto

| Field | Validation | Required |
|---|---|---|
| `refreshToken` | IsString | yes |

### CreateBlockDto

| Field | Validation | Required |
|---|---|---|
| `title` | IsString, MinLength(1) | yes |
| `content` | IsString | yes |
| `type` | IsEnum(BlockType), IsOptional | no |
| `visibility` | IsEnum(BlockVisibility), IsOptional | no |
| `tags` | IsArray, IsString({each:true}), IsOptional | no |

### UpdateBlockDto

Same as `CreateBlockDto` but all fields optional (Partial). Inherits from `CreateBlockDto` using `PartialType`.

---

## Entity Relationships

```
User (1) ──────────── (*) Block
User (1) ──────────── (*) RefreshToken
```

All Block and RefreshToken records cascade-delete when the parent User is deleted.

---

## Validation Rules Summary

| Rule | Entity | Enforcement |
|---|---|---|
| Email must be unique | User | Prisma unique index + 409 response on conflict |
| Password min 8 chars | RegisterDto | class-validator on controller boundary |
| Block owned by requester | Block reads/writes | AuthService sets userId from JWT; BlockService scopes all queries to userId |
| DELETED blocks invisible | Block | `status: { not: BlockStatus.DELETED }` in all findMany/findFirst queries |
| Refresh token single-use | RefreshToken | `revokedAt` set immediately upon use; replayed token returns 401 |
| Refresh token not expired | RefreshToken | `expiresAt: { gt: new Date() }` in query filter |
| Config validated at startup | AppConfig | Zod `safeParse` before `NestFactory.create`; process exits on failure |
