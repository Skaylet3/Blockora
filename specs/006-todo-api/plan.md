# Implementation Plan: Todo API with Block Promotion

**Branch**: `006-todo-api` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-todo-api/spec.md`

---

## Summary

Add a `Todo` entity to the NestJS backend with full CRUD, priority (5 levels), and status (active/completed). Provide a dedicated promotion endpoint that converts a `Block` of type `TASK` into an independent `Todo` record without touching the block. The implementation follows the established module → controller → service → Prisma pattern and adds a new `Todo` Prisma model with two new enums.

---

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode, ES2023 target, nodenext modules)
**Primary Dependencies**: NestJS 11, Prisma 7 + @prisma/adapter-pg, class-validator, class-transformer, @nestjs/swagger, Vitest 3
**Storage**: PostgreSQL via Prisma 7 — one new model (`Todo`) and two new enums (`TodoPriority`, `TodoStatus`)
**Testing**: Vitest 3 + unit tests for service and controller (matching existing `*.spec.ts` pattern)
**Target Platform**: Linux server (same as existing API)
**Project Type**: Web service (NestJS REST API inside Turborepo monorepo, `apps/api`)
**Performance Goals**: List queries under 200ms (indexed by userId and userId+status)
**Constraints**: All queries scoped to authenticated user (Principle II). No pagination at MVP (Principle III).
**Scale/Scope**: Single-user personal todo list; no team features.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I — Blocks Are Atomic | ✅ PASS | Block model is read-only in this feature. No block schema changes. |
| II — Privacy by Default | ✅ PASS | All queries include `userId` scope. Promotion validates ownership. |
| III — Simplicity Over Features | ✅ PASS | Tasks are in defined MVP scope (constitution §VIII). No due dates, labels, pagination, or sub-tasks. |
| IV — Performance is a Feature | ✅ PASS | Two DB indexes planned: `(userId)` and `(userId, status)`. |
| V — Type-Safe and Test-Driven | ✅ PASS | TypeScript strict, class-validator DTOs, Prisma enums, Vitest unit tests required. |
| VI — Monorepo Discipline | ✅ PASS | All changes in `apps/api`. No cross-app imports. Frontend not touched by this feature. |
| VIII — Tasks System | ✅ PASS | Implementing exactly what Principle VIII defines. |

**No violations. No Complexity Tracking required.**

---

## Project Structure

### Documentation (this feature)

```text
specs/006-todo-api/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── api-contracts.md ← Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code Changes

```text
apps/api/
├── prisma/
│   └── schema.prisma                        ← ADD TodoPriority enum, TodoStatus enum, Todo model; ADD User.todos relation
│
└── src/
    ├── app.module.ts                         ← ADD TodoModule import
    └── todo/                                 ← NEW module (mirrors block/ structure)
        ├── dto/
        │   ├── create-todo.dto.ts            ← title, description?, priority?
        │   ├── promote-block.dto.ts          ← priority? (promotion request body)
        │   ├── todo-filter.dto.ts            ← status? (query param for GET /todos)
        │   ├── update-todo.dto.ts            ← PartialType(CreateTodoDto) + status?
        │   └── todo-response.dto.ts          ← id, userId, title, description, priority, status, createdAt, updatedAt
        ├── todo.controller.ts                ← GET, POST, PATCH, DELETE + POST from-block
        ├── todo.controller.spec.ts           ← unit tests
        ├── todo.module.ts                    ← Module declaration
        ├── todo.service.ts                   ← Business logic + Prisma queries
        └── todo.service.spec.ts              ← unit tests
```

**Structure Decision**: Option 2 (monorepo web application). Backend-only change. All new code in `apps/api/src/todo/` mirroring the existing `block/` module structure exactly.

---

## Implementation Steps

### Step 1 — Prisma Schema Update

**File**: `apps/api/prisma/schema.prisma`

Add:
- `enum TodoPriority { HIGHEST HIGH MEDIUM LOW LOWEST }`
- `enum TodoStatus { ACTIVE COMPLETED }`
- `model Todo { ... }` (see data-model.md for full schema)
- `todos Todo[] @relation("UserTodos")` on the `User` model

Run migration:
```bash
cd apps/api && yarn prisma migrate dev --name add-todo-model
```

Regenerate Prisma client:
```bash
yarn prisma generate
```

---

### Step 2 — DTOs

**`create-todo.dto.ts`**
- `title: string` — `@IsString() @MinLength(1)`
- `description?: string` — `@IsOptional() @IsString()`
- `priority?: TodoPriority` — `@IsOptional() @IsEnum(TodoPriority)`, default handled in service

**`update-todo.dto.ts`**
- Extend `PartialType(CreateTodoDto)` from `@nestjs/swagger`
- Add `status?: TodoStatus` — `@IsOptional() @IsEnum(TodoStatus)`

**`promote-block.dto.ts`**
- `priority?: TodoPriority` — `@IsOptional() @IsEnum(TodoPriority)`

**`todo-filter.dto.ts`**
- `status?: TodoStatus` — `@IsOptional() @IsEnum(TodoStatus)`
- Decorated with `@ApiPropertyOptional()` for Swagger

**`todo-response.dto.ts`**
- All fields with `@ApiProperty()` decorators matching the contract shape

---

### Step 3 — TodoService

**File**: `apps/api/src/todo/todo.service.ts`

Methods:
- `findAll(userId, status?)` — `db.todo.findMany({ where: { userId, ...(status && { status }) }, orderBy: { createdAt: 'desc' } })`
- `findOne(id, userId)` — `db.todo.findFirst({ where: { id, userId } })` + throw `NotFoundException` if null
- `create(userId, dto)` — `db.todo.create({ data: { userId, ...dto } })`
- `update(id, userId, dto)` — call `findOne` first (ownership check), then `db.todo.update`
- `remove(id, userId)` — call `findOne` first (ownership check), then `db.todo.delete`
- `promoteBlock(blockId, userId, priority?)` — read block with `findFirst({ where: { id: blockId, userId, status: { not: BlockStatus.DELETED } } })`, validate type === `BlockType.TASK`, then `db.todo.create` using block.title

**Error handling**:
- `NotFoundException('Todo not found')` — when todo doesn't exist or belongs to another user
- `NotFoundException('Block not found')` — when block doesn't exist or isn't owned
- `BadRequestException('Block type must be TASK to promote')` — when block.type !== TASK

---

### Step 4 — TodoController

**File**: `apps/api/src/todo/todo.controller.ts`

```
@ApiTags('todos')
@ApiBearerAuth('access-token')
@Controller('todos')
```

Routes:
- `GET /todos` — `findAll(@CurrentUser() user, @Query() filter: TodoFilterDto)`
- `GET /todos/:id` — `findOne(@Param('id') id, @CurrentUser() user)`
- `POST /todos` — `create(@CurrentUser() user, @Body() dto: CreateTodoDto)`
- `PATCH /todos/:id` — `update(@Param('id') id, @CurrentUser() user, @Body() dto: UpdateTodoDto)`
- `DELETE /todos/:id` — `remove(@Param('id') id, @CurrentUser() user)`
- `POST /todos/from-block/:blockId` — `promoteBlock(@Param('blockId') blockId, @CurrentUser() user, @Body() dto: PromoteBlockDto)`

All routes include `@ApiOperation`, `@ApiResponse` decorators.

**Important**: The `from-block/:blockId` route must be declared BEFORE `/:id` in the controller to avoid NestJS routing ambiguity (static segment `from-block` must not be matched as a dynamic `:id`).

---

### Step 5 — TodoModule

**File**: `apps/api/src/todo/todo.module.ts`

```typescript
@Module({
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule {}
```

No inter-module imports needed — `PrismaModule` is already global.

---

### Step 6 — AppModule Registration

**File**: `apps/api/src/app.module.ts`

Add `TodoModule` to the `imports` array.

---

### Step 7 — Unit Tests

**`todo.service.spec.ts`**: Mock `PrismaService` with `{ db: { todo: {...fns}, block: {...fns} } }`. Test each service method including the promotion path.

**`todo.controller.spec.ts`**: Mock `TodoService`. Test route → service delegation.

Test cases to cover:
- `findAll` returns user-scoped results
- `findAll` with status filter passes filter to service
- `findOne` throws 404 for missing or other-user's todo
- `create` defaults priority to MEDIUM when not provided
- `update` applies partial updates
- `remove` deletes permanently (hard delete, not soft)
- `promoteBlock` creates todo from block.title
- `promoteBlock` throws 400 when block.type !== TASK
- `promoteBlock` throws 404 when block not found or not owned

---

## Quickstart Reference

See [quickstart.md](./quickstart.md) for migration commands and local dev setup.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Route ambiguity: `from-block/:blockId` vs `/:id` | Declare `from-block/:blockId` route BEFORE `/:id` in the controller |
| Promoted todos orphaned when block is deleted | No FK between Todo and Block — by design. Todos are independent. |
| Double-promotion creates duplicate todos | Spec explicitly allows this (each promotion = independent task). No dedup logic needed. |
| Prisma client not regenerated after schema change | Migration script runs `prisma generate` automatically |
