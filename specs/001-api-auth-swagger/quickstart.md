# Developer Quickstart: Backend API (Feature 001)

**Branch**: `001-api-auth-swagger`
**Working directory**: `apps/api`

---

## Prerequisites

- Node.js >= 18
- Yarn 1.22 classic
- PostgreSQL (or Prisma Postgres hosted — see `.env` setup)
- Docker (optional, for running PostgreSQL locally)

---

## 1. Install Dependencies

```bash
yarn install
```

New packages added in this feature (install once if not already present):

```bash
yarn workspace api add @nestjs/jwt argon2 @nestjs/swagger swagger-ui-express zod
yarn workspace api add class-validator class-transformer  # if not already present
```

---

## 2. Environment Setup

Copy the example env file:

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and fill in the required values:

```dotenv
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/blockora_dev

# JWT signing secret — must be at least 32 characters
# Generate with: openssl rand -base64 48
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-chars

# Token expiry (optional — these are the defaults)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server port
PORT=3000

# Allowed browser origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Environment
NODE_ENV=development
```

**Startup failure**: If any required variable is missing or invalid, the app will print a clear error and exit before connecting to the database. This is intentional — fix the env before proceeding.

---

## 3. Database Setup

Run the Prisma migration (applies the `token → tokenHash` column rename and any new migrations):

```bash
cd apps/api
yarn prisma migrate dev --name "rename_token_to_token_hash"
```

Or if using Prisma Postgres hosted (no local DB):

```bash
cd apps/api
yarn prisma db push
```

Generate the Prisma client after schema changes:

```bash
cd apps/api
yarn prisma generate
```

---

## 4. Start the Development Server

```bash
cd apps/api
yarn dev
```

Or from the monorepo root:

```bash
yarn dev --filter=api
```

The server starts at `http://localhost:3000` (or the `PORT` you configured).

---

## 5. Explore the API

Open the interactive API documentation:

```
http://localhost:3000/api/docs
```

**To authenticate in Swagger UI**:
1. Expand `POST /auth/register` → fill in email/password → click Execute
2. Copy the `accessToken` from the response
3. Click the **Authorize** button at the top of the page
4. Paste the token in the `access-token (Bearer)` field → click Authorize
5. All subsequent requests will include `Authorization: Bearer <token>`

---

## 6. Run Tests

**Unit tests** (no DB required):

```bash
cd apps/api
yarn test
```

**Unit tests with watch mode**:

```bash
cd apps/api
yarn test:watch
```

**E2E / integration tests** (no DB required — PrismaService is mocked):

```bash
cd apps/api
yarn test:e2e
```

**All tests with coverage**:

```bash
cd apps/api
yarn test:cov
```

---

## 7. Lint

```bash
cd apps/api
yarn lint
```

---

## 8. Prisma Studio (inspect data)

```bash
cd apps/api
yarn studio
```

Opens at `http://localhost:5555`

---

## Key Source Files

| File | Purpose |
|------|---------|
| [src/config/env.ts](../../apps/api/src/config/env.ts) | Zod schema + `validateEnv()` function |
| [src/config/config.module.ts](../../apps/api/src/config/config.module.ts) | Global DI provider for `AppConfig` |
| [src/auth/auth.module.ts](../../apps/api/src/auth/auth.module.ts) | Auth module root |
| [src/auth/auth.service.ts](../../apps/api/src/auth/auth.service.ts) | Login, register, refresh, logout logic |
| [src/auth/auth.controller.ts](../../apps/api/src/auth/auth.controller.ts) | Auth HTTP endpoints |
| [src/auth/guards/jwt-auth.guard.ts](../../apps/api/src/auth/guards/jwt-auth.guard.ts) | Global JWT guard |
| [src/auth/decorators/public.decorator.ts](../../apps/api/src/auth/decorators/public.decorator.ts) | `@Public()` opt-out decorator |
| [src/auth/decorators/current-user.decorator.ts](../../apps/api/src/auth/decorators/current-user.decorator.ts) | `@CurrentUser()` param decorator |
| [src/block/block.controller.ts](../../apps/api/src/block/block.controller.ts) | Block CRUD endpoints (auth-wired) |
| [src/block/block.service.ts](../../apps/api/src/block/block.service.ts) | Block business logic |
| [src/main.ts](../../apps/api/src/main.ts) | App bootstrap, Swagger setup, CORS, ValidationPipe |
| [prisma/schema.prisma](../../apps/api/prisma/schema.prisma) | Database schema |
| [.env.example](../../apps/api/.env.example) | Environment variable template |

---

## Common Issues

**App exits immediately on startup**
→ Check the error message for which env variable failed validation. Fix it in `.env`.

**401 Unauthorized on all requests**
→ Ensure you have a valid access token. Tokens expire in 15 minutes by default. Use `POST /auth/refresh` to get a new one.

**Prisma connection error**
→ Check `DATABASE_URL` in `.env`. Verify the database is reachable and the credentials are correct.

**CORS error in browser**
→ Ensure the frontend's origin is included in `CORS_ORIGINS` in `.env`.
