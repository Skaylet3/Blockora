# Tasks: Backend API — Auth, Blocks, CORS, Swagger & Env Config

**Input**: Design documents from `/specs/001-api-auth-swagger/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Explicitly requested ("also create tests for that endpoints") — all story phases include test tasks.

**Organization**: Tasks grouped by user story. Each story phase is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story label (US1=Registration+Login, US2=CORS, US3=Blocks, US4=Swagger Docs, US5=Env Config)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install packages, apply schema migration, update tooling config. Must complete before any story work.

- [x] T001 Install new runtime packages: `yarn workspace api add @nestjs/jwt argon2 @nestjs/swagger swagger-ui-express zod class-validator class-transformer` in `apps/api`
- [x] T002 Update `apps/api/prisma/schema.prisma`: rename `RefreshToken.token` field to `tokenHash`; run `cd apps/api && yarn prisma migrate dev --name rename_token_to_token_hash` to create and apply migration
- [x] T003 [P] Add `@nestjs/swagger` CLI plugin to `apps/api/nest-cli.json` under `compilerOptions.plugins` with `introspectComments: true` and `classValidatorShim: true`
- [x] T004 [P] Add `"clearMocks": true` to the `jest` section in `apps/api/package.json` and to `apps/api/test/jest-e2e.json`

**Checkpoint**: `cd apps/api && yarn prisma generate && yarn build` must succeed before Phase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST exist before any user story can be implemented. No story work can begin until this phase is complete.

- [x] T005 Create `apps/api/src/config/env.ts`: Zod `envSchema` object with `DATABASE_URL` (`.url()`), `JWT_SECRET` (`.min(32)`), `JWT_ACCESS_EXPIRES_IN` (default `'15m'`), `JWT_REFRESH_EXPIRES_IN` (default `'7d'`), `PORT` (string→number transform, default `'3000'`), `CORS_ORIGINS` (csv→string[] transform), `NODE_ENV` enum; export `AppConfig` type (`z.infer<typeof envSchema>`) and `validateEnv()` using `safeParse` with formatted error output and `process.exit(1)` on failure
- [x] T006 Create `apps/api/src/config/config.module.ts`: `@Global()` `@Module` exporting `{ provide: APP_CONFIG, useFactory: () => validateEnv() }` from symbol `APP_CONFIG = Symbol('APP_CONFIG')`; export `ConfigModule` and `APP_CONFIG` token (depends on T005)
- [x] T007 [P] Create `apps/api/.env.example`: document all 7 env variables (`DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `PORT`, `CORS_ORIGINS`, `NODE_ENV`) with inline comments explaining format, constraints, and safe placeholder values
- [x] T008 [P] Create `apps/api/src/auth/types/jwt-payload.type.ts`: export `JwtPayload` interface with fields `sub: string` (userId), `email: string`, `iat?: number`, `exp?: number`
- [x] T009 [P] Create `apps/api/src/auth/decorators/public.decorator.ts`: export `IS_PUBLIC_KEY = 'isPublic'` constant and `Public` decorator using `SetMetadata(IS_PUBLIC_KEY, true)`
- [x] T010 [P] Create `apps/api/src/auth/decorators/current-user.decorator.ts`: export `CurrentUser` using `createParamDecorator` that reads `request['user']` and returns it typed as `JwtPayload`

**Checkpoint**: All 6 foundational files compile. `yarn build` passes. User story implementation can now begin.

---

## Phase 3: User Story 1 — User Registration and Login (Priority: P1) 🎯 MVP

**Goal**: Users can register, log in, obtain access+refresh tokens, refresh silently, and log out. Protected endpoints reject unauthenticated requests.

**Independent Test**: `POST /auth/register` → receive tokens → `GET /auth/me` with access token → 200. `POST /auth/login` with wrong password → 401. `POST /auth/refresh` → new tokens, old refresh token rejected.

### DTOs (needed before tests and implementation)

- [x] T011 [P] [US1] Create `apps/api/src/auth/dto/register.dto.ts`: class `RegisterDto` with `@IsEmail() email: string`, `@IsString() @MinLength(8) password: string`, `@IsString() @IsOptional() displayName?: string`
- [x] T012 [P] [US1] Create `apps/api/src/auth/dto/login.dto.ts`: class `LoginDto` with `@IsEmail() email: string`, `@IsString() password: string`
- [x] T013 [P] [US1] Create `apps/api/src/auth/dto/refresh.dto.ts`: class `RefreshDto` with `@IsString() refreshToken: string`

### Tests (write first — should fail until implementation is complete)

- [x] T014 [P] [US1] Create `apps/api/src/auth/auth.service.spec.ts`: unit tests using `Test.createTestingModule` with mock PrismaService (mock `prisma.db.user.*` and `prisma.db.refreshToken.*`); test `register` (happy path + duplicate email), `login` (valid creds + invalid creds), `refresh` (valid token + revoked token), `logout` (revokes all tokens)
- [x] T015 [P] [US1] Create `apps/api/test/auth.e2e-spec.ts`: HTTP integration tests using supertest with `overrideProvider(PrismaService)` mock; test `POST /auth/register` 201, `POST /auth/register` 409 duplicate, `POST /auth/login` 200, `POST /auth/login` 401 wrong creds, `POST /auth/refresh` 200, `POST /auth/refresh` 401 invalid token, `POST /auth/logout` 204, `GET /auth/me` 200, `GET /auth/me` 401 no token

### Implementation

- [x] T016 [US1] Create `apps/api/src/auth/auth.service.ts`: inject `JwtService` and `PrismaService`; implement `register(dto)` (argon2.hash password, prisma.db.user.create, issueTokens), `login(dto)` (findUser, argon2.verify, issueTokens; throw UnauthorizedException on bad creds with no hint about which field), `refresh(dto)` (find active RefreshToken by userId, argon2.verify tokenHash, revokedAt now, create new; throw UnauthorizedException if invalid/expired), `logout(userId)` (updateMany revokedAt on active tokens), private `issueTokens(userId, email)` (sign JWT + crypto.randomUUID refresh token + argon2.hash + create RefreshToken row), `verifyAccessToken(token)` (jwtService.verify using JWT_SECRET) (depends on T011, T012, T013)
- [x] T017 [US1] Create `apps/api/src/auth/auth.module.ts`: `@Module` importing `PrismaModule` and `JwtModule.register({})`, providing `AuthService`, exporting `AuthService` (depends on T016)
- [x] T018 [US1] Create `apps/api/src/auth/guards/jwt-auth.guard.ts`: `@Injectable() JwtAuthGuard implements CanActivate`; inject `AuthService` and `Reflector`; check `IS_PUBLIC_KEY` metadata via `reflector.getAllAndOverride`; extract Bearer token from `Authorization` header; call `authService.verifyAccessToken(token)`; set `request['user'] = payload`; throw `UnauthorizedException` if missing/invalid (depends on T008, T009, T016)
- [x] T019 [US1] Create `apps/api/src/auth/auth.controller.ts`: `@ApiTags('auth') @Controller('auth')`; `@Public() @Post('register')` with `@ApiOperation`, `@ApiBody({type:RegisterDto})`, `@ApiResponse(201)`, `@ApiResponse(409)`, `@ApiResponse(422)`; `@Public() @Post('login') @HttpCode(200)` with `@ApiResponse(200)`, `@ApiResponse(401)`; `@Public() @Post('refresh') @HttpCode(200)` with `@ApiResponse(200)`, `@ApiResponse(401)`; `@Post('logout') @HttpCode(204)` with `@ApiBearerAuth('access-token')`, `@ApiResponse(204)`, using `@CurrentUser()`; `@Get('me')` with `@ApiBearerAuth('access-token')`, `@ApiResponse(200)`, using `@CurrentUser()` (depends on T016, T017, T009, T010)
- [x] T020 [US1] Create `apps/api/src/auth/auth.controller.spec.ts`: unit tests using `Test.createTestingModule` with mock `AuthService`; test each handler delegates to service and returns correct status; test `@Public()` routes are accessible without guard (depends on T019)
- [x] T021 [US1] Update `apps/api/src/app.module.ts`: add `AuthModule` and `ConfigModule` to imports array; add `{ provide: APP_GUARD, useClass: JwtAuthGuard }` to providers array; import `APP_GUARD` from `@nestjs/core` (depends on T006, T017, T018)
- [x] T022 [US1] Update `apps/api/src/main.ts`: add `import { validateEnv } from './config/env'` as first import after dotenv; call `const config = validateEnv()` as first line of `bootstrap()`; add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))` after `NestFactory.create` (depends on T005)
- [x] T023 [US1] Add `@Public()` decorator from `./auth/decorators/public.decorator` to `getHello()` method in `apps/api/src/app.controller.ts` so the health check remains accessible without a token (depends on T009)

**Checkpoint**: `POST /auth/register` → 201 with tokens. `POST /auth/login` with correct creds → 200. `GET /auth/me` with token → 200. `GET /auth/me` without token → 401. Unit tests pass.

---

## Phase 4: User Story 2 — Frontend-Backend Communication (Priority: P1)

**Goal**: Browser requests from the configured frontend origin reach the API. Preflight OPTIONS requests return correct CORS headers.

**Independent Test**: Simulate a browser preflight `OPTIONS /auth/login` with `Origin: http://localhost:5173` → response includes `Access-Control-Allow-Origin: http://localhost:5173`. Same request with `Origin: http://evil.com` → no permissive CORS header.

### Tests (write first)

- [x] T024 [P] [US2] Create `apps/api/test/cors.e2e-spec.ts`: HTTP integration tests using supertest; test OPTIONS `/auth/login` with allowed origin → 204 + correct CORS headers; test OPTIONS with disallowed origin → no `Access-Control-Allow-Origin` header; test GET `/auth/me` from allowed origin → response includes CORS headers

### Implementation

- [x] T025 [US2] Update `apps/api/src/main.ts`: after `NestFactory.create`, inject `AppConfig` via `app.get(APP_CONFIG)` or use the `config` object from `validateEnv()`; call `app.enableCors({ origin: config.CORS_ORIGINS, methods: ['GET','POST','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Authorization','Content-Type'], credentials: true })` (depends on T022)

**Checkpoint**: Browser-initiated requests from `CORS_ORIGINS` origins succeed. Preflight OPTIONS returns 204 with correct headers.

---

## Phase 5: User Story 3 — Authenticated Block Management (Priority: P2)

**Goal**: Authenticated users can create, list, retrieve, update, and soft-delete their own blocks. Other users' blocks return 404.

**Independent Test**: Register user A → create block → list blocks → get block by id → update block → delete block → list shows 0. Register user B → try to GET user A's block id → 404.

### DTOs (needed before tests and implementation)

- [x] T026 [P] [US3] Create `apps/api/src/block/dto/create-block.dto.ts`: class `CreateBlockDto` with `@IsString() @MinLength(1) title`, `@IsString() content`, `@IsEnum(BlockType) @IsOptional() type?`, `@IsEnum(BlockVisibility) @IsOptional() visibility?`, `@IsArray() @IsString({ each: true }) @IsOptional() tags?: string[]`; add `@ApiProperty({ enum: BlockType, enumName: 'BlockType', required: false })` for the `type` field and `@ApiProperty({ enum: BlockVisibility, enumName: 'BlockVisibility', required: false })` for `visibility`
- [x] T027 [P] [US3] Create `apps/api/src/block/dto/update-block.dto.ts`: export `UpdateBlockDto` using `PartialType(CreateBlockDto)` imported from `@nestjs/swagger` (not `@nestjs/mapped-types`) so Swagger picks up the optional schema correctly

### Tests (write first)

- [x] T028 [P] [US3] Create `apps/api/src/block/block.service.spec.ts`: unit tests using `Test.createTestingModule` with mock PrismaService (`{ db: { block: { findMany, findFirst, create, update } } }`); test `findAll` calls findMany with correct userId filter; test `findOne` returns block; test `findOne` throws `NotFoundException` when null; test `create` calls prisma.db.block.create; test `update` calls findOne then update; test `remove` soft-deletes with `status: DELETED`
- [x] T029 [P] [US3] Create `apps/api/src/block/block.controller.spec.ts`: unit tests using `Test.createTestingModule` with mock `BlockService`; test each handler delegates to service; no guard runs in unit tests (controller methods called directly)
- [x] T030 [P] [US3] Create `apps/api/test/blocks.e2e-spec.ts`: HTTP integration tests using supertest; override `PrismaService` and `JwtAuthGuard`; set `req.user = { sub: 'user-1', email: 'test@test.com' }` in guard mock; test `GET /blocks` 200 with array; `GET /blocks/:id` 200; `GET /blocks/missing` 404; `POST /blocks` 201; `PATCH /blocks/:id` 200; `DELETE /blocks/:id` 200; all without auth header → 401

### Implementation

- [x] T031 [US3] Update `apps/api/src/block/block.controller.ts`: remove `STUB_USER_ID` constant; add `@CurrentUser() user: JwtPayload` parameter to all 5 handlers and pass `user.sub` as `userId`; replace inline body type annotations with `CreateBlockDto` and `UpdateBlockDto`; add `@ApiTags('blocks')`, `@ApiBearerAuth('access-token')` on the controller class; add `@ApiOperation({ summary: '...' })` and `@ApiResponse(...)` decorators to each handler; add `@ApiParam({ name: 'id', description: 'UUID of the block' })` to handlers with `:id` params (depends on T026, T027)

**Checkpoint**: Authenticated requests to all block endpoints succeed. Unauthenticated requests return 401. Unit and e2e tests pass.

---

## Phase 6: User Story 4 — Interactive API Documentation (Priority: P2)

**Goal**: All API endpoints are visible and executable in the Swagger UI at `/api/docs`. Developers can authenticate and test requests from the browser.

**Independent Test**: `GET /api/docs` → 200 HTML with Swagger UI. `GET /api/docs-json` → 200 JSON with `openapi: '3.0.0'`, `paths` containing `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/blocks`, `/blocks/{id}`.

### Tests (write first)

- [x] T032 [P] [US4] Create `apps/api/test/swagger.e2e-spec.ts`: HTTP tests using supertest with full `AppModule` (no DB override needed for docs endpoint); test `GET /api/docs` → 200; test `GET /api/docs-json` → 200 JSON with `openapi` field and required paths; test Swagger JSON includes `components.securitySchemes.access-token`

### Implementation

- [x] T033 [US4] Update `apps/api/src/main.ts`: after CORS setup, add `DocumentBuilder` with `.setTitle('Blockora API')`, `.setDescription('REST API for Blockora — authentication and block management')`, `.setVersion('1.0')`, `.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' }, 'access-token')`, `.addTag('auth', 'Registration, login, token refresh, and logout')`, `.addTag('blocks', 'CRUD operations for user-owned content blocks')`, `.build()`; call `SwaggerModule.createDocument(app, swaggerConfig)` and `SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { persistAuthorization: true } })` (depends on T025)

**Checkpoint**: `GET /api/docs` renders Swagger UI. All 10 endpoints visible. Authorize button accepts JWT. Protected endpoints show padlock icon.

---

## Phase 7: User Story 5 — Environment Configuration Safety (Priority: P2)

**Goal**: The application refuses to start with any missing or invalid environment variable and prints a clear named error. The `.env.example` file documents every required variable.

**Independent Test**: Start the app with `DATABASE_URL` unset → process exits immediately with message `- DATABASE_URL: ...`. Start with all vars set → app starts normally.

### Tests (write first)

- [x] T034 [P] [US5] Create `apps/api/src/config/env.spec.ts`: unit tests calling `validateEnv()` with mocked `process.env`; test missing `DATABASE_URL` exits with error naming it; test invalid `DATABASE_URL` (not a URL) exits with validation error; test missing `JWT_SECRET` exits; test `JWT_SECRET` shorter than 32 chars exits; test invalid `NODE_ENV` value exits; test valid full env object returns typed `AppConfig` without calling `process.exit`

### Implementation

- [x] T035 [US5] Review and finalize `apps/api/.env.example`: verify it includes all 7 variables from the Zod schema (`DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `PORT`, `CORS_ORIGINS`, `NODE_ENV`); each variable must have a comment line above it explaining its purpose, valid format, and an example value; ensure file is tracked by git (depends on T007)

**Checkpoint**: `env.spec.ts` unit tests all pass. `.env.example` is complete and matches the Zod schema exactly.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Build verification, lint compliance, full test suite validation.

- [x] T036 Run `cd apps/api && yarn build`; fix any TypeScript compilation errors (missing imports, type mismatches, decorator metadata issues)
- [x] T037 [P] Run `cd apps/api && yarn lint`; fix any ESLint issues (the `no-floating-promises` warning is expected; `no-unsafe-*` rules are off per eslint.config.mjs)
- [x] T038 [P] Run `cd apps/api && yarn test`; verify all unit tests pass (auth.service, auth.controller, block.service, block.controller, env specs)
- [x] T039 [P] Run `cd apps/api && yarn test:e2e`; verify all e2e integration tests pass (auth, blocks, cors, swagger e2e specs)

**Checkpoint**: Build passes. Zero lint errors. All 39 tests pass. Ready for code review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — no inter-story deps
- **US2 (Phase 4)**: Depends on US1 Phase 3 (main.ts changes are sequential)
- **US3 (Phase 5)**: Depends on Foundational; independently testable after US1 auth guard exists
- **US4 (Phase 6)**: Depends on US2 (main.ts CORS must precede Swagger setup in same file)
- **US5 (Phase 7)**: Depends on Foundational (env.ts created in Phase 2)
- **Polish (Phase 8)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Must complete first — auth is the foundation
- **US2 (P1)**: Depends on US1 main.ts changes (sequential file edits)
- **US3 (P2)**: Can start after Foundational completes and JwtAuthGuard exists (Phase 3 T018)
- **US4 (P2)**: Can start after US2 completes (sequential main.ts edits)
- **US5 (P2)**: Can start after Foundational (env.ts in Phase 2)

### Within Each Story Phase

- All DTOs in a phase marked [P] can be written simultaneously
- All test files in a phase marked [P] can be written simultaneously
- Implementation files follow after DTOs + tests exist
- Module wiring (app.module.ts) is last in US1

### Parallel Opportunities

- T003 and T004 can run in parallel (different files)
- T007, T008, T009, T010 can all run in parallel (independent files)
- T011, T012, T013 (DTOs) can run in parallel
- T014, T015 (test files) can run in parallel
- T026, T027, T028, T029, T030 (US3 prep) can all run in parallel
- T036, T037, T038, T039 (Polish) can run in parallel

---

## Parallel Examples

### Parallel Example: US1 Foundational Files (Phase 2)

```
Task A: "Create apps/api/src/auth/types/jwt-payload.type.ts (T008)"
Task B: "Create apps/api/src/auth/decorators/public.decorator.ts (T009)"
Task C: "Create apps/api/src/auth/decorators/current-user.decorator.ts (T010)"
Task D: "Create apps/api/.env.example (T007)"
```

### Parallel Example: US1 Prep (Phase 3 start)

```
Task A: "Create apps/api/src/auth/dto/register.dto.ts (T011)"
Task B: "Create apps/api/src/auth/dto/login.dto.ts (T012)"
Task C: "Create apps/api/src/auth/dto/refresh.dto.ts (T013)"
```

### Parallel Example: US3 Prep (Phase 5 start)

```
Task A: "Create apps/api/src/block/dto/create-block.dto.ts (T026)"
Task B: "Create apps/api/src/block/dto/update-block.dto.ts (T027)"
Task C: "Create apps/api/src/block/block.service.spec.ts (T028)"
Task D: "Create apps/api/src/block/block.controller.spec.ts (T029)"
Task E: "Create apps/api/test/blocks.e2e-spec.ts (T030)"
```

---

## Implementation Strategy

### MVP First (US1 + US2 — full auth + CORS)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T010)
3. Complete Phase 3: US1 Registration & Login (T011–T023)
4. Complete Phase 4: US2 CORS (T024–T025)
5. **STOP and VALIDATE**: Authenticate via `POST /auth/login`, call `GET /auth/me` with token, verify CORS headers from allowed origin
6. Deploy backend → frontend can now integrate

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 (Register, Login, Refresh, Logout, Me) → auth works ✅
3. US2 (CORS) → frontend can connect ✅
4. US3 (Blocks with real auth) → core feature works ✅
5. US4 (Swagger docs) → developers can self-serve ✅
6. US5 (Env config safety) → deployment-safe ✅
7. Polish → production-ready ✅

### Single Developer Sequential Order

```
T001 → T002 → T003 → T004 →
T005 → T006 → T007 → T008 → T009 → T010 →
T011 → T012 → T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023 →
T024 → T025 →
T026 → T027 → T028 → T029 → T030 → T031 →
T032 → T033 →
T034 → T035 →
T036 → T037 → T038 → T039
```

---

## Summary

| Phase | Story | Tasks | Can Parallelize |
|-------|-------|-------|-----------------|
| Phase 1: Setup | — | T001–T004 (4) | T003, T004 |
| Phase 2: Foundational | — | T005–T010 (6) | T007, T008, T009, T010 |
| Phase 3: US1 Registration & Login | US1 | T011–T023 (13) | T011–T013, T014–T015 |
| Phase 4: US2 CORS | US2 | T024–T025 (2) | T024 |
| Phase 5: US3 Block Management | US3 | T026–T031 (6) | T026–T030 |
| Phase 6: US4 API Docs | US4 | T032–T033 (2) | T032 |
| Phase 7: US5 Env Safety | US5 | T034–T035 (2) | T034 |
| Phase 8: Polish | — | T036–T039 (4) | T037, T038, T039 |
| **Total** | | **39 tasks** | **18 parallelizable** |

**Suggested MVP scope**: Phases 1–4 (T001–T025) — auth + CORS working, frontend can connect.
